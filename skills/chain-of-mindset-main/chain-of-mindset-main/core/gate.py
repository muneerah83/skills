"""Multimodal Context Gate for Working Memory Management."""

import os
import re
import json
from typing import List, Dict, Any, Tuple, Optional
from core.llm_client import LLMClient


INPUT_GATE_PROMPT = """You are the attentional filter of a cognitive agent.

Extract what the specialized thinking needs to execute the instruction.

## Instruction
{call}

## History
{source_history}

## Available Images
{available_images_description}

## Target
{target_description}

## Extraction Rules

**Keep verbatim**: numbers, data, coordinates, prior results, text being analyzed.
**Summarize**: reasoning chains → conclusions only.
**Omit**: the original user question (the thinking sees only its sub-task).

## Image Decision
- Explicit `[IMG_XXX]` in instruction → inject those
- "the figure/image" without marker → inject most relevant
- Purely textual task → inject nothing

## Output (JSON only)
```json
{{
    "context_text": "extracted context or empty string",
    "inject_images": ["IMG_001"] or []
}}
```
"""


OUTPUT_GATE_PROMPT = """You are the attentional filter of a cognitive agent.

Extract the results that advance the main reasoning.

## Instruction
{call}

## Execution Record
{mindset_output}

## New Artifacts
{new_artifacts_description}

## Extraction Rules

**Keep**: computed values, discovered patterns, conclusions, generated image paths.
**Omit**: derivation steps, failed attempts.

## Extracted Results
"""


