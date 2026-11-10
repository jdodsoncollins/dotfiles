# pstack model configuration for OpenCode. One line per role. Delete a line to fall back to the skill default.
# Values are OpenCode provider/model#variant slugs. `inherit-parent` or `auto`: omit `model` so the role runs on the parent model.
# Code roles follow pstack's default family (Grok); judgment stays on Opus. Panels mix families so reviews stay diverse.
# budget: large (xhigh)
feature, refactoring: openrouter/x-ai/grok-4.7#xhigh
bug-fix: openrouter/x-ai/grok-4.7#xhigh
perf-issue: openrouter/x-ai/grok-4.7#xhigh
hillclimb: openrouter/x-ai/grok-4.7#xhigh
judgment and prose: openrouter/anthropic/claude-opus-5.5#xhigh
hardest tasks: openrouter/anthropic/claude-opus-5.5#xhigh
how explorer: openrouter/x-ai/grok-4.7#xhigh
how explainer: openrouter/anthropic/claude-opus-5.5#xhigh
why investigators: openrouter/x-ai/grok-4.7#xhigh
why synthesizer: openrouter/anthropic/claude-opus-5.5#xhigh
reflect tooling: openrouter/x-ai/grok-4.7#xhigh
reflect judgment, divergent, synthesizer: openrouter/anthropic/claude-opus-5.5#xhigh
arena runners: openrouter/anthropic/claude-opus-5.5#xhigh, openrouter/x-ai/grok-4.7#xhigh, openrouter/openai/gpt-6.1-sol#xhigh
arena cross-judge pool: openrouter/openai/gpt-6.1-sol#xhigh, openrouter/x-ai/grok-4.7#xhigh, openrouter/anthropic/claude-opus-5.5#xhigh
swarm workers: openrouter/x-ai/grok-4.7#xhigh
architect runners: openrouter/anthropic/claude-opus-5.5#xhigh, openrouter/x-ai/grok-4.7#xhigh
interrogate reviewers: openrouter/anthropic/claude-opus-5.5#xhigh, openrouter/x-ai/grok-4.7#xhigh, openrouter/openai/gpt-6.1-sol#xhigh
