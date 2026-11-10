# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` as a value: the role runs on the parent chat model (omit Agent `model`). Alias entries in a panel list still count toward its fan-out.
# Claude Code accepts only opus, sonnet, haiku, fable. Grok defaults are mapped to sonnet instead of inherit-parent, so fan-out never silently runs on a Fable parent.
# Rerun /pstack:setup-pstack to change these.
# budget: large (xhigh)
feature, refactoring: sonnet xhigh
bug-fix: sonnet xhigh
perf-issue: sonnet xhigh
hillclimb: sonnet xhigh
judgment and prose: opus xhigh
hardest tasks: opus xhigh
how explorer: sonnet high
how explainer: opus xhigh
why investigators: sonnet high
why synthesizer: opus xhigh
reflect tooling: sonnet high
reflect judgment, divergent, synthesizer: opus xhigh
arena runners: opus xhigh, sonnet xhigh
arena cross-judge pool: opus xhigh, sonnet xhigh
swarm workers: sonnet high
architect runners: opus xhigh, sonnet xhigh
interrogate reviewers: opus xhigh, sonnet xhigh
