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
    """Chain of Mindset Entry Point (Local Model)"""
    parser = argparse.ArgumentParser(description="Chain of Mindset CLI (Local Model)")
    parser.add_argument("--query", type=str, default=None, help="User query to solve")
    parser.add_argument("--images", nargs="+", help="Path to input images")
    parser.add_argument("--meta_llm_conf", type=str, default="configs/meta_llm_config_local.json", help="Path to Meta-Reasoning LLM config (Orchestrator)")
    parser.add_argument("--mindset_llm_conf", type=str, default="configs/mindset_llm_config_local.json", help="Path to Mindset LLM config (Paradigms)")
    parser.add_argument("--gate_conf", type=str, default="configs/gate_config_local.json", help="Path to Gate config (Context Gate LLM)")
    parser.add_argument("--img_conf", type=str, default="configs/api_config_image.json", help="Path to Image Gen config")
    args = parser.parse_args()

    query = args.query if args.query else DEFAULT_QUERY

    print("Initializing...")

    try:
        meta_llm_config = Config(args.meta_llm_conf)
        mindset_llm_config = Config(args.mindset_llm_conf)
        
        meta_llm_config.config["stop_strategy"] = "native"
        mindset_llm_config.config["stop_strategy"] = "native"
        
        image_config = Config(args.img_conf)

        timestamp = int(time.time())
        session_id = f"session_local_{timestamp}"
        session_dir = os.path.join(current_dir, "workspace", session_id)
        os.makedirs(session_dir, exist_ok=True)

        orchestrator = Orchestrator(
            meta_llm_config=meta_llm_config, 
            mindset_llm_config=mindset_llm_config,
            image_config=image_config,
            session_dir=session_dir,
            gate_config_path=args.gate_conf
        )

        print(f"\nQuery: {query}")
        if args.images:
            print(f"Images: {args.images}")
        print("-" * 50)

        start_time = time.time()
        final_answer = orchestrator.run(query, image_paths=args.images)
        
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
                "current_step": working_context["current_step"]
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
