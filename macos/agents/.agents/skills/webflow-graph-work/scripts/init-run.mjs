#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const [slugInput, workspaceInput = process.cwd()] = process.argv.slice(2);

if (!slugInput) {
  console.error("Usage: init-run.mjs <task-slug> [workspace-root]");
  process.exit(1);
}

const slug = slugInput
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 48);

if (!slug) {
  console.error("Task slug must contain a letter or number");
  process.exit(1);
}

const workspaceRoot = resolve(workspaceInput);
const runsRoot = join(workspaceRoot, "tmp", "agent-runs");
const gitRoot = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  cwd: workspaceRoot,
  encoding: "utf8",
});

if (gitRoot.status === 0) {
  const probe = relative(workspaceRoot, join(runsRoot, ".graph-work-probe"));
  const ignored = spawnSync("git", ["check-ignore", "-q", probe], {
    cwd: workspaceRoot,
  });
  if (ignored.status !== 0) {
    console.error(`${relative(workspaceRoot, runsRoot)} must be ignored by Git`);
    process.exit(1);
  }
}

const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, "").replace("Z", "Z");
const runId = `${stamp}-${slug}`;
const runDir = join(runsRoot, runId);
mkdirSync(runsRoot, { recursive: true });
mkdirSync(runDir, { recursive: false });

const gitValue = (args) => {
  const result = spawnSync("git", args, { cwd: workspaceRoot, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
};

const metadata = {
  schemaVersion: 1,
  graphVersion: 1,
  runId,
  slug,
  createdAt: now.toISOString(),
  workspaceRoot,
  ledgerPath: join(runDir, "events.jsonl"),
  git: {
    worktree: workspaceRoot,
    branch: gitValue(["branch", "--show-current"]),
    headSha: gitValue(["rev-parse", "HEAD"]),
    baseSha: gitValue(["merge-base", "HEAD", "origin/dev"]),
  },
};

const initialEvent = {
  schemaVersion: 1,
  seq: 1,
  at: now.toISOString(),
  runId,
  nodeId: "intake",
  nodeType: "coordinator",
  status: "active",
  summary: "Run initialized",
  parentNodeIds: [],
  edgeLabels: {},
  owner: "coordinator",
  attempt: 1,
  artifacts: [],
  evidence: [],
  git: metadata.git,
  metadata: {},
};

writeFileSync(join(runDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, {
  flag: "wx",
});
writeFileSync(join(runDir, "events.jsonl"), `${JSON.stringify(initialEvent)}\n`, {
  flag: "wx",
});

console.log(runDir);
