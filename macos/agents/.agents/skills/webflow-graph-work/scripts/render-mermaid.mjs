#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const [runInput, outputInput] = process.argv.slice(2);
if (!runInput) {
  console.error("Usage: render-mermaid.mjs <run-dir> [output-file]");
  process.exit(1);
}

const runDir = resolve(runInput);
const events = readFileSync(join(runDir, "events.jsonl"), "utf8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const latest = new Map();
events.forEach((event) => latest.set(event.nodeId, event));
const nodes = [...latest.values()].sort((left, right) => left.seq - right.seq);
const aliases = new Map(nodes.map((node, index) => [node.nodeId, `n${index}`]));
const escapeLabel = (value) => String(value).replace(/["<>]/g, "").replace(/\s+/g, " ").trim();
const output = ["flowchart LR"];

for (const node of nodes) {
  const alias = aliases.get(node.nodeId);
  output.push(`  ${alias}["${escapeLabel(node.nodeId)}<br/>${node.status}"]:::${node.status}`);
}

for (const node of nodes) {
  for (const parent of node.parentNodeIds ?? []) {
    if (aliases.has(parent)) {
      const label = node.edgeLabels?.[parent];
      const edge = label ? ` -->|"${escapeLabel(label)}"| ` : " --> ";
      output.push(`  ${aliases.get(parent)}${edge}${aliases.get(node.nodeId)}`);
    }
  }
}

output.push("  classDef pending fill:#292d36,stroke:#8993a4,color:#f3f5f7");
output.push("  classDef active fill:#163b59,stroke:#62c7ff,color:#f5fbff");
output.push("  classDef passed fill:#153f2e,stroke:#63d69a,color:#f4fff9");
output.push("  classDef failed fill:#4a1f27,stroke:#ff7082,color:#fff5f6");
output.push("  classDef blocked fill:#4a3517,stroke:#f2c94c,color:#fff8dd");
output.push("  classDef skipped fill:#303030,stroke:#777,color:#ddd");

const mermaid = `${output.join("\n")}\n`;
if (outputInput) {
  writeFileSync(resolve(outputInput), mermaid);
  console.log(resolve(outputInput));
} else {
  process.stdout.write(mermaid);
}
