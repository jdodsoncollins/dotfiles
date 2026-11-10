#!/usr/bin/env node

import { appendFileSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const [runInput, eventInput] = process.argv.slice(2);

if (!runInput || !eventInput) {
  console.error("Usage: append-event.mjs <run-dir> '<event-json>'");
  process.exit(1);
}

const runDir = resolve(runInput);
const metadata = JSON.parse(readFileSync(join(runDir, "metadata.json"), "utf8"));
const ledgerPath = join(runDir, "events.jsonl");
const lines = readFileSync(ledgerPath, "utf8").trim().split("\n").filter(Boolean);
const events = lines.map((line) => JSON.parse(line));
const input = eventInput.startsWith("@")
  ? JSON.parse(readFileSync(resolve(eventInput.slice(1)), "utf8"))
  : JSON.parse(eventInput);

const required = ["nodeId", "nodeType", "status", "summary"];
for (const field of required) {
  if (typeof input[field] !== "string" || !input[field].trim()) {
    console.error(`Event field ${field} must be a nonempty string`);
    process.exit(1);
  }
}

const statuses = new Set(["pending", "active", "passed", "failed", "blocked", "skipped"]);
if (!statuses.has(input.status)) {
  console.error(`Invalid status: ${input.status}`);
  process.exit(1);
}

const latest = [...events].reverse().find((event) => event.nodeId === input.nodeId);
const transitions = {
  pending: new Set(["active", "blocked", "skipped"]),
  active: new Set(["passed", "failed", "blocked"]),
  failed: new Set(["active", "blocked", "skipped"]),
  blocked: new Set(["active", "skipped"]),
  passed: new Set(["passed"]),
  skipped: new Set(["skipped"]),
};

if (latest && !transitions[latest.status]?.has(input.status)) {
  console.error(`Invalid transition for ${input.nodeId}: ${latest.status} to ${input.status}`);
  process.exit(1);
}

const parentNodeIds = input.parentNodeIds ?? [];
if (!Array.isArray(parentNodeIds) || parentNodeIds.some((value) => typeof value !== "string")) {
  console.error("parentNodeIds must be an array of strings");
  process.exit(1);
}

const edgeLabels = input.edgeLabels ?? {};
if (!edgeLabels || Array.isArray(edgeLabels) || typeof edgeLabels !== "object") {
  console.error("edgeLabels must be an object keyed by parent node id");
  process.exit(1);
}
for (const [parent, label] of Object.entries(edgeLabels)) {
  if (!parentNodeIds.includes(parent) || typeof label !== "string" || !label.trim()) {
    console.error(`Invalid edge label for parent: ${parent}`);
    process.exit(1);
  }
}

const knownNodes = new Set(events.map((event) => event.nodeId));
for (const parent of parentNodeIds) {
  if (!knownNodes.has(parent)) {
    console.error(`Parent node has not appeared in the ledger: ${parent}`);
    process.exit(1);
  }
}

const event = {
  schemaVersion: 1,
  seq: events.length + 1,
  at: new Date().toISOString(),
  runId: metadata.runId,
  nodeId: input.nodeId,
  nodeType: input.nodeType,
  status: input.status,
  summary: input.summary,
  parentNodeIds,
  edgeLabels,
  owner: input.owner ?? null,
  attempt: input.attempt ?? 1,
  artifacts: input.artifacts ?? [],
  evidence: input.evidence ?? [],
  git: input.git ?? metadata.git ?? {},
  approval: input.approval ?? null,
  metadata: input.metadata ?? {},
};

appendFileSync(ledgerPath, `${JSON.stringify(event)}\n`);
console.log(JSON.stringify(event));
