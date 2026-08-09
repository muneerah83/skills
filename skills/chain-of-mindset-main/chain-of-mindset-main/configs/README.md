# Configuration Guide

This directory contains configuration files for Chain-of-Mindset.

## Quick Start

Edit the config files directly and replace `YOUR_API_KEY` with your actual API key:

```bash
# For API mode (OpenAI, Azure, OpenRouter, etc.)
meta_llm_config_api.json
mindset_llm_config_api.json
gate_config_api.json
api_config_image.json  # Optional, for Spatial mindset

# For Local mode (vLLM, Ollama, etc.)
meta_llm_config_local.json
mindset_llm_config_local.json
gate_config_local.json
```

## Configuration Files

| File | Purpose | Required |
|------|---------|----------|
| `meta_llm_config_*.json` | Meta-reasoning orchestrator (main loop) | ✅ Yes |
| `gate_config_*.json` | Context gate (information filtering) | ✅ Yes |
| `mindset_llm_config_*.json` | Mindset experts (Algorithmic, Divergent, etc.) | ✅ Yes |
| `api_config_image.json` | Image generation (for Spatial mindset) | ❌ Optional |

## Supported Providers

### OpenAI
```json
{
    "client_type": "openai",
    "model": "gpt-4o",
    "api_key": "sk-...",
    "base_url": "https://api.openai.com/v1"
}
```

### Azure OpenAI
```json
{
    "client_type": "azure",
    "model": "gpt-4o",
    "api_key": "...",
    "base_url": "https://YOUR_RESOURCE.openai.azure.com/",
    "api_version": "2024-02-15-preview"
}
```

### OpenRouter (Multiple Providers)
```json
{
    "client_type": "openai",
    "model": "anthropic/claude-3.5-sonnet",
    "api_key": "sk-or-v1-...",
    "base_url": "https://openrouter.ai/api/v1"
}
```

### Local vLLM / Ollama
```json
{
    "client_type": "openai",
    "model": "Qwen3-VL-32B-Instruct",
    "api_key": "EMPTY",
    "base_url": "http://localhost:8000/v1"
}
```

## Configuration Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `client_type` | API client type (`openai`, `azure`) | `openai` |
| `model` | Model name | - |
| `api_key` | API key | - |
| `base_url` | API endpoint | - |
| `temperature` | Sampling temperature | `0.7` |
| `max_tokens` | Max tokens per response | `8192` |
| `timeout` | Request timeout (seconds) | `180` |
| `stop_strategy` | Stop token handling (`native`, `manual`) | `native` |
| `max_turns` | Max conversation turns | `40` |
