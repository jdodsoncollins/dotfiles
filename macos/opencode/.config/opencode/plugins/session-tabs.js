import { execFile } from "node:child_process"
import { promisify } from "node:util"

const exec = promisify(execFile)

export const SessionTabsPlugin = async ({ client }) => {
  const env = process.env
  if (
    env.HERDR_ENV !== "1" ||
    !env.HERDR_PANE_ID ||
    !env.HERDR_BIN_PATH ||
    !env.HERDR_SOCKET_PATH
  ) {
    return {}
  }

  const herdr = env.HERDR_BIN_PATH
  const pane = env.HERDR_PANE_ID

  const children = new Map()
  let lastRoot = null
  const spawned = new Map()

  const run = async (args, timeout = 20000) => {
    try {
      const { stdout } = await exec(herdr, args, { timeout })
      return stdout
    } catch {
      return null
    }
  }

  const rootOf = (id) => {
    const seen = new Set()
    let cur = id
    while (cur && !seen.has(cur)) {
      seen.add(cur)
      const parent = children.get(cur)
      if (!parent) return cur
      cur = parent
    }
    return cur
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

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

  const sessionDirectory = async (id) => {
    if (!client) return null
    try {
      const res = await client.session.get({ path: { id } })
      return res?.data?.directory ?? null
    } catch {
      return null
    }
  }

  const spawnTabFor = async (rootId) => {
    const now = Date.now()
    if (now - (spawned.get(rootId) ?? 0) < 10000) return
    spawned.set(rootId, now)

    const out = await run(["pane", "list"])
    if (!out) return
    let panes = []
    try {
      panes = JSON.parse(out)?.result?.panes ?? []
    } catch {
      return
    }
    if (panes.some((p) => p.pane_id !== pane && p.agent_session?.value === rootId)) return

    const dir = await sessionDirectory(rootId)
    const createArgs = ["tab", "create", "--no-focus"]
    if (dir) createArgs.push("--cwd", dir)
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

  return {
    event: async ({ event }) => {
      const type = event?.type
      const props = event?.properties ?? {}
      const info = props.info
      if (info?.id && info.parentID) children.set(info.id, info.parentID)

      const sid =
        typeof props.sessionID === "string" && props.sessionID ? props.sessionID : undefined
      if (!sid) return
      const root = rootOf(sid)

      if (type === "session.deleted") {
        if (root === lastRoot) lastRoot = null
        children.delete(sid)
        return
      }

      if (root === lastRoot) return
      const departed = lastRoot
      lastRoot = root
      if (departed == null) return
      await spawnTabFor(departed)
    },
  }
}