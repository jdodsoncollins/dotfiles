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
