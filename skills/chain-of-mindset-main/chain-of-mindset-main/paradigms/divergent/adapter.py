import re
from typing import Dict, Any, Optional, Tuple, List
from paradigms.base import BaseParadigm
from core.protocol import ParadigmOutput
from paradigms.divergent.prompts import (
    DIVERGENT_GENERATION_PROMPT,
    DIVERGENT_BRANCH_EXPLORATION_PROMPT
)


class DivergentParadigm(BaseParadigm):
    """Divergent Mindset for parallel exploration of multiple approaches."""
    
    @property
    def name(self) -> str:
        return "divergent"

    @property
    def trigger_token(self) -> str:
        return "<call_divergent>"

    @property
    def end_token(self) -> str:
        return "</call_divergent>"
    
    @property
    def result_tokens(self) -> Tuple[str, str]:
        return ("<divergent_result>", "</divergent_result>")

    def __init__(self, llm_client):
        self.llm_client = llm_client

    def _parse_branches(self, gen_response: str) -> List[Dict[str, str]]:
        """Parse generated branches from the response."""
        branches = []
        pattern = r'<branch\s+id="([^"]+)">\s*(.*?)\s*</branch>'
        matches = re.findall(pattern, gen_response, re.DOTALL)
        
        for branch_id, description in matches:
            branches.append({
                "id": branch_id.strip(),
                "description": description.strip()
            })
        
        return branches

    def _explore_branch(self, instruction: str, branch: Dict[str, str], 
                        referenced_images: List[str], context: Optional[Dict[str, Any]]) -> str:
        """Deep-dive into a single branch."""
        explore_prompt = DIVERGENT_BRANCH_EXPLORATION_PROMPT.format(
            instruction=instruction,
            branch_description=branch["description"]
        )
        
        if referenced_images:
            content = [{"type": "text", "text": explore_prompt}]
            for img_path in referenced_images:
                content.append({
                    "type": "image_url",
                    "image_url": {"url": img_path}
                })
            messages = [{"role": "user", "content": content}]
        else:
            messages = [{"role": "user", "content": explore_prompt}]
        
        exploration = self.llm_client.chat(messages)
        
        self.append_xml_log(f"branch_{branch['id']}_exploration", exploration, context)
        
        return exploration

    def execute(self, instruction: str, params: Optional[Dict[str, Any]] = None, 
                context: Optional[Dict[str, Any]] = None) -> ParadigmOutput:
        """Execute divergent thinking."""
        referenced_images = context.get("referenced_images", []) if context else []
        
        self.append_xml_log("referenced_images", str(referenced_images), context)

        gen_prompt = DIVERGENT_GENERATION_PROMPT.format(instruction=instruction)
        self.append_xml_log("generation_prompt", gen_prompt, context)
        
        if referenced_images:
            gen_content = [{"type": "text", "text": gen_prompt}]
            for img_path in referenced_images:
                gen_content.append({
                    "type": "image_url",
                    "image_url": {"url": img_path}
                })
            gen_messages = [{"role": "user", "content": gen_content}]
        else:
            gen_messages = [{"role": "user", "content": gen_prompt}]
        
        gen_response = self.llm_client.chat(gen_messages)
        self.append_xml_log("generation_response", gen_response, context)
        
        branches = self._parse_branches(gen_response)
        self.append_xml_log("parsed_branches", str([b["id"] for b in branches]), context)
        
        if not branches:
            branches = [{"id": "A", "description": gen_response}]
        
        explorations = []
        for branch in branches:
            exploration = self._explore_branch(instruction, branch, referenced_images, context)
            explorations.append({
                "id": branch["id"],
                "direction": branch["description"],
                "exploration": exploration
            })
        
        trace_parts = [f"Divergent Exploration: {len(branches)} branches explored\n"]
        trace_parts.append("=" * 60 + "\n")
        
        for exp in explorations:
            trace_parts.append(f"\n[Branch {exp['id']}]: {exp['direction']}\n")
            trace_parts.append("-" * 40 + "\n")
            trace_parts.append(exp["exploration"])
            trace_parts.append("\n")
        
        process_trace = "".join(trace_parts)
        
        self.append_xml_log("aggregated_output", process_trace, context)
        
        return ParadigmOutput(
            status="VIABLE",
            summary=f"Divergent exploration completed. {len(branches)} approaches explored in depth.",
            raw_output=process_trace,
            artifacts=[]
        )

