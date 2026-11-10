# Flower overnight drafts (cloud loop)

The factory step of the outer loop. It runs in Flower's cloud sandbox while the laptop is off.

```text
lif-morning-queue (Claude Desktop, 8:15)  ->  Jeremy applies "good for agent" in Linear (checkpoint)
  ->  lif-overnight-drafts (Flower, 21:00)  ->  draft PRs  ->  pr-babysit-sweep (next day)
```

## Definition

Create it from the Flower app (Automations page) or through the Flower MCP (`automations_save` with `id: null`), and leave it **disabled** until Jeremy reviews it. Creating it acts in Jeremy's account, so get explicit approval first.

- **Title:** LIF overnight drafts
- **Trigger:** schedule, weekdays at 21:00 in Jeremy's time zone (`at({ time: '21:00', weekdays: ['mon','tue','wed','thu','fri'], timeZone })`)
- **Start:** `flower:/github/webflow/webflow`, fresh context
- **Prompt:**

```text
Find up to 2 Linear issues in team LIF that are assigned to Jeremy Collins, carry the label "good for agent", and are not started or in progress. Take the highest priority first.

For each issue:
1. Read the issue, its comments, and any agent brief. If the brief has no checkable definition of done, skip it and say why.
2. Check the work has not already been done: gh pr list --repo webflow/webflow --search "<issue identifier>" --state all, and read the target files.
3. Implement on a new branch named jc/<issue identifier lowercased>-<short-slug>, following AGENTS.md and the Agentflow rules for the touched paths.
4. Prove it: the brief's verify command, the relevant tsc shard, eslint on changed files, and the targeted tests. If you cannot prove it, do not open a PR; report what blocked verification.
5. Open a draft PR assigned to @me with the title "[<issue identifier>] <summary>" and a body written with the pr-description skill.

Never merge, mark ready, comment on Linear or GitHub, change issue state or labels, change feature flags, or touch production systems.

Finish with one line per issue: identifier, outcome (draft PR link, skipped, or blocked), and the verification evidence.
```

## Promotion

Start with a cap of 2 issues per night. Raise it only after a week of draft PRs that passed review without rework.
