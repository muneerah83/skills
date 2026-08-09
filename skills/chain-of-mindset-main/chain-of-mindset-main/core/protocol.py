from dataclasses import dataclass, field
from typing import List, Dict, Optional

class ParadigmToken:
    """Defines the streaming tag protocol for thinking paradigms."""
    THINK_START = "<cognitive_decision>"
    THINK_END = "</cognitive_decision>"
    
    INSIGHT_START = "<insight>"
    INSIGHT_END = "</insight>"
    
    ANSWER_START = "<Answer>"
    ANSWER_END = "</Answer>"
    
    PARADIGMS = {
        "algorithmic": {
            "start": "<call_algorithmic>", "end": "</call_algorithmic>",
            "res_start": "<algorithmic_result>", "res_end": "</algorithmic_result>"
        },
        "spatial": {
            "start": "<call_spatial>", "end": "</call_spatial>",
            "res_start": "<spatial_result>", "res_end": "</spatial_result>"
        },
        "divergent": {
            "start": "<call_divergent>", "end": "</call_divergent>",
            "res_start": "<divergent_result>", "res_end": "</divergent_result>"
        },
        "convergent": {
            "start": "<call_convergent>", "end": "</call_convergent>",
            "res_start": "<convergent_result>", "res_end": "</convergent_result>"
        }
    }

    @classmethod
    def get_stop_tokens(cls) -> List[str]:
        """Get all paradigm end tags to serve as Stop Words for the LLM."""
        stop_tokens = [p["end"] for p in cls.PARADIGMS.values()]
        stop_tokens.append(cls.ANSWER_END)
        stop_tokens.append(cls.THINK_END)
        stop_tokens.append(cls.INSIGHT_END)
        return stop_tokens

@dataclass
class ParadigmOutput:
    """Output object after paradigm execution."""
    status: str
    summary: str
    raw_output: str 
    artifacts: List[str] = field(default_factory=list)
