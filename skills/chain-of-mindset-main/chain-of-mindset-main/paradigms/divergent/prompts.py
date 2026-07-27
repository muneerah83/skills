DIVERGENT_GENERATION_PROMPT = """You are exploring possibilities.

## Task
{instruction}

Generate 2-5 genuinely different approaches.
Each approach should differ in method, not just phrasing.

## Output
<branch id="A">
[Approach name]
Method: [How it works]
When applicable: [Conditions]
</branch>
<branch id="B">
...
</branch>
"""

DIVERGENT_BRANCH_EXPLORATION_PROMPT = """You are exploring one approach in depth.

## Problem
{instruction}

## Approach
{branch_description}

Examine this approach:
1. What assumptions does it make? Are they satisfied?
2. How would it work step by step?
3. What are the limitations?
4. Is it viable for this problem?

Be honest about limitations.
"""
