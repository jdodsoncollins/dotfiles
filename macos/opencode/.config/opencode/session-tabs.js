import { execFile } from "node:child_process"
import { promisify } from "node:util"
import fs from "node:fs"
import path from "node:path"

const exec = promisify(execFile)
const POLL_MS = 250

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default {
  id: "dotfiles.session-tabs",
  tui: async (api) => {
    const env = process.env
    if (
      env.HERDR_ENV !== "1" ||
      !env.HERDR_PANE_ID ||
      !env.HERDR_BIN_PATH ||
      !env.HERDR_SOCKET_PATH
    ) {
      return
    }

    const herdr = env.HERDR_BIN_PATH
    const pane = env.HERDR_PANE_ID
    const spawnsDir =
      env.HERDR_SPAWNS_DIR || path.join(env.HOME || "", ".config", "herdr", "session-tabs-spawns")
    const spawning = new Set()
    const scanTimers = new Set()
    const controller = new AbortController()
    let selected

    const run = async (args, timeout = 20000) => {
      if (controller.signal.aborted) return null
      try {
        const { stdout } = await exec(herdr, args, { timeout, signal: controller.signal })
        return stdout
      } catch {
        return null
      }
    }

    const session = (id) => {
      try {
        return api.state.session.get(id)
      } catch {
        return undefined
      }
    }

    const rootOf = (id) => {
      const seen = new Set()
      let cur = id
      while (typeof cur === "string" && !seen.has(cur)) {
        seen.add(cur)
        const s = session(cur)
        if (!s) return undefined
        if (!s.parentID) return cur
        cur = s.parentID
      }
      return undefined
    }

    const current = () => {
      const route = api.route.current
      if (route?.name === "home") return null
      const id = route?.name === "session" ? route.params?.sessionID : undefined
      return typeof id === "string" && id ? rootOf(id) : undefined
    }

    const shellReady = async (paneId) => {
      const out = await run(["pane", "process-info", "--pane", paneId])
      if (!out) return false
      try {
        const info = JSON.parse(out)?.result?.process_info
        if (!info?.shell_pid) return false
        return (info.foreground_processes ?? []).some((p) => p.pid === info.shell_pid)
      } catch {
        return false
      }
    }

    const spawnTabFor = async (rootId) => {
      const info = session(rootId)
      if (!info) return

      const out = await run(["pane", "list"])
      if (!out) return
      let panes = []
      try {
        panes = JSON.parse(out)?.result?.panes ?? []
      } catch {
        return
      }
      if (panes.some((p) => p.pane_id !== pane && p.agent === "opencode" && p.agent_session?.value === rootId)) return

      const createArgs = ["tab", "create", "--no-focus"]
      if (info.directory) createArgs.push("--cwd", info.directory)
      const createdOut = await run(createArgs)
      if (!createdOut) return
      let tabId
      let newPane
      try {
        const r = JSON.parse(createdOut)?.result
        tabId = r?.tab?.tab_id
        newPane = r?.root_pane?.pane_id
      } catch {}
      if (!tabId || !newPane) return

      // Mark this pane as a deliberate session-tabs spawn so session-dedupe
      // never closes it while the departed pane's report is still stale.
      try {
        fs.mkdirSync(spawnsDir, { recursive: true })
        fs.writeFileSync(
          path.join(spawnsDir, `${rootId}.json`),
          JSON.stringify({ pane: newPane, tab: tabId, session: rootId, at: Date.now() })
        )
      } catch {
        return
      }

      let ready = false
      for (let i = 0; i < 40 && !ready; i++) {
        await sleep(250)
        ready = await shellReady(newPane)
      }
      if (!ready) return

      const name = `oc-${tabId.toLowerCase().replace(/[^a-z0-9]/g, "")}`
      await run(
        ["agent", "start", name, "--kind", "opencode", "--pane", newPane, "--", "--session", rootId],
        60000
      )
    }

    const preserve = async (rootId) => {
      if (spawning.has(rootId) || controller.signal.aborted) return
      spawning.add(rootId)
      try {
        await spawnTabFor(rootId)
      } finally {
        spawning.delete(rootId)
      }
    }

    const tick = () => {
      const id = current()
      if (id === undefined) return
      if (id === selected) return
      const departed = selected
      selected = id
      if (departed) void preserve(departed).catch(() => {})
      if (id) {
        const timer = setTimeout(() => {
          scanTimers.delete(timer)
          void run(["plugin", "action", "invoke", "scan", "--plugin", "session-dedupe"])
        }, 1500)
        scanTimers.add(timer)
        timer.unref?.()
      }
    }

    tick()
    const poll = setInterval(tick, POLL_MS)
    api.lifecycle.onDispose(() => {
      controller.abort()
      clearInterval(poll)
      for (const timer of scanTimers) clearTimeout(timer)
      scanTimers.clear()
    })
  },
}
