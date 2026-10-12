import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import fsSync from "node:fs"
import os from "node:os"
import path from "node:path"
import vm from "node:vm"
import { promisify } from "node:util"

const source = (await fs.readFile(new URL("../opencode/.config/opencode/session-tabs.js", import.meta.url), "utf8"))
  .replace(/^import .*\n/gm, "")
  .replace("export default", "globalThis.plugin =")
const flush = async () => {
  for (let i = 0; i < 80; i++) await new Promise(setImmediate)
}

async function harness(test) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "session-tabs-test-"))
  const calls = []
  const sessions = new Map([
    ["A", { id: "A", location: { directory: "/project" } }],
    ["old", { id: "old", location: { directory: "/project" } }],
    ["child", { id: "child", parentID: "A" }],
  ])
  let route = { type: "session", sessionID: "A" }
  let poll
  let dispose
  let panes = []
  let gate
  let count = 0
  const timers = new Set()
  const api = {
    ui: { router: { current: () => route } },
    data: { session: { get: (id) => sessions.get(id) } },
  }
  const context = vm.createContext({
    fs: fsSync, path, os, promisify, AbortController,
    process: { env: { HOME: dir, HERDR_ENV: "1", HERDR_PANE_ID: "current",
      HERDR_BIN_PATH: "herdr", HERDR_SOCKET_PATH: "/socket", HERDR_SPAWNS_DIR: dir } },
    setInterval: (fn) => { poll = fn; return 1 },
    clearInterval: () => { poll = undefined },
    setTimeout: (fn, ms) => {
      const timer = { unref() {} }
      if (ms === 250) queueMicrotask(fn)
      else timers.add({ timer, fn })
      return timer
    },
    clearTimeout: (timer) => {
      for (const entry of timers) if (entry.timer === timer) timers.delete(entry)
    },
    execFile: (_bin, args, options, callback) => {
      calls.push([...args])
      const respond = async () => {
        if (args[0] === "pane" && args[1] === "list" && gate) await gate
        if (options.signal?.aborted) return callback(new Error("aborted"))
        let result = {}
        if (args[0] === "pane" && args[1] === "list") result = { panes }
        if (args[0] === "tab" && args[1] === "create") {
          count++
          result = { tab: { tab_id: `tab${count}` }, root_pane: { pane_id: `pane${count}` } }
        }
        if (args[1] === "process-info") result = { process_info: { shell_pid: 7, foreground_processes: [{ pid: 7 }] } }
        callback(null, JSON.stringify({ result }), "")
      }
      void respond()
    },
  })
  context.execFile[promisify.custom] = (bin, args, options) => new Promise((resolve, reject) => {
    context.execFile(bin, args, options, (error, stdout, stderr) => {
      if (error) reject(error)
      else resolve({ stdout, stderr })
    })
  })
  try {
    vm.runInContext(source, context)
    dispose = await context.plugin.setup(api)
    const h = {
      calls, sessions,
      select(id) { route = id ? { type: "session", sessionID: id } : { type: "home" }; poll() },
      tick() { poll() },
      dispose() { dispose() },
      panes(value) { panes = value },
      gate(value) { gate = value },
      creates() { return calls.filter((args) => args[0] === "tab" && args[1] === "create") },
      starts() { return calls.filter((args) => args[0] === "agent" && args[1] === "start") },
      markers() { return fs.readdir(dir) },
      pendingTimers() { return timers.size },
    }
    await test(h)
  } finally {
    dispose?.()
    await flush()
    await fs.rm(dir, { recursive: true, force: true })
  }
}

describe("sessions own their tab views", () => {
  it("/new keeps the current tab and opens the departed session in a background tab", async () => {
    await harness(async (h) => {
      h.select(undefined)
      await flush()
      assert.equal(h.creates().length, 1)
      assert.ok(h.creates()[0].includes("--no-focus"))
      assert.deepEqual(h.starts()[0].slice(-2), ["--session", "A"])
      assert.deepEqual(await h.markers(), ["A.json"])
      assert.ok(!h.calls.some((args) => args.includes("delete")))
    })
  })
  it("opening an old session takes over the current tab and preserves the departed session", async () => {
    await harness(async (h) => {
      h.select("old")
      await flush()
      assert.deepEqual(h.starts().map((args) => args.at(-1)), ["A"])
    })
  })
  it("does not spawn another view when the departed session already has one", async () => {
    await harness(async (h) => {
      h.panes([{ pane_id: "other", agent: "opencode", agent_session: { value: "A" } }])
      h.select("old")
      await flush()
      assert.equal(h.creates().length, 0)
    })
  })
  it("another agent's matching session ID does not count as an OpenCode view", async () => {
    await harness(async (h) => {
      h.panes([{ pane_id: "other", agent: "codex", agent_session: { value: "A" } }])
      h.select("old")
      await flush()
      assert.deepEqual(h.starts().map((args) => args.at(-1)), ["A"])
    })
  })
  it("can reopen a closed view on a later departure within ten seconds", async () => {
    await harness(async (h) => {
      h.select(undefined)
      await flush()
      h.select("A")
      h.select(undefined)
      await flush()
      assert.equal(h.creates().length, 2)
    })
  })
  it("waits for session metadata instead of treating loading as a departure", async () => {
    await harness(async (h) => {
      h.select("loading")
      await flush()
      assert.equal(h.creates().length, 0)
      h.sessions.set("loading", { id: "loading", location: { directory: "/project" } })
      h.tick()
      await flush()
      assert.deepEqual(h.starts().map((args) => args.at(-1)), ["A"])
    })
  })
  it("opening a child session does not create another root-session view", async () => {
    await harness(async (h) => {
      h.select("child")
      await flush()
      assert.equal(h.creates().length, 0)
    })
  })
  it("opens the resumed tab in the session's V2 location, including after a worktree move", async () => {
    await harness(async (h) => {
      h.sessions.get("A").location.directory = "/worktrees/rate-limit"
      h.select(undefined)
      await flush()
      assert.deepEqual(h.creates()[0].slice(-2), ["--cwd", "/worktrees/rate-limit"])
    })
  })
  it("coalesces repeated departures while a spawn is still in flight", async () => {
    await harness(async (h) => {
      let release
      h.gate(new Promise((resolve) => { release = resolve }))
      h.select(undefined)
      h.select("A")
      h.select(undefined)
      release()
      await flush()
      assert.equal(h.creates().length, 1)
    })
  })
  it("closing the TUI cancels pending work without reopening its session", async () => {
    await harness(async (h) => {
      let release
      h.gate(new Promise((resolve) => { release = resolve }))
      h.select(undefined)
      h.dispose()
      release()
      await flush()
      assert.equal(h.creates().length, 0)
      assert.equal(h.pendingTimers(), 0)
    })
  })
})
