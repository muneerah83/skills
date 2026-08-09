from typing import Dict, Type, List, Optional
from paradigms.base import BaseParadigm

class ParadigmRegistry:
    """Registry for managing thinking paradigms."""
    _registry: Dict[str, BaseParadigm] = {}
    _token_map: Dict[str, BaseParadigm] = {}

    @classmethod
    def clear_registry(cls):
        """Clear the registry."""
        cls._registry.clear()
        cls._token_map.clear()

    @classmethod
    def initialize_registry(cls, llm_client, image_client=None, sandbox=None,
                           enabled_modes: Optional[List[str]] = None):
        """Initialize and register core paradigms."""
        cls.clear_registry()
        
        from paradigms.algorithmic.adapter import AlgorithmicParadigm
        from paradigms.divergent.adapter import DivergentParadigm
        from paradigms.convergent import ConvergentParadigm
        from paradigms.spatial.adapter import SpatialParadigm
        
        all_modes = {
            "algorithmic": lambda: AlgorithmicParadigm(llm_client),
            "convergent": lambda: ConvergentParadigm(llm_client),
            "divergent": lambda: DivergentParadigm(llm_client),
            "spatial": lambda: SpatialParadigm(llm_client, image_client, sandbox=sandbox) if image_client else None
        }
        
        if enabled_modes is None:
            modes_to_enable = list(all_modes.keys())
        else:
            modes_to_enable = [m.lower() for m in enabled_modes]
        
        for mode_name in modes_to_enable:
            if mode_name not in all_modes:
                print(f"Warning: Unknown mode '{mode_name}', skipped.")
                continue
                
            if mode_name == "spatial" and not image_client:
                continue
            
            paradigm = all_modes[mode_name]()
            if paradigm:
                cls.register(paradigm)

    @classmethod
    def register(cls, paradigm: BaseParadigm):
        """Register a paradigm instance."""
        cls._registry[paradigm.name] = paradigm
        cls._token_map[paradigm.trigger_token] = paradigm

    @classmethod
    def get_by_name(cls, name: str) -> BaseParadigm:
        return cls._registry.get(name)

    @classmethod
    def get_by_trigger_token(cls, token: str) -> BaseParadigm:
        """Get paradigm by trigger token."""
        return cls._token_map.get(token)

    @classmethod
    def get_all_paradigms(cls) -> Dict[str, BaseParadigm]:
        return cls._registry

    @classmethod
    def get_all_trigger_tokens(cls) -> list[str]:
        """Get all registered trigger tokens."""
        return list(cls._token_map.keys())

    @classmethod
    def get_all_end_tokens(cls) -> list[str]:
        """Get all registered end tokens."""
        return [p.end_token for p in cls._registry.values()]
