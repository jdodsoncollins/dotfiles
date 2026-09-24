# Agent skills outside Webflow

This package documents user-global skills available outside the Webflow repository.
It does not copy third-party plugin caches or project-specific skills.

Run:

```sh
agent-skills list
agent-skills check
```

`list` reports the current user-managed skill roots:

- Codex: `~/.codex/skills/`
- Shared agent skills: `~/.agents/skills/`
- Claude: `~/.claude/skills/`

At the time this was added, those roots contained Codex skills such as `route`,
`humanizer`, and `webflow-graph-work`; Claude-only skills such as
`frontend-design`, `feature-sdlc`, and `autoresearch`; and a shared library for
review, planning, writing, testing, Expo, and EAS workflows.

The command intentionally excludes:

- `~/Projects/webflow/.agentflow/skills/`, because Webflow owns those skills.
- `~/.codex/plugins/cache/`, because it contains generated or version-pinned plugin
  artifacts. Reinstall the plugin instead of copying its cache.
- `~/.claude/plugins/cache/`, for the same reason.

Use the source runtime's skill installation mechanism to add or update a global skill.
Do not copy credentials, connector configuration, or plugin caches into this repository.

## jev

`jev` asks TypeSafe's Jev decision model (System One) through OpenRouter's
`/api/v1/systemone` endpoint. It is a structured decision model, not a chat
model: it returns a typed answer (a confidence or a category) for routing,
classification, and gating decisions, with free completions and prompt tokens
at roughly $0.04/M.

```sh
jev "Customer was charged twice and wants money back." "Are they asking for a refund?"
# 0.99

jev "App crashes on CSV export." "Which team handles this?" \
  -c "billing:charges and refunds" -c "technical:bugs and outages"
# technical
```

The API key comes from `OPENROUTER_API_KEY`, falling back to opencode's
`~/.local/share/opencode/auth.json`. Model: `jev-1.13` (routed as
`typesafe/jev-1.13`); 32k context. See OpenRouter's TypeSafe SDK guide for
raw request shapes.
