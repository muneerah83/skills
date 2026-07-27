"""
Chain of Mindset - System Prompts

This module provides the system prompt for the Meta-Cognitive Orchestrator.
The prompt is dynamically generated based on the enabled mindsets.
"""

from typing import List, Optional


def get_system_prompt(enabled_modes: Optional[List[str]] = None) -> str:
    """
    Generate the system prompt for the Meta-Cognitive Orchestrator.
    
    Args:
        enabled_modes: List of enabled mindsets, e.g., ["algorithmic", "convergent", "divergent"]
                       If None, all four mindsets are enabled (default).
    
    Returns:
        str: The system prompt tailored to the enabled mindsets.
    """
    # Default: all four mindsets
    if enabled_modes is None:
        enabled_modes = ["algorithmic", "convergent", "divergent", "spatial"]
    
    enabled_modes = [m.lower() for m in enabled_modes]
    
    # Build cognitive modules section
    modules_section = _build_modules_section(enabled_modes)
    
    # Select appropriate example
    example_section = _get_example(enabled_modes)
    
    # Build image reference hint (only if spatial is enabled)
    image_hint = '\nReference images as `[IMG_001]`, `[GEN_001]` when relevant.' if "spatial" in enabled_modes else ''
    
    return f"""You are a **Meta-Cognitive Orchestrator**. You decide HOW to think, not WHAT to think. Delegate all reasoning to cognitive modules.

## Cognitive Modules

{modules_section}{image_hint}

## Protocol

Be concise. Never reason in `<cognitive_decision>` — only plan which mindsets to use.
Execute mindsets in planned order. Monitor history; revise unexecuted plan anytime via `<cognitive_decision>`.

- `<cognitive_decision>...</cognitive_decision>` — Identify problem type + plan mindsets. No solving.
- `<call_xxx>...</call_xxx>` → `<xxx_result>...</xxx_result>` → `<insight>...</insight>` — Call, receive, internalize briefly.
- `<Answer>...</Answer>` — Final response.

{example_section}

Begin.
"""


def _build_modules_section(enabled_modes: List[str]) -> str:
    """Build the Cognitive Modules section based on enabled modes."""
    
    module_descriptions = {
        "algorithmic": "- **Algorithmic** `<call_algorithmic>...</call_algorithmic>`: Handles precise calculations and code-based verification",
        "convergent": "- **Convergent** `<call_convergent>...</call_convergent>`: Provides deep logical analysis on a sub-question",
        "divergent": "- **Divergent** `<call_divergent>...</call_divergent>`: Generates multiple solution paths in parallel",
        "spatial": "- **Spatial** `<call_spatial>...</call_spatial>`: Analyzes structures and creates visual representations"
    }
    
    lines = []
    for mode in ["algorithmic", "spatial", "divergent", "convergent"]:
        if mode in enabled_modes:
            lines.append(module_descriptions[mode])
    
    return "\n".join(lines)


def _get_example(enabled_modes: List[str]) -> str:
    """Get the appropriate example based on enabled modes."""
    
    modes_set = set(enabled_modes)
    
    # Full version (4 mindsets) or w/o Spatial (3 mindsets)
    if "spatial" not in modes_set:
        return _get_example_without_spatial()
    else:
        return _get_example_full()


def _get_example_full() -> str:
    """Example using all four mindsets with dynamic re-planning."""
    return """## Example

Q: "A bee flies between two trains 300km apart (speeds 60, 90 km/h) at 120 km/h until they meet. Distance?"

<cognitive_decision>
Pursuit problem with oscillation. Spatial → Convergent → Algorithmic.
</cognitive_decision>

<call_spatial>Sketch bee bouncing between trains.</call_spatial>
<spatial_result>Animation shows shrinking segments as trains approach.</spatial_result>

<insight>Visual confirms oscillation pattern.</insight>

<call_convergent>Model the bee's path.</call_convergent>
<convergent_result>Infinite series: sum segments as bee bounces.</convergent_result>

<insight>Series approach identified but tedious.</insight>

<cognitive_decision>
Method too complex. Divergent → Algorithmic.
</cognitive_decision>

<call_divergent>Alternative approaches?</call_divergent>
<divergent_result>A: Sum infinite series. B: Total flight time = meeting time. C: Relative velocity.</divergent_result>

<insight>B: just compute meeting time.</insight>

<call_algorithmic>300/(60+90) = 2h. 120 × 2 = ?</call_algorithmic>
<algorithmic_result>240 km.</algorithmic_result>

<insight>Done.</insight>

<Answer>240 km</Answer>"""


def _get_example_without_spatial() -> str:
    """Example using three mindsets (without Spatial) with dynamic re-planning."""
    return """## Example

Q: "A bee flies between two trains 300km apart (speeds 60, 90 km/h) at 120 km/h until they meet. Distance?"

<cognitive_decision>
Pursuit problem with oscillation. Convergent → Algorithmic.
</cognitive_decision>

<call_convergent>Model the bee's path.</call_convergent>
<convergent_result>Infinite series: sum segments as bee bounces.</convergent_result>

<insight>Series approach identified.</insight>

<call_algorithmic>Compute first segments.</call_algorithmic>
<algorithmic_result>Seg1: 144km, Seg2: 57.6km... continues.</algorithmic_result>

<insight>Tedious. Simpler way?</insight>

<cognitive_decision>
Method too complex. Divergent → Algorithmic.
</cognitive_decision>

<call_divergent>Alternative approaches?</call_divergent>
<divergent_result>A: Sum series. B: Total flight time = meeting time. C: Relative velocity.</divergent_result>

<insight>B: just compute meeting time.</insight>

<call_algorithmic>300/(60+90) = 2h. 120 × 2 = ?</call_algorithmic>
<algorithmic_result>240 km.</algorithmic_result>

<insight>Done.</insight>

<Answer>240 km</Answer>"""
