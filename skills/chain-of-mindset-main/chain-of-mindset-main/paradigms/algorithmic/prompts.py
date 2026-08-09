CODE_GENERATION_PROMPT = """You are verifying through computation.

## Task
{instruction}

Write executable Python code that solves the task precisely.
Print the result to stdout.
"""

CODE_FIX_PROMPT = """The previous code failed.

### Code
{code}

### Error
{error}

Fix the code. Preserve the original intent.
```python
...
```
"""

