const { spawn } = require("node:child_process")
const fs = require("node:fs")
const net = require("node:net")
const path = require("node:path")

const socketPath = process.env.HERDR_SOCKET_PATH
const pluginRoot = process.env.HERDR_PLUGIN_ROOT
const stateDir = process.env.HERDR_PLUGIN_STATE_DIR
if (process.env.HERDR_ENV !== "1" || !socketPath || !pluginRoot || !stateDir) {
  process.exit(0)
}

const pidFile = path.join(stateDir, "title-watch.pid")
try {
  const pid = Number(fs.readFileSync(pidFile, "utf8"))
  if (Number.isFinite(pid)) {
    process.kill(pid, 0)
    process.exit(0)
  }
} catch {}
fs.mkdirSync(stateDir, { recursive: true })
fs.writeFileSync(pidFile, String(process.pid))
process.on("exit", () => {
  try {
    if (fs.readFileSync(pidFile, "utf8") === String(process.pid)) fs.unlinkSync(pidFile)
  } catch {}
})

const lastSpawn = new Map()

const spawnRefresh = (paneId) => {
  const now = Date.now()
  if (now - (lastSpawn.get(paneId) ?? 0) < 700) return
  lastSpawn.set(paneId, now)
  const child = spawn(process.execPath, [path.join(pluginRoot, "index.js")], {
    env: {
      ...process.env,
      HERDR_PLUGIN_EVENT_JSON: JSON.stringify({
        event: "pane_updated",
        data: { pane_id: paneId },
      }),
    },
    stdio: "ignore",
    detached: true,
  })
  child.unref()
}

const paneIdFrom = (msg) =>
  msg?.data?.pane_id ??
  msg?.data?.pane?.pane_id ??
  msg?.params?.pane_id ??
  msg?.params?.pane?.pane_id ??
  msg?.result?.pane?.pane_id ??
  msg?.pane_id

const connect = () => {
  const client = net.createConnection(socketPath, () => {
    client.write(
      `${JSON.stringify({
        id: `title-watch:${Date.now()}`,
        method: "events.subscribe",
        params: { subscriptions: [{ type: "pane.updated" }] },
      })}\n`
    )
  })

  let buffer = ""
  client.on("data", (chunk) => {
    buffer += chunk.toString()
    let idx
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 1)
      if (!line.trim()) continue
      let msg
      try {
        msg = JSON.parse(line)
      } catch {
        continue
      }
      const name = msg?.event ?? msg?.type ?? msg?.result?.type ?? ""
      if (!String(name).includes("pane.updated") && !String(name).includes("pane_updated")) {
        continue
      }
      const paneId = paneIdFrom(msg)
      if (paneId) spawnRefresh(paneId)
    }
  })

  client.on("error", () => {})
  client.on("close", () => setTimeout(connect, 2000))
}

connect()