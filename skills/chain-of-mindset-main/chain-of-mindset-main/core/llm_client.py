import os
import httpx
import threading
import time
from typing import List, Dict, Any, Optional, Union, Generator
from openai import OpenAI, AzureOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import openai
from utils.image_utils import format_image_for_llm


class StreamTimeoutError(Exception):
    """Stream output timeout exception."""
    pass

class LLMClient:
    """LLM client wrapper with OpenAI-compatible interface."""
    def __init__(self, config):
        if config is None:
            raise ValueError("❌ LLMClient requires a valid config object. Please provide a configuration.")
            
        self.config = config
        
        self.client_type = self.config.get("client_type", "openai")
        self.api_key = self.config.get("api_key")
        self.base_url = self.config.get("base_url")
        self.model = self.config.get("model")
        
        self.stop_strategy = self.config.get("stop_strategy", "native")
        self.default_headers = self.config.get("default_headers", None)
        self.extra_body = self.config.get("extra_body", None)

        self.streaming_read_timeout = self.config.get("streaming_read_timeout", 180.0)
        self.standard_timeout = self.config.get("standard_timeout", 300.0)
        self.stream_idle_timeout = self.config.get("stream_idle_timeout", 100.0)
        
        if self.client_type == "azure":
            self.client = AzureOpenAI(
                api_key=self.api_key,
                api_version=self.config.get("api_version", "2023-05-15"),
                azure_endpoint=self.base_url,
                timeout=self.standard_timeout
            )
        else:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                timeout=self.standard_timeout,
                default_headers=self.default_headers
            )
            
        self.total_tokens = 0

    def construct_message(self, role: str, text: str, image_paths: Optional[List[str]] = None) -> Dict[str, Any]:
        """Construct a multimodal message."""
        if not image_paths:
            return {"role": role, "content": text}
            
        content_list = [{"type": "text", "text": text}]
        
        for img_path in image_paths:
            content_list.append({
                "type": "image_url",
                "image_url": {
                    "url": img_path
                }
            })
                
        return {"role": role, "content": content_list}

    def _process_messages_for_api(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process messages before sending to API: convert local image paths to Base64."""
        processed_messages = []
        
        for msg in messages:
            new_msg = msg.copy()
            content = new_msg.get("content")
            
            if isinstance(content, list):
                new_content = []
                for item in content:
                    if item.get("type") == "image_url":
                        url = item.get("image_url", {}).get("url", "")
                        if url and not url.startswith("http") and not url.startswith("data:"):
                            image_payload = format_image_for_llm(url)
                            if image_payload:
                                new_content.append(image_payload)
                            else:
                                new_content.append({
                                    "type": "text", 
                                    "text": f"\n[System Warning: Failed to load image at {url}]\n"
                                })
                        else:
                            new_content.append(item)
                    else:
                        new_content.append(item)
                new_msg["content"] = new_content
            
            processed_messages.append(new_msg)
            
        return processed_messages

    @retry(
        retry=retry_if_exception_type((openai.RateLimitError, openai.APIConnectionError, openai.APITimeoutError, openai.NotFoundError)),
        wait=wait_exponential(multiplier=2, min=5, max=120),
        stop=stop_after_attempt(8)
    )
    def chat(self, 
             messages: List[Dict[str, Any]], 
             stop: Optional[List[str]] = None,
             temperature: Optional[float] = None,
             max_tokens: Optional[int] = None) -> str:
        """Execute chat completion (synchronous interface)."""
        chunks = []
        for chunk in self._stream_impl(messages, stop, temperature, max_tokens):
            chunks.append(chunk)
        return "".join(chunks)

    def chat_stream(self, 
             messages: List[Dict[str, Any]], 
             stop: Optional[List[str]] = None,
             temperature: Optional[float] = None,
             max_tokens: Optional[int] = None) -> Generator[str, None, None]:
        """Execute chat completion (streaming interface)."""
        max_retries = 8
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    import random
                    delay = min(retry_delay * (2 ** attempt) + random.uniform(0, 5), 120)
                    print(f"🔄 [Retry {attempt}/{max_retries}] Waiting {delay:.1f}s before retry...")
                    time.sleep(delay)
                
                for chunk in self._stream_impl(messages, stop, temperature, max_tokens):
                    yield chunk
                return
                
            except (openai.RateLimitError, openai.APIConnectionError, openai.APITimeoutError, openai.NotFoundError, openai.BadRequestError) as e:
                is_provider_error = "No allowed providers" in str(e) or "Provider returned error" in str(e)
                is_retryable = isinstance(e, (openai.RateLimitError, openai.APIConnectionError, openai.APITimeoutError, openai.NotFoundError)) or is_provider_error
                
                if is_retryable and attempt < max_retries - 1:
                    print(f"⚠️ [Attempt {attempt + 1}/{max_retries}] {type(e).__name__}: {e}")
                    continue
                else:
                    print(f"❌ [All {max_retries} attempts failed] {e}")
                    raise

    def _stream_impl(self, 
                     messages: List[Dict[str, Any]], 
                     stop: Optional[List[str]] = None,
                     temperature: Optional[float] = None,
                     max_tokens: Optional[int] = None) -> Generator[str, None, None]:
        """Core streaming implementation."""
        api_messages = self._process_messages_for_api(messages)
        
        if self.stop_strategy == "manual" and stop:
            yield from self._stream_with_manual_stop(api_messages, stop, temperature, max_tokens)
            return

        temp = temperature if temperature is not None else self.config.get("temperature", 0.7)
        max_tok = max_tokens if max_tokens is not None else self.config.get("max_tokens", 4096)
        
        stream_timeout = httpx.Timeout(
            timeout=None,
            read=float(self.streaming_read_timeout), 
            connect=60.0, 
            write=60.0, 
            pool=60.0
        )

        try:
            request_params = {
                "model": self.model,
                "messages": api_messages,
                "temperature": temp,
                "max_tokens": max_tok,
                "stop": stop,
                "stream": True,
                "stream_options": {"include_usage": True},
                "timeout": stream_timeout
            }
            
            if self.extra_body:
                request_params["extra_body"] = self.extra_body
            
            stream = self.client.chat.completions.create(**request_params)

            yield from self._iterate_stream_with_timeout(stream)

        except StreamTimeoutError:
            raise
        except openai.NotFoundError as e:
            print(f"⚠️ [Provider Unavailable] {e} - Will retry automatically...")
            raise
        except Exception as e:
            import traceback
            print(f"❌ Stream Error: {e}")
            print(f"❌ Traceback: {traceback.format_exc()}")
            raise e

    def _stream_with_manual_stop(self, 
                                 messages: List[Dict[str, Any]], 
                                 stop_tokens: List[str],
                                 temperature: Optional[float] = None,
                                 max_tokens: Optional[int] = None) -> Generator[str, None, None]:
        """Stream generator with manual stop token handling."""
        temp = temperature if temperature is not None else self.config.get("temperature", 0.7)
        max_tok = max_tokens if max_tokens is not None else self.config.get("max_tokens", 4096)
        
        stream_timeout = httpx.Timeout(
            timeout=None,
            read=float(self.streaming_read_timeout), 
            connect=60.0, 
            write=60.0, 
            pool=60.0
        )
        
        timeout_seconds = self.stream_idle_timeout
        timeout_event = threading.Event()
        last_chunk_time = [time.time()]
        watchdog_stop = threading.Event()
        stream_ref = [None]
        
        def watchdog():
            """Watchdog thread to detect stream timeout."""
            while not watchdog_stop.is_set():
                elapsed = time.time() - last_chunk_time[0]
                if elapsed > timeout_seconds:
                    timeout_event.set()
                    print(f"\n⏰ [Stream Timeout] No chunk received for {elapsed:.1f}s (limit: {timeout_seconds}s)")
                    try:
                        if stream_ref[0] is not None:
                            stream_ref[0].close()
                    except Exception:
                        pass
                    return
                watchdog_stop.wait(1.0)

        try:
            request_params = {
                "model": self.model,
                "messages": messages,
                "temperature": temp,
                "max_tokens": max_tok,
                "stop": None,
                "stream": True,
                "stream_options": {"include_usage": True},
                "timeout": stream_timeout
            }
            
            if self.extra_body:
                request_params["extra_body"] = self.extra_body
            
            stream = self.client.chat.completions.create(**request_params)
            stream_ref[0] = stream
            
            watchdog_thread = threading.Thread(target=watchdog, daemon=True)
            watchdog_thread.start()
            
            buffer = ""
            
            for chunk in stream:
                if timeout_event.is_set():
                    raise StreamTimeoutError(f"Stream idle timeout: no chunk for {timeout_seconds}s")
                
                last_chunk_time[0] = time.time()
                
                if chunk.usage and chunk.usage.total_tokens is not None:
                    self.total_tokens += chunk.usage.total_tokens
                
                if not chunk.choices or not chunk.choices[0].delta.content:
                    continue
                    
                content = chunk.choices[0].delta.content
                buffer += content
                
                found_stop = False
                earliest_stop_index = -1
                
                for token in stop_tokens:
                    idx = buffer.find(token)
                    if idx != -1:
                        if earliest_stop_index == -1 or idx < earliest_stop_index:
                            earliest_stop_index = idx
                            found_stop = True
                
                if found_stop:
                    if earliest_stop_index > 0:
                        yield buffer[:earliest_stop_index]
                    return

                longest_partial_match = 0
                for token in stop_tokens:
                    for i in range(1, len(token)):
                        if buffer.endswith(token[:i]):
                            if i > longest_partial_match:
                                longest_partial_match = i
                
                if longest_partial_match > 0:
                    safe_part = buffer[:-longest_partial_match]
                    if safe_part:
                        yield safe_part
                        buffer = buffer[-longest_partial_match:]
                else:
                    yield buffer
                    buffer = ""
            
            if buffer:
                yield buffer
        
        except StreamTimeoutError:
            raise
        except openai.NotFoundError as e:
            print(f"⚠️ [Provider Unavailable] {e} - Will retry automatically...")
            raise
        except Exception as e:
            if timeout_event.is_set():
                raise StreamTimeoutError(f"Stream idle timeout: no chunk for {timeout_seconds}s")
            import traceback
            print(f"❌ Manual Stream Error: {e}")
            print(f"❌ Traceback: {traceback.format_exc()}")
            raise e
        finally:
            watchdog_stop.set()
            stream_ref[0] = None

    def _iterate_stream_with_timeout(self, stream) -> Generator[str, None, None]:
        """Stream iterator with timeout detection."""
        timeout_seconds = self.stream_idle_timeout
        timeout_event = threading.Event()
        last_chunk_time = [time.time()]
        watchdog_stop = threading.Event()
        stream_ref = [stream]
        
        def watchdog():
            """Watchdog thread to detect stream timeout."""
            while not watchdog_stop.is_set():
                elapsed = time.time() - last_chunk_time[0]
                if elapsed > timeout_seconds:
                    timeout_event.set()
                    print(f"\n⏰ [Stream Timeout] No chunk received for {elapsed:.1f}s (limit: {timeout_seconds}s)")
                    try:
                        if stream_ref[0] is not None:
                            stream_ref[0].close()
                    except Exception:
                        pass
                    return
                watchdog_stop.wait(1.0)
        
        watchdog_thread = threading.Thread(target=watchdog, daemon=True)
        watchdog_thread.start()
        
        try:
            for chunk in stream:
                if timeout_event.is_set():
                    raise StreamTimeoutError(f"Stream idle timeout: no chunk for {timeout_seconds}s")
                
                last_chunk_time[0] = time.time()
                
                if chunk.usage and chunk.usage.total_tokens is not None:
                    self.total_tokens += chunk.usage.total_tokens
                
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        
        except Exception as e:
            if timeout_event.is_set():
                raise StreamTimeoutError(f"Stream idle timeout: no chunk for {timeout_seconds}s")
            raise
                    
        finally:
            watchdog_stop.set()
            stream_ref[0] = None
            watchdog_thread.join(timeout=2.0)

    def chat_with_retry(self, *args, **kwargs):
        """Wrapper to handle exceptions after retries are exhausted."""
        try:
            return self.chat(*args, **kwargs)
        except Exception as e:
            print(f"❌ LLM API Error (after retries): {e}")
            return f"[Error: {str(e)}]"

    def get_usage(self) -> int:
        return self.total_tokens
