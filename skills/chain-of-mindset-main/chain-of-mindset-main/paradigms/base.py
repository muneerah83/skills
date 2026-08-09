from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, List, Optional
from core.protocol import ParadigmOutput

class BaseParadigm(ABC):
    """Abstract base class for Thinking Paradigms."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def trigger_token(self) -> str:
        pass

    @property
    @abstractmethod
    def end_token(self) -> str:
        pass

    @abstractmethod
    def execute(self, instruction: str, params: Optional[Dict[str, Any]] = None, context: Optional[List[dict]] = None) -> ParadigmOutput:
        """Execute the thinking paradigm."""
        pass

    def append_xml_log(self, tag: str, content: Any, context: Optional[Dict[str, Any]] = None):
        """Append structured XML log to the log file defined in context."""
        if not context or "log_path" not in context:
            return
            
        log_path = context["log_path"]
        
        if not isinstance(content, str):
            try:
                content = str(content)
            except:
                content = "[Unserializable Content]"
                
        xml_block = f"<{tag}>\n{content}\n</{tag}>\n\n"
        
        try:
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(xml_block)
        except Exception as e:
            pass

    @property
    def result_tokens(self) -> Tuple[str, str]:
        lower_name = self.name.lower()
        return (f"<|begin_{lower_name}_result|>", f"<|end_{lower_name}_result|>")
