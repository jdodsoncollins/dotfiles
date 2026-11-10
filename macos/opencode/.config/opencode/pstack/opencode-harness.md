# pstack in OpenCode

pstack skills use Cursor names. In OpenCode, read this file once per session, then map each Cursor name with the tables below. `<pstack>` is `~/Projects/vendor/cursor-plugins/pstack`. If a Cursor field has no row, drop it and say so. Never pass a field the tool schema rejects.

## Tools

| Cursor | OpenCode |
| --- | --- |
| `Task` | `subagent` tool |
| `AskQuestion` | `question` tool. Denied in the `afk` agent: there, apply the default and record it in `progress.md` or `ESCALATE.md`. |
| Open a todolist | Keep the list in your reply and update it at each phase. |
| Run another pstack skill (`/name` or "the **name** skill") | `skill` tool with the ID. If the skill has `disable-model-invocation`, it still loads by ID. Fallback: read `<pstack>/skills/<name>/SKILL.md`. |
| `Grep`, `Glob`, `Read`, `Shell` | `grep`, `glob`, `read`, `shell` |
| Code-intelligence | LSP is enabled in the Webflow repo; prefer it over broad reads. |

## Subagent fields

| Cursor | OpenCode |
| --- | --- |
| `subagent_type: "poteto-agent"` | agent `poteto-agent` |
| `subagent_type: "comment-sicko"` | agent `comment-sicko` |
| `subagent_type: generalPurpose`, `readonly: false` | agent `general` (cannot spawn further subagents) or `builder` for specified code edits |
| `readonly: true` | agent `explore`, `scout`, or `explorer`. All deny edits. |
| `environment: "cloud"` | Create a worktree with `tools.opencode.worktree_create` (Code Mode) and name its directory and branch in the brief. One writer per worktree. For true cloud isolation, start a Flower conversation instead (needs explicit user approval). |
| `environment: "local"` | Omit. |
| `cloud_base_branch: <b>` | Tell the worker to start from `<b>` (default `origin/dev`). |
| `run_in_background: true` | `background: true` |
| `resume` | Pass the earlier `sessionID` to the `subagent` tool. |
| `file_attachments` | List the paths in the brief. |
| `model` | Only pass `model` when the role line in `~/.config/opencode/pstack/pstack-models.md` names one. Otherwise omit it so the agent's own pinned model or the parent model applies. |

## Models

Role-to-model choices live in `~/.config/opencode/pstack/pstack-models.md`. Read it when a pstack step picks a model. Slugs there are OpenCode `provider/model#variant` strings. When a pstack skill names a Cursor slug (for example `claude-opus-5-5-xhigh` or `grok-4.7-xhigh-fast`), map it:

| Cursor slug | OpenCode |
| --- | --- |
| `claude-opus-5-5-<effort>` | `openrouter/anthropic/claude-opus-5.5#<effort>` |
| `claude-sonnet-5-5-<effort>` | `openrouter/anthropic/claude-sonnet-5.5#<effort>` |
| `grok-4.7-<effort>[-fast]` | `openrouter/x-ai/grok-4.7#<effort>` (drop `-fast`) |
| `gpt-*` | the matching `openrouter/openai/...` model from the `opencode.models` tool |
| `inherit-parent`, `auto` | Omit `model`. |

`setup-pstack` in OpenCode writes `~/.config/opencode/pstack/pstack-models.md` (no frontmatter) instead of the `.mdc` rule. Detect models with `tools.opencode.models` in Code Mode.

## Paths

| Cursor | OpenCode |
| --- | --- |
| `.cursor/skills/verify-<app>/` | Personal: `~/.agents/skills/verify-<app>/` (from dotfiles). Team: `.agentflow/skills/verify-<app>/` in the Webflow repo, through a PR. Never write `.claude/` or `.opencode/` in the Webflow repo; Agentflow regenerates them. |
| `.cursor/rules/*.mdc` | `AGENTS.md` (global: `~/.config/opencode/AGENTS.md`) |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when it exists locally. |
| Transcripts in `~/.cursor/projects/.../agent-transcripts/` | OpenCode sessions: `opencode api get /api/session` lists them; the SQLite DB is at `opencode debug paths db` (read-only). Claude transcripts: `~/.claude/projects/<slug>/*.jsonl`. |
| `main` as the base branch | `origin/dev` in the Webflow repo |

## Cursor-only features

OpenCode has no Cursor Automations, Bugbot, Cursor cloud agents, `/deslop`, `control-ui`, or `control-cli`. When a step needs one, write one line, `Skipped in OpenCode: <step>. <reason>.`, and continue.

| Cursor | OpenCode |
| --- | --- |
| Cursor Automations, routines, Grok Bot wakes | Claude Desktop scheduled tasks (local) or Flower automations (cloud). Setting one up needs explicit user approval. |
| Bugbot | Treat Bugbot or Codex review comments as ordinary review threads via `gh`. |
| `control-ui` | `chrome-devtools` MCP or the `browser` skill; Playwright via the `browser-operations` skill. |
| `control-cli` | `shell`; for TUIs, a `tmux` session. |
| `/deslop` | the `humanizer` or `unslop` skill |
| Built-in PR tool | `gh pr create --draft --assignee @me` |

## Webflow overrides

These beat any pstack playbook step:

- Never merge. `autopilot-full` and `shipping` stop at a verified, green, draft-or-ready PR; the human lands it. Prefer `autopilot-stack`.
- Draft PRs only, assigned to `@me`, PR body via the `pr-description` skill.
- Never post comments, replies, or ticket changes as the user without an explicit instruction.
