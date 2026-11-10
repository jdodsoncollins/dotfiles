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

## Loop and graph harness

This package also stows the personal loop and graph harness shared by OpenCode, Claude Code, and Codex:

| Path | Purpose |
| --- | --- |
| `.agents/skills/webflow-graph-work/` | Execution graph with an append-only ledger (moved here from `~/.codex/skills`). Codex and Claude reach it through symlinks in `~/.codex/skills` and `~/.claude/skills`. |
| `.agents/skills/agent-loop/` | Loop design (trigger, unit, stop, verify, budget, state, escalation, gates) and the Flower overnight automation spec. |
| `.agents/skills/verify-waf/` | pstack-style verification skill and feature map for the customer WAF surface. |
| `.local/bin/agent-loop` | Headless loop runner: `agent-loop init|run|status|list`. Runs `opencode run --agent afk --auto` or `claude -p` once per iteration and records each one in the graph ledger. |
| `.claude/agents/verifier.md` | Opus verifier subagent for Claude Code. |
| `.claude/rules/pstack-models.md` | pstack role-to-model map for Claude Code. |
| `.claude/scheduled-tasks/*/SKILL.md` | Prompts for Claude Desktop scheduled tasks. The schedule itself is registered in Claude Desktop. |

The `~/.claude/skills` links are plain symlinks, not stow-managed:

```sh
ln -s ../../.agents/skills/webflow-graph-work ~/.claude/skills/webflow-graph-work
ln -s ../../.agents/skills/agent-loop ~/.claude/skills/agent-loop
ln -s ../../.agents/skills/verify-waf ~/.claude/skills/verify-waf
```

pstack lives in a vendor clone at `~/Projects/vendor/cursor-plugins` for OpenCode and as the `pstack@cursor-plugins` Claude Code plugin (auto-update on).

Skill precedence is Agentflow (in-repo `.agentflow/skills`) > `~/.agents/skills` (Pocock and personal) > pstack. OpenCode reads pstack through `~/.local/share/pstack-skills`, which `pstack-skills-sync` rebuilds without any ID a higher tier already defines. After `git -C ~/Projects/vendor/cursor-plugins pull`, run `pstack-skills-sync`.

OpenCode does not notice edits made through a stowed symlink, because it watches `~/.config/opencode` and the write lands in this repository. After editing a stowed OpenCode file, run `touch -h ~/.config/opencode/<file-or-dir>` or `/reload` in the TUI.

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
