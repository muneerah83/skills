from typing import Tuple, List, Optional, Dict, Any
from paradigms.base import BaseParadigm
from core.protocol import ParadigmOutput
from core.llm_client import LLMClient

class ConvergentParadigm(BaseParadigm):
    """Convergent Mindset paradigm for focused, deep reasoning."""
    
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    @property
    def name(self) -> str:
        return "convergent"

    @property
    def trigger_token(self) -> str:
        return "<call_convergent>"

    @property
    def end_token(self) -> str:
        return "</call_convergent>"

    def execute(self, instruction: str, params: Optional[Dict[str, Any]] = None, context: Optional[Dict[str, Any]] = None) -> ParadigmOutput:
        """Execute convergent reasoning."""
        convergent_system_prompt = (
            "You are reasoning deeply.\n\n"
            "Focus all attention on the given question.\n"
            "Ground each step in established facts.\n"
            "If information is insufficient, state what is missing.\n"
            "Reach a clear conclusion."
        )
        
        referenced_images = context.get("referenced_images", []) if context else []
        
        if referenced_images:
            user_content = [{"type": "text", "text": instruction}]
            for img_path in referenced_images:
                user_content.append({
                    "type": "image_url",
                    "image_url": {"url": img_path}
                })
            messages = [
                {"role": "system", "content": convergent_system_prompt},
                {"role": "user", "content": user_content}
            ]
        else:
            messages = [
                {"role": "system", "content": convergent_system_prompt},
                {"role": "user", "content": instruction}
            ]
        
        self.append_xml_log("internal_system_prompt", convergent_system_prompt, context)
        self.append_xml_log("referenced_images", str(referenced_images), context)
        self.append_xml_log("internal_messages", str(messages), context)
        
        try:
            response = self.llm.chat(messages, temperature=0.7)
            
            self.append_xml_log("llm_reasoning_response", response, context)
            
            return ParadigmOutput(
                status="VIABLE",
                summary=f"Convergent Reasoning Completed. Key Conclusion: {response[:100]}...",
                raw_output=response,
                artifacts=[]
            )
        except Exception as e:
            self.append_xml_log("error", str(e), context)
            return ParadigmOutput(
                status="INCOMPLETE",
                summary=f"Error during Convergent execution: {str(e)}",
                raw_output=str(e),
                artifacts=[]
            )
