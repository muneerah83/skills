import traceback
import sys
import io
import json
import re
from typing import List, Dict, Any, Tuple, Optional
from paradigms.base import BaseParadigm
from core.protocol import ParadigmOutput
from paradigms.algorithmic.prompts import (
    CODE_GENERATION_PROMPT,
    CODE_FIX_PROMPT
)
from core.sandbox import SandboxFactory

class AlgorithmicParadigm(BaseParadigm):
    """
    Algorithmic Mindset Adapter.
    
    Implements the "Generate -> Execute -> Fix -> Retry" loop.
    Uses SandboxFactory for safe execution.
    """
    
    @property
    def name(self) -> str:
        return "algorithmic"

    @property
    def trigger_token(self) -> str:
        return "<call_algorithmic>"

    @property
    def end_token(self) -> str:
        return "</call_algorithmic>"
    
    @property
    def result_tokens(self) -> Tuple[str, str]:
        return ("<algorithmic_result>", "</algorithmic_result>")

    def __init__(self, llm_client):
        self.llm_client = llm_client
        self.max_retries = 2
        # Initialize Sandbox (Lazy initialization handled by Factory)
        self.sandbox = SandboxFactory.get_sandbox()


    def execute(self, instruction: str, params: Optional[Dict[str, Any]] = None, context: Optional[Dict[str, Any]] = None) -> ParadigmOutput:
        """Execute the Code flow."""
        execution_trace = []
        
        referenced_images = context.get("referenced_images", []) if context else []
        
        gen_prompt = CODE_GENERATION_PROMPT.format(
            instruction=instruction
        )
        
        self.append_xml_log("internal_system_prompt", gen_prompt, context)
        self.append_xml_log("referenced_images", str(referenced_images), context)
        
        if referenced_images:
            user_content = [{"type": "text", "text": gen_prompt}]
            for img_path in referenced_images:
                user_content.append({
                    "type": "image_url",
                    "image_url": {"url": img_path}
                })
            gen_messages = [{"role": "user", "content": user_content}]
        else:
            gen_messages = [{"role": "user", "content": gen_prompt}]
        
        response = self.llm_client.chat(gen_messages)
        
        self.append_xml_log("llm_raw_response_generation", response, context)
        
        code = self._extract_code(response)
        
        self.append_xml_log("extracted_code", code, context)
        
        if not code:
            self.append_xml_log("error", "Failed to extract code", context)
            return ParadigmOutput(
                status="FAILED",
                summary="Failed to generate valid Python code.",
                raw_output=f"LLM Response: {response}",
                artifacts=[]
            )

        final_output = ""
        final_error = ""
        success = False
        
        for attempt in range(self.max_retries + 1):
            output, error = self._execute_python(code)
            
            exec_log = f"<attempt>{attempt+1}</attempt>\n<stdout>{output}</stdout>\n<stderr>{error}</stderr>"
            self.append_xml_log("execution_attempt", exec_log, context)
            
            trace_entry = f"""
[Attempt {attempt+1}]
Code:
```python
{code}
```
Output:
{output}
Error:
{error}
"""
            execution_trace.append(trace_entry)
            
            if not error:
                success = True
                final_output = output
                break
            
            if attempt < self.max_retries:
                fix_prompt = CODE_FIX_PROMPT.format(code=code, error=error)
                self.append_xml_log("fix_prompt", fix_prompt, context)
                
                fix_response = self.llm_client.chat([{"role": "user", "content": fix_prompt}])
                self.append_xml_log("llm_fix_response", fix_response, context)
                
                code = self._extract_code(fix_response)
                self.append_xml_log("fixed_code", code, context)
                
                if not code:
                    self.append_xml_log("error", "Failed to extract code from fix response", context)
                    break
        
        full_trace = "\n".join(execution_trace)
        
        status = "VIABLE" if success else "FAILED"
        summary = f"Code executed successfully." if success else f"Code execution failed after {self.max_retries+1} attempts."
        
        return ParadigmOutput(
            status=status,
            summary=summary,
            raw_output=full_trace,
            artifacts=[]
        )

    def _extract_code(self, text: str) -> str:
        """Extract code from markdown code blocks."""
        pattern = re.compile(r"```python\n(.*?)```", re.DOTALL)
        match = pattern.search(text)
        if match:
            return match.group(1).strip()
        
        pattern_generic = re.compile(r"```\n(.*?)```", re.DOTALL)
        match_generic = pattern_generic.search(text)
        if match_generic:
            return match_generic.group(1).strip()
            
        return ""

    def _execute_python(self, code: str) -> Tuple[str, str]:
        """
        Execute Python code using the configured Sandbox.
        """
        return self.sandbox.run_code(code)