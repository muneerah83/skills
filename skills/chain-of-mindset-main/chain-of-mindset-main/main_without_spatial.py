"""Chain of Mindset - Entry Point WITHOUT Spatial Mindset"""

import os
import sys
import json
import time
import argparse
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.append(project_root)

from core.orchestrator import Orchestrator
from config import Config
from prompts.system import get_system_prompt

DEFAULT_QUERY = "If the sun were a head of a body, how long would it's arms be?"

def save_reasoning_trace(history, total_tokens, session_dir):
    """Save reasoning trace to session directory."""
    timestamp = datetime.now().isoformat()
    filename = os.path.join(session_dir, "reasoning_trace.json")
    
    record = {
        "timestamp": timestamp,
        "total_tokens": total_tokens,
        "steps": len(history),
        "trace": history
    }
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2, ensure_ascii=False)

def main():
    """Chain of Mindset Entry Point (WITHOUT Spatial Mindset)"""
    parser = argparse.ArgumentParser(description="Chain of Mindset CLI (Without Spatial Mindset)")
    parser.add_argument("--mode", type=str, choices=["api", "local"], default="api", 
                        help="Execution mode: 'api' for commercial APIs, 'local' for local deployment")
    parser.add_argument("--query", type=str, default=None, help="User query to solve")
    parser.add_argument("--meta_llm_conf", type=str, default=None, help="Path to Meta-Reasoning LLM config")
    parser.add_argument("--mindset_llm_conf", type=str, default=None, help="Path to Mindset LLM config")
    parser.add_argument("--gate_conf", type=str, default=None, help="Path to Gate config")
    args = parser.parse_args()

    if args.mode == "api":
        meta_llm_conf = args.meta_llm_conf or "configs/meta_llm_config_api.json"
        mindset_llm_conf = args.mindset_llm_conf or "configs/mindset_llm_config_api.json"
        gate_conf = args.gate_conf or "configs/gate_config_api.json"
        mode_label = "API"
    else:  # local
        meta_llm_conf = args.meta_llm_conf or "configs/meta_llm_config_local.json"
        mindset_llm_conf = args.mindset_llm_conf or "configs/mindset_llm_config_local.json"
        gate_conf = args.gate_conf or "configs/gate_config_local.json"
        mode_label = "Local"

    # Determine query
    query = args.query if args.query else DEFAULT_QUERY

    print("Initializing...")

    try:
        if not os.path.exists(meta_llm_conf):
            print(f"Config file not found: {meta_llm_conf}")
            return
        meta_llm_config = Config(meta_llm_conf)
        
        if not os.path.exists(mindset_llm_conf):
            print(f"Config file not found: {mindset_llm_conf}")
            return
        mindset_llm_config = Config(mindset_llm_conf)
        
        # Set stop strategy based on mode
        if args.mode == "api":
            meta_llm_config.config["stop_strategy"] = "manual"
            mindset_llm_config.config["stop_strategy"] = "manual"
        else:
            meta_llm_config.config["stop_strategy"] = "native"
            mindset_llm_config.config["stop_strategy"] = "native"

        timestamp = int(time.time())
        session_id = f"session_no_spatial_{timestamp}"
        session_dir = os.path.join(current_dir, "workspace", session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        enabled_modes = ["algorithmic", "convergent", "divergent"]
        custom_prompt = get_system_prompt(enabled_modes)
        
        orchestrator = Orchestrator(
            meta_llm_config=meta_llm_config,
            mindset_llm_config=mindset_llm_config,
            image_config=None,  # No image generation
            session_dir=session_dir,
            gate_config_path=gate_conf if os.path.exists(gate_conf) else None,
            enabled_modes=enabled_modes,
            custom_system_prompt=custom_prompt
        )

        print(f"\nQuery: {query}")
        print("-" * 50)

        start_time = time.time()
        final_answer = orchestrator.run(query, image_paths=None)
        
        duration = time.time() - start_time
        token_stats = orchestrator.get_total_tokens()
        total_tokens = token_stats["total"]

        print("-" * 50)
        print(f"\nFinal Answer: {final_answer}")
        print("-" * 50)
        print(f"Duration: {duration:.2f}s | Tokens: {total_tokens}")

        save_reasoning_trace(orchestrator.history, total_tokens, session_dir)

        working_context = orchestrator.get_working_context_summary()
        working_context_path = os.path.join(session_dir, "working_context.json")
        with open(working_context_path, "w", encoding="utf-8") as f:
            serializable_context = {
                "artifact_registry": working_context["artifact_registry"],
                "task_context": working_context["task_context"],
                "current_step": working_context["current_step"],
                "enabled_modes": ["algorithmic", "convergent", "divergent"]
            }
            json.dump(serializable_context, f, indent=2, ensure_ascii=False)

    except KeyboardInterrupt:
        print("\n\nExecution interrupted.")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
