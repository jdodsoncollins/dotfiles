import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const exec = promisify(execFile)
const plugin = fileURLToPath(new URL("../herdr/.config/herdr/session-dedupe/index.mjs", import.meta.url))
const session = "test-session"
const pane = (id, status = "idle", agent = "opencode") => ({
  pane_id: id, tab_id: "w1:t1", agent, agent_status: status,
  agent_session: { value: session }, focused: true,
})

async function run(panes, args) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "session-dedupe-test-"))
  try {
    const mock = path.join(dir, "herdr")
    const log = path.join(dir, "calls.jsonl")
    await fs.writeFile(mock, `#!${process.execPath}
const fs = require("node:fs");
const args = process.argv.slice(2);
if (args[0] === "pane" && args[1] === "list") {
  process.stdout.write(JSON.stringify({result: {panes: JSON.parse(process.env.TEST_PANES)}}));
} else {
  fs.appendFileSync(process.env.TEST_LOG, JSON.stringify(args) + "\\n");
  process.stdout.write(JSON.stringify({result: {}}));
}
`, { mode: 0o755 })
    await fs.writeFile(path.join(dir, "owners.json"), JSON.stringify({
      "w1:p1": { session, since: 1 }, "w1:p2": { session, since: 2 },
    }))
    await exec(process.execPath, [plugin, ...args], {
      env: { ...process.env, HERDR_BIN_PATH: mock, HERDR_PLUGIN_STATE_DIR: dir,
        TEST_PANES: JSON.stringify(panes), TEST_LOG: log }, timeout: 25000,
    })
    const calls = await fs.readFile(log, "utf8").catch(() => "")
    return calls.trim() ? calls.trim().split("\n").map(JSON.parse) : []
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
}

describe("session dedupe safety", { concurrency: true }, () => {
  it("closes an idle duplicate without a focus command", async () => {
    assert.deepEqual(await run([pane("w1:p1"), pane("w1:p2")], ["close", "w1:p2", session]),
      [["pane", "close", "w1:p2"]])
  })
  it("rechecks ownership before closing the older keeper", async () => {
    assert.deepEqual(await run([pane("w1:p1"), pane("w1:p2")], ["close", "w1:p1", session]), [])
  })
  it("keeps working duplicates", async () => {
    assert.deepEqual(await run([pane("w1:p1"), pane("w1:p2", "working")], ["close", "w1:p2", session]), [])
  })
  it("keeps unknown-status panes", async () => {
    assert.deepEqual(await run([pane("w1:p1"), pane("w1:p2", "unknown")], ["close", "w1:p2", session]), [])
  })
  it("does not conflate another agent's session ID", async () => {
    assert.deepEqual(await run([pane("w1:p1", "idle", "codex"), pane("w1:p2")], ["close", "w1:p2", session]), [])
  })
  it("scan does not redirect focused busy panes", async () => {
    assert.deepEqual(await run([pane("w1:p1", "working"), pane("w1:p2", "blocked")], []), [])
  })
})