class Gate:
    """Multimodal Context Gate for Working Memory Management."""
    
    def __init__(self, config: dict):
        """Initialize Gate with its own LLM client."""
        self.llm = LLMClient(config)
    
    def _append_log(self, tag: str, content: str, log_path: Optional[str] = None):
        """Append structured XML log to the log file."""
        if not log_path:
            return
        try:
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(f"<{tag}>\n{content}\n</{tag}>\n\n")
        except Exception:
            pass
    
    def input_gate(
        self,
        source_history: str,
        call: str,
        target_mindset: str,
        artifact_registry: Optional[Dict[str, Dict[str, Any]]] = None,
        log_path: Optional[str] = None
    ) -> Tuple[str, List[str]]:
        """Input Gate: Extract relevant context and decide which images to inject."""
        target_descriptions = {
            "algorithmic": "Algorithmic Mindset — executes precise calculations and code-based verifications",
            "convergent": "Convergent Mindset — performs deep logical analysis on focused questions",
            "divergent": "Divergent Mindset — explores multiple approaches and alternatives in parallel",
            "spatial": "Spatial Mindset — creates and analyzes visual-spatial representations"
        }
        target_desc = target_descriptions.get(
            target_mindset.lower(), 
            f"{target_mindset} Mindset"
        )
        
        available_images_desc = self._build_images_description(artifact_registry)
        
        prompt = INPUT_GATE_PROMPT.format(
            call=call,
            source_history=source_history,
            available_images_description=available_images_desc,
            target_description=target_desc
        )
        
        messages = self._build_multimodal_messages(prompt, artifact_registry)
        
        self._append_log("input_gate_prompt", prompt, log_path)
        
        raw_response = self.llm.chat(messages).strip()
        
        self._append_log("input_gate_raw_response", raw_response, log_path)
        
        context_text, inject_image_ids = self._parse_input_gate_response(raw_response, call, artifact_registry)
        
        self._append_log("input_gate_decision", f"context_text: {context_text[:200] if context_text else 'None'}...\ninject_images: {inject_image_ids}", log_path)
        
        inject_images = self._resolve_image_ids(inject_image_ids, artifact_registry)
        
        if context_text and context_text.strip():
            mindset_input = f"""## Relevant Context
{context_text}

## Task
{call}"""
        else:
            mindset_input = f"""## Task
{call}"""
        
        return mindset_input, inject_images
    
    def output_gate(
        self,
        mindset_output: str,
        call: str,
        new_artifacts: Optional[List[str]] = None,
        log_path: Optional[str] = None
    ) -> str:
        """Output Gate: Extract results from Mindset output for Main Agent."""
        new_artifacts_desc = "None"
        if new_artifacts:
            artifact_items = []
            for i, path in enumerate(new_artifacts):
                filename = os.path.basename(path)
                artifact_items.append(f"- New Image {i+1}: {filename}")
            new_artifacts_desc = "\n".join(artifact_items)
        
        prompt = OUTPUT_GATE_PROMPT.format(
            call=call,
            mindset_output=mindset_output,
            new_artifacts_description=new_artifacts_desc
        )
        
        self._append_log("output_gate_prompt", prompt, log_path)
        
        messages = [{"role": "user", "content": prompt}]
        extracted_result = self.llm.chat(messages).strip()
        
        self._append_log("output_gate_extracted", extracted_result, log_path)
        
        return extracted_result
    
    def _build_images_description(self, artifact_registry: Optional[Dict[str, Dict[str, Any]]]) -> str:
        """Build a text description of all available images."""
        if not artifact_registry:
            return "No images available."
        
        image_items = []
        for img_id, info in artifact_registry.items():
            if info.get("type") == "image":
                source = info.get("source", "unknown")
                step = info.get("step", "?")
                filename = os.path.basename(info.get("path", ""))
                image_items.append(f"- [{img_id}]: {filename} (source: {source}, step: {step})")
        
        if not image_items:
            return "No images available."
        
        return "\n".join(image_items)
    
    def _build_multimodal_messages(
        self, 
        prompt: str, 
        artifact_registry: Optional[Dict[str, Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        """Build multimodal messages including image thumbnails for Gate."""
        image_paths = []
        if artifact_registry:
            for img_id, info in artifact_registry.items():
                if info.get("type") == "image":
                    path = info.get("path", "")
                    if path and os.path.exists(path):
                        image_paths.append(path)
        
        return [self.llm.construct_message("user", prompt, image_paths=image_paths if image_paths else None)]
    
    def _parse_input_gate_response(
        self, 
        raw_response: str, 
        call: str,
        artifact_registry: Optional[Dict[str, Dict[str, Any]]]
    ) -> Tuple[str, List[str]]:
        """Parse the Input Gate's JSON response."""
        try:
            json_match = re.search(r'\{[\s\S]*\}', raw_response)
            if json_match:
                data = json.loads(json_match.group())
                context_text = data.get("context_text", "")
                inject_images = data.get("inject_images", [])
                
                explicit_ids = self._extract_explicit_markers(call, artifact_registry)
                if explicit_ids:
                    combined = set(inject_images)
                    combined.update(explicit_ids)
                    inject_images = list(combined)
                
                return context_text, inject_images
        except (json.JSONDecodeError, AttributeError):
            pass
        
        print("⚠️ [Input Gate] JSON parse failed, using fallback extraction")
        inject_images = self._extract_explicit_markers(call, artifact_registry)
        return raw_response, inject_images
    
    def _extract_explicit_markers(
        self, 
        call: str, 
        artifact_registry: Optional[Dict[str, Dict[str, Any]]]
    ) -> List[str]:
        """Extract explicit [IMG_XXX] markers from call as fallback."""
        pattern = r'\[(IMG_\d{3})\]'
        matches = re.findall(pattern, call)
        
        valid_ids = []
        if artifact_registry:
            for img_id in matches:
                if img_id in artifact_registry:
                    valid_ids.append(img_id)
        
        return valid_ids
    
    def _resolve_image_ids(
        self, 
        image_ids: List[str], 
        artifact_registry: Optional[Dict[str, Dict[str, Any]]]
    ) -> List[str]:
        """Resolve image IDs to actual file paths."""
        if not artifact_registry or not image_ids:
            return []
        
        paths = []
        for img_id in image_ids:
            if img_id in artifact_registry:
                path = artifact_registry[img_id].get("path", "")
                if path and os.path.exists(path):
                    paths.append(path)
        
        return paths
    
    @staticmethod
    def format_history(messages: List[Dict[str, Any]], exclude_system: bool = True) -> str:
        """Format message history into a string for Gate processing."""
        lines = []
        for msg in messages:
            role = msg.get("role", "unknown")
            
            if exclude_system and role == "system":
                continue
            
            content = msg.get("content", "")
            
            if isinstance(content, list):
                text_parts = []
                for item in content:
                    if item.get("type") == "text":
                        text_parts.append(item.get("text", ""))
                    elif item.get("type") == "image_url":
                        text_parts.append("[Image]")
                content = " ".join(text_parts)
            
            role_label = {
                "user": "USER",
                "assistant": "ASSISTANT"
            }.get(role, role.upper())
            
            lines.append(f"[{role_label}]\n{content}")
        
        return "\n\n---\n\n".join(lines)
