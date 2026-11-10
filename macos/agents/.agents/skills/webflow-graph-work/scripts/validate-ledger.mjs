#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const [runInput] = process.argv.slice(2);
if (!runInput) {
  console.error("Usage: validate-ledger.mjs <run-dir>");
  process.exit(1);
}

const runDir = resolve(runInput);
const metadata = JSON.parse(readFileSync(join(runDir, "metadata.json"), "utf8"));
const lines = readFileSync(join(runDir, "events.jsonl"), "utf8")
  .trim()
  .split("\n")
  .filter(Boolean);

const errors = [];
const events = [];
const statuses = new Set(["pending", "active", "passed", "failed", "blocked", "skipped"]);
const forbiddenKeys = /^(reasoning|chainOfThought|chain_of_thought|hiddenReasoning)$/i;
const secretText = /(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|\bsk-[A-Za-z0-9_-]{16,}|\bBearer\s+[A-Za-z0-9._-]{16,})/;
const transitions = {
  pending: new Set(["active", "blocked", "skipped"]),
  active: new Set(["passed", "failed", "blocked"]),
  failed: new Set(["active", "blocked", "skipped"]),
  blocked: new Set(["active", "skipped"]),
  passed: new Set(["passed"]),
  skipped: new Set(["skipped"]),
};

const inspect = (value, path) => {
  if (typeof value === "string" && secretText.test(value)) {
    errors.push(`${path} appears to contain a secret`);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => inspect(item, `${path}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (forbiddenKeys.test(key)) errors.push(`${path}.${key} is forbidden`);
      inspect(item, `${path}.${key}`);
    }
  }
};

for (let index = 0; index < lines.length; index += 1) {
  try {
    const event = JSON.parse(lines[index]);
    events.push(event);
    if (event.seq !== index + 1) errors.push(`line ${index + 1} has invalid seq`);
    if (event.runId !== metadata.runId) errors.push(`line ${index + 1} has the wrong runId`);
    if (event.schemaVersion !== 1) errors.push(`line ${index + 1} has unsupported schemaVersion`);
    if (!statuses.has(event.status)) errors.push(`line ${index + 1} has invalid status`);
    if (!event.nodeId || !event.nodeType || !event.summary) {
      errors.push(`line ${index + 1} is missing required fields`);
    }
    if (Number.isNaN(Date.parse(event.at))) errors.push(`line ${index + 1} has invalid at`);
    inspect(event, `line ${index + 1}`);
  } catch (error) {
    errors.push(`line ${index + 1} is not valid JSON: ${error.message}`);
  }
}

const seen = new Set();
const latestByNode = new Map();
for (const event of events) {
  for (const parent of event.parentNodeIds ?? []) {
    if (!seen.has(parent)) errors.push(`node ${event.nodeId} references unseen parent ${parent}`);
  }
  const previous = latestByNode.get(event.nodeId);
  if (previous && !transitions[previous.status]?.has(event.status)) {
    errors.push(`node ${event.nodeId} has invalid transition ${previous.status} to ${event.status}`);
  }
  const edgeLabels = event.edgeLabels ?? {};
  if (!edgeLabels || Array.isArray(edgeLabels) || typeof edgeLabels !== "object") {
    errors.push(`node ${event.nodeId} has invalid edgeLabels`);
  } else {
    for (const [parent, label] of Object.entries(edgeLabels)) {
      if (!(event.parentNodeIds ?? []).includes(parent) || typeof label !== "string" || !label.trim()) {
        errors.push(`node ${event.nodeId} has invalid edge label for ${parent}`);
      }
    }
  }
  seen.add(event.nodeId);
  latestByNode.set(event.nodeId, event);
}

if (errors.length) {
  errors.forEach((error) => console.error(error));
  process.exit(1);
}

const latest = new Map();
events.forEach((event) => latest.set(event.nodeId, event));
const counts = {};
for (const event of latest.values()) counts[event.status] = (counts[event.status] ?? 0) + 1;
console.log(JSON.stringify({ valid: true, runId: metadata.runId, events: events.length, nodes: latest.size, statusCounts: counts }));
