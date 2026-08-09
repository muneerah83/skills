import os
import json
from typing import Dict, Any, Optional

class Config:
    """Global configuration manager for loading environment variables and config files."""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config: Dict[str, Any] = {
            "client_type": "openai",
            "base_url": "", 
            "api_key": "", 
            "model": "", 
            "temperature": 0.7,
            "max_tokens": 4096,
            "max_turns": 20,
            "workspace_dir": "workspace", 
            "timeout": 180, 
        }

        if config_path and os.path.exists(config_path):
            self._load_from_json(config_path)
        
        self._load_from_env()
        self._init_workspace()

    def _load_from_json(self, path: str):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                loaded = json.load(f)
                self.config.update(loaded)
        except Exception as e:
            pass

    def _load_from_env(self):
        for key in self.config.keys():
            env_key = f"AMT_{key.upper()}"
            if env_key in os.environ:
                self.config[key] = os.environ[env_key]

    def _init_workspace(self):
        """Ensure workspace directory exists for generated artifacts."""
        workspace = self.config.get("workspace_dir", "workspace")
        if not os.path.isabs(workspace):
            workspace = os.path.join(os.path.dirname(os.path.abspath(__file__)), workspace)
        
        self.config["workspace_dir"] = workspace
        os.makedirs(workspace, exist_ok=True)

    def get(self, key: str, default: Any = None) -> Any:
        return self.config.get(key, default)
    
    def set(self, key: str, value: Any) -> None:
        self.config[key] = value

    @property
    def api_key(self) -> str:
        return self.config.get("api_key", "")

    @property
    def base_url(self) -> str:
        return self.config.get("base_url", "")

    @property
    def model(self) -> str:
        return self.config.get("model", "")

    @property
    def workspace_dir(self) -> str:
        return self.config.get("workspace_dir", "")
