import logging
import time
import os
import re
import json
from typing import List, Dict, Any, Optional, Tuple

from core.llm_client import LLMClient
from core.image_client import ImageGenClient
from core.protocol import ParadigmToken, ParadigmOutput
from core.gate import Gate
from core.sandbox import LocalSandbox  # For Spatial matplotlib execution
from paradigms.registry import ParadigmRegistry
from utils.ui_utils import Spinner
from prompts.system import get_system_prompt

class Orchestrator:
    """Core Orchestrator (The Brain)."""
    def __init__(self, meta_llm_config, image_config, session_dir, 
                 gate_config_path: Optional[str] = None, 
                 mindset_llm_config=None,
                 sandbox=None,
                 enabled_modes: Optional[List[str]] = None,
                 disable_input_gate: bool = False,
                 disable_output_gate: bool = False,
                 custom_system_prompt: Optional[str] = None):
        self.custom_system_prompt = custom_system_prompt
        self.enabled_modes = enabled_modes
        self.disable_input_gate = disable_input_gate
        self.disable_output_gate = disable_output_gate
        
        self.session_dir = session_dir
        
        self.llm = LLMClient(config=meta_llm_config)
        
        if mindset_llm_config is None:
            mindset_llm_config = meta_llm_config
        self.mindset_llm = LLMClient(config=mindset_llm_config)
        
        if image_config is not None:
            self.image_gen = ImageGenClient(config=image_config)
        else:
            self.image_gen = None
        
        self.sandbox = sandbox if sandbox else LocalSandbox()
        
        self.gate = self._init_gate(meta_llm_config, gate_config_path)
        
        ParadigmRegistry.initialize_registry(
            self.mindset_llm, 
            self.image_gen, 
            sandbox=self.sandbox,
            enabled_modes=self.enabled_modes
        )
        
        self.history: List[Dict[str, Any]] = []
        self.max_turns = meta_llm_config.get("max_turns", 20)
        self.global_tool_call_id = 0
        
        self.artifact_registry: Dict[str, Dict[str, Any]] = {}
        self.task_context: str = ""
        self.current_step: int = 0
        self.image_registry: Dict[str, str] = {}
        
        self._init_history()
    
    def _init_gate(self, fallback_config: dict, gate_config_path: Optional[str] = None) -> Gate:
        """Initialize Context Gate with dedicated config."""
        gate_config = None
        
        if gate_config_path and os.path.exists(gate_config_path):
            try:
                with open(gate_config_path, "r", encoding="utf-8") as f:
                    gate_config = json.load(f)
                return Gate(gate_config)
            except Exception as e:
                pass
        
        configs_dir = os.path.join(os.path.dirname(__file__), "../configs")
        api_config_path = os.path.join(configs_dir, "gate_config_api.json")
        local_config_path = os.path.join(configs_dir, "gate_config_local.json")
        
        if os.path.exists(local_config_path):
            try:
                with open(local_config_path, "r", encoding="utf-8") as f:
                    gate_config = json.load(f)
            except Exception as e:
                pass
        
        if gate_config is None and os.path.exists(api_config_path):
            try:
                with open(api_config_path, "r", encoding="utf-8") as f:
                    gate_config = json.load(f)
            except Exception as e:
                pass
        
        if gate_config is None:
            gate_config = fallback_config
        
        return Gate(gate_config)

    def _init_history(self):
        system_prompt = self.custom_system_prompt if self.custom_system_prompt else get_system_prompt()
        self.history = [
            self.llm.construct_message("system", system_prompt)
        ]

    def run(self, user_query: str, image_paths: Optional[List[str]] = None) -> str:
        """Execute reasoning task."""
        if image_paths:
            for i, path in enumerate(image_paths, 1):
                artifact_id = f"IMG_{i:03d}"
                self.artifact_registry[artifact_id] = {
                    "type": "image",
                    "source": "user_input",
                    "path": path,
                    "step": 0
                }
                self.image_registry[f"image{i}"] = path
        
        self.task_context = user_query
        
        if image_paths and self.artifact_registry:
            available_assets = ", ".join([f"[{k}]" for k in self.artifact_registry.keys()])
            user_message = f"{user_query}\n\n[Available Visual Assets: {available_assets}]"
        else:
            user_message = user_query
        
        self.history.append(self.llm.construct_message("user", user_message, image_paths=image_paths))

        turn = 0
        final_answer = ""

        while turn < self.max_turns:
            turn += 1
            self.current_step = turn

            stop_tokens = ParadigmToken.get_stop_tokens()
            
            full_response = ""
            try:
                stream_generator = self.llm.chat_stream(self.history, stop=stop_tokens)
                for chunk in stream_generator:
                    print(chunk, end="", flush=True)
                    full_response += chunk
            except Exception as e:
                print(f"\n❌ [Stream Error] {e}")
                full_response += f"\n[Error: {str(e)}]"
            
            print()
            response_text = full_response
            
            triggered_paradigm = None
            trigger_token_used = None
            
            for token in ParadigmRegistry.get_all_trigger_tokens():
                if token in response_text:
                    trigger_token_used = token
                    triggered_paradigm = ParadigmRegistry.get_by_trigger_token(token)
                    break
            
            if not triggered_paradigm and ParadigmToken.ANSWER_START in response_text:
                
                if ParadigmToken.ANSWER_END not in response_text:
                     response_text += ParadigmToken.ANSWER_END
                     print(ParadigmToken.ANSWER_END, end="", flush=True)
                
                parts = response_text.split(ParadigmToken.ANSWER_START)
                final_content = parts[-1].strip()
                if ParadigmToken.ANSWER_END in final_content:
                    final_content = final_content.split(ParadigmToken.ANSWER_END)[0].strip()
                
                self.history.append(self.llm.construct_message("assistant", response_text))
                final_answer = final_content
                break
            
            if not triggered_paradigm:
                if ParadigmToken.THINK_START in response_text and ParadigmToken.THINK_END not in response_text:
                    response_text += ParadigmToken.THINK_END
                    print(ParadigmToken.THINK_END, end="", flush=True)

                if ParadigmToken.INSIGHT_START in response_text and ParadigmToken.INSIGHT_END not in response_text:
                    response_text += ParadigmToken.INSIGHT_END
                    print(ParadigmToken.INSIGHT_END, end="", flush=True)
                    
                if ParadigmToken.ANSWER_START in response_text and ParadigmToken.ANSWER_END not in response_text:
                    response_text += ParadigmToken.ANSWER_END
                    print(ParadigmToken.ANSWER_END, end="", flush=True)

                self.history.append(self.llm.construct_message("assistant", response_text))
                continue
            
            parts = response_text.split(trigger_token_used)
            pre_instruction = parts[0]
            
            if ParadigmToken.INSIGHT_START in pre_instruction and ParadigmToken.INSIGHT_END not in pre_instruction:
                fix_tag = ParadigmToken.INSIGHT_END
                pre_instruction += fix_tag
                print(fix_tag, end="", flush=True)
                
            if ParadigmToken.THINK_START in pre_instruction and ParadigmToken.THINK_END not in pre_instruction:
                fix_tag = ParadigmToken.THINK_END
                pre_instruction += fix_tag
                print(fix_tag, end="", flush=True)
            
            instruction_raw = parts[-1]
            
            end_token = triggered_paradigm.end_token
            if end_token in instruction_raw:
                instruction = instruction_raw.split(end_token)[0].strip()
                print(end_token, flush=True)
                response_text = pre_instruction + trigger_token_used + instruction + end_token
            else:
                instruction = instruction_raw.strip()
            
            if end_token not in response_text:
                 print(end_token, flush=True)
                 full_thought = response_text + end_token
            else:
                 full_thought = response_text
                 
            self.history.append(self.llm.construct_message("assistant", full_thought))
            
            self.global_tool_call_id += 1
            log_filename = f"{self.global_tool_call_id}_{triggered_paradigm.name.lower()}.log"
            log_path = os.path.join(self.session_dir, log_filename)
            
            if self.disable_input_gate:
                mindset_input = f"## Task\n{instruction}"
                gate_inject_images = [
                    v["path"] for k, v in self.artifact_registry.items() 
                    if v.get("type") == "image" and v.get("path")
                ]
                print(f"⚙️ [Config] Input Gate BYPASSED for {triggered_paradigm.name}, injecting {len(gate_inject_images)} image(s) from registry")
            else:
                source_history = Gate.format_history(self.history[:-1])
                mindset_input, gate_inject_images = self.gate.input_gate(
                    source_history=source_history,
                    call=instruction,
                    target_mindset=triggered_paradigm.name,
                    artifact_registry=self.artifact_registry,
                    log_path=log_path
                )
            
            if gate_inject_images:
                print(f"🚪 [Input Gate] Context extracted for {triggered_paradigm.name}, injecting {len(gate_inject_images)} image(s)")
            else:
                print(f"🚪 [Input Gate] Context extracted for {triggered_paradigm.name}")

            try:
                referenced_images = gate_inject_images
                if referenced_images:
                    img_ids = [os.path.basename(p) for p in referenced_images]
                    print(f"🖼️ [Visual Assets] Gate selected: {img_ids}")
                
                context = {
                    "session_dir": self.session_dir,
                    "log_path": log_path,
                    "artifact_registry": self.artifact_registry,
                    "referenced_images": referenced_images
                }
                
                if log_path:
                    try:
                        with open(log_path, "a", encoding="utf-8") as f:
                            f.write(f"<input_gate_context>\n{mindset_input}\n</input_gate_context>\n\n")
                    except Exception:
                        pass
                
                with Spinner(f"Executing {triggered_paradigm.name}...", delay=0.1):
                    paradigm_output: ParadigmOutput = triggered_paradigm.execute(mindset_input, context=context)
                    
            except Exception as e:
                if not log_path:
                     log_path = os.path.join(self.session_dir, f"{self.global_tool_call_id}_{triggered_paradigm.name.lower()}.log")
                
                paradigm_output = ParadigmOutput(
                    status="FAILED",
                    summary=f"System Error: {str(e)}",
                    raw_output=str(e)
                )

            if self.disable_output_gate:
                extracted_result = paradigm_output.raw_output
                print(f"⚙️ [Config] Output Gate BYPASSED - raw_output passed directly")
            else:
                extracted_result = self.gate.output_gate(
                    mindset_output=paradigm_output.raw_output,
                    call=instruction,
                    new_artifacts=paradigm_output.artifacts,
                    log_path=log_path
                )
                print(f"🚪 [Output Gate] Results extracted")
            
            result_start_token = ParadigmToken.PARADIGMS[triggered_paradigm.name.lower()]['res_start']
            result_end_token = ParadigmToken.PARADIGMS[triggered_paradigm.name.lower()]['res_end']
            
            full_result = f"{result_start_token}\n{extracted_result}\n{result_end_token}"
            
            print(full_result)
            
            if log_path:
                try:
                    with open(log_path, "a", encoding="utf-8") as f:
                        f.write(f"<output_gate_result>\n{full_result}\n</output_gate_result>\n\n")
                except Exception:
                    pass
            
            self.history[-1]["content"] += f"\n{full_result}"
            
            if paradigm_output.artifacts:
                for artifact_path in paradigm_output.artifacts:
                    artifact_id = f"IMG_{len(self.artifact_registry) + 1:03d}"
                    self.artifact_registry[artifact_id] = {
                        "type": "image",
                        "source": f"{triggered_paradigm.name.lower()}_generated",
                        "path": artifact_path,
                        "step": self.current_step
                    }
                    new_key = f"image{len(self.image_registry) + 1}"
                    self.image_registry[new_key] = artifact_path
                    print(f"📷 [Working Context] Registered {artifact_id} -> {os.path.basename(artifact_path)}")

        if turn >= self.max_turns:
            print("⚠️ [Warning] Max turns reached.")
            
        return final_answer

    def _parse_and_resolve_image_references(self, instruction: str) -> List[str]:
        """Parse image references in instruction and return paths."""
        pattern = r'\[(IMG_\d{3}|GEN_\d{3})\]'
        matches = re.findall(pattern, instruction)
        
        referenced_paths = []
        for ref_id in matches:
            if ref_id in self.artifact_registry:
                path = self.artifact_registry[ref_id]["path"]
                referenced_paths.append(path)
                print(f"   📎 Resolved [{ref_id}] -> {os.path.basename(path)}")
            else:
                print(f"   ⚠️ [{ref_id}] not found in registry")
        
        return referenced_paths
    
    def _get_all_visual_assets(self) -> List[str]:
        """Get all registered image paths."""
        return [
            artifact["path"] 
            for artifact in self.artifact_registry.values() 
            if artifact["type"] == "image"
        ]
    
    def get_working_context_summary(self) -> Dict[str, Any]:
        """Get working context summary for debugging."""
        return {
            "artifact_registry": self.artifact_registry,
            "task_context": self.task_context,
            "current_step": self.current_step
        }
    
    def export_for_long_term_memory(self) -> Dict[str, Any]:
        """Export content for long-term memory."""
        return {
            "artifacts": list(self.artifact_registry.values()),
            "task_context": self.task_context,
            "total_steps": self.current_step
        }
    
    def get_total_tokens(self) -> Dict[str, int]:
        """Get total token consumption statistics."""
        main_tokens = getattr(self.llm, "total_tokens", 0)
        gate_tokens = getattr(self.gate.llm, "total_tokens", 0) if self.gate else 0
        
        return {
            "main_llm": main_tokens,
            "gate_llm": gate_tokens,
            "total": main_tokens + gate_tokens
        }
