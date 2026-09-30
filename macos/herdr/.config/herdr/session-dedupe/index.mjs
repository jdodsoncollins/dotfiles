import { execFile, spawn } from "node:child_process"
import { promisify } from "node:util"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const exec = promisify(execFile)
const herdr = process.env.HERDR_BIN_PATH || "herdr"
const stateDir = process.env.HERDR_PLUGIN_STATE_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), ".state")
const ownersFile = path.join(stateDir, "owners.json")
const GRACE_MS = 15000
const PENDING_TTL_MS = 60000
const BUSY = new Set(["working", "blocked"])
const CLOSEABLE = new Set(["idle", "done"])

const run = async (args) => {
  try {
    const { stdout } = await exec(herdr, args, { timeout: 15000 })
    return stdout
  } catch {
    return null
  }
}

const listPanes = async () => {
  const out = await run(["pane", "list"])
  if (!out) return null
  try {
    return JSON.parse(out)?.result?.panes ?? []
  } catch {
    return null
  }
}

const sessionOf = (p) => (p.agent === "opencode" ? p.agent_session?.value : undefined)

const idOrder = (id) => parseInt(String(id).split(":p").pop(), 36) || 0

const readOwners = () => {
  try {
    return JSON.parse(fs.readFileSync(ownersFile, "utf8"))
  } catch {
    return {}
  }
}

const orderGroup = (group, owners) => [...group].sort((a, b) => {
  const busy = Number(BUSY.has(b.agent_status)) - Number(BUSY.has(a.agent_status))
  return busy || (owners[a.pane_id]?.since ?? Infinity) - (owners[b.pane_id]?.since ?? Infinity)
    || idOrder(a.pane_id) - idOrder(b.pane_id)
})

const writeOwners = (owners) => {
  try {
    fs.mkdirSync(stateDir, { recursive: true })
    const tmp = `${ownersFile}.${process.pid}`
    fs.writeFileSync(tmp, JSON.stringify(owners))
    fs.renameSync(tmp, ownersFile)
  } catch {}
}

const pendingFile = (paneId) => path.join(stateDir, `pending-${paneId.replace(/[^a-zA-Z0-9]/g, "_")}`)

const claimPending = (paneId) => {
  const file = pendingFile(paneId)
  try {
    const age = Date.now() - fs.statSync(file).mtimeMs
    if (age < PENDING_TTL_MS) return false
    fs.rmSync(file, { force: true })
  } catch {}
  try {
    fs.mkdirSync(stateDir, { recursive: true })
    fs.closeSync(fs.openSync(file, "wx"))
    return true
  } catch {
    return false
  }
}

const releasePending = (paneId) => {
  try {
    fs.rmSync(pendingFile(paneId), { force: true })
  } catch {}
}

const scan = async () => {
  const panes = await listPanes()
  if (!panes) return
  const now = Date.now()
  const prev = readOwners()
  const owners = {}
  const groups = new Map()

  for (const p of panes) {
    const s = sessionOf(p)
    if (!s) continue
    owners[p.pane_id] = prev[p.pane_id]?.session === s ? prev[p.pane_id] : { session: s, since: now }
    if (!groups.has(s)) groups.set(s, [])
    groups.get(s).push(p)
  }
  writeOwners(owners)

  for (const [session, group] of groups) {
    if (group.length < 2) continue
    const sorted = orderGroup(group, owners)
    for (const dup of sorted.slice(1)) {
      if (!CLOSEABLE.has(dup.agent_status)) continue
      if (!claimPending(dup.pane_id)) continue
      const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "close", dup.pane_id, session], {
        detached: true,
        stdio: "ignore",
        env: process.env,
      })
      child.unref()
    }
  }
}

const closeDuplicate = async (paneId, session) => {
  await new Promise((r) => setTimeout(r, GRACE_MS))
  try {
    const panes = await listPanes()
    if (!panes) return
    const dup = panes.find((p) => p.pane_id === paneId)
    if (!dup || sessionOf(dup) !== session || !CLOSEABLE.has(dup.agent_status)) return
    const group = orderGroup(panes.filter((p) => sessionOf(p) === session), readOwners())
    if (group.length < 2 || group[0].pane_id === paneId) return
    const tabId = dup.tab_id
    await run(["pane", "close", paneId])
    const after = await listPanes()
    if (!after) return
    const rest = after.filter((p) => p.tab_id === tabId)
    const sidebarOnly = rest.every(
      (p) => !p.agent && Object.keys(p.tokens ?? {}).some((k) => k.startsWith("herdr-sidebar"))
    )
    if (rest.length && sidebarOnly) await run(["tab", "close", tabId])
  } finally {
    releasePending(paneId)
  }
}

if (process.argv[2] === "close") {
  await closeDuplicate(process.argv[3], process.argv[4])
} else {
  await scan()
}
