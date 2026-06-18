# 07. Agent Prompt Contract

## Agent Markdown Structure

Each character folder has:

```txt
content/agents/{agentId}/
  character.md
  knowledge/
    *.md
```

`character.md` defines identity. `knowledge/*.md` expands specialized intelligence.

## Character Fields

- name
- role
- visual form
- temperament
- speech style
- word taste
- writing style
- political instinct
- dispute behavior
- weakness
- forbidden behavior

## Runtime Summary

The runtime version lives in `src/data/agents.ts`.

Claude Code may later implement Markdown loading, but MVP can use summarized TS data first.

## Prompt Rule

When generating text for an agent, include:

1. agent role
2. agent tone
3. selected/owned words
4. current dispute or current story
5. exact task
6. output constraints

## Output Constraints

- Korean output by default
- Short enough for live UI
- Agent-specific but not too verbose
- No generic chatbot explanation
- Never say “as an AI language model”
- Stay in ritual/world frame
