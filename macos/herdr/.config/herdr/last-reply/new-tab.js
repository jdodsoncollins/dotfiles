const { execFile } = require("node:child_process")

const herdr = process.env.HERDR_BIN_PATH ?? "herdr"

let lastError = ""

const run = (args, timeout = 20000) =>
  new Promise((resolve) => {
    execFile(herdr, args, { timeout }, (err, stdout, stderr) => {
      if (err) {
        lastError = `${err.message}${stderr ? `\n${stderr}` : ""}`
        resolve(null)
      } else {
        resolve(stdout)
      }
    })
  })

const result = (out) => {
  try {
    return JSON.parse(out)?.result ?? null
  } catch {
    return null
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const shellReady = async (paneId) => {
  const info = result(await run(["pane", "process-info", "--pane", paneId]))?.process_info
  if (!info?.shell_pid) return false
  return (info.foreground_processes ?? []).some((p) => p.pid === info.shell_pid)
}

const main = async () => {
  const created = result(await run(["tab", "create", "--focus"]))
  const tabId = created?.tab?.tab_id
  const paneId = created?.root_pane?.pane_id
  if (!tabId || !paneId) {
    process.stderr.write("tab create failed\n")
    process.exit(1)
  }

  let ready = false
  for (let i = 0; i < 40 && !ready; i++) {
    await sleep(250)
    ready = await shellReady(paneId)
  }
  if (!ready) {
    process.stderr.write(`pane ${paneId} never reached a shell prompt\n`)
    process.exit(1)
  }

  await sleep(1500)

  const name = `oc-${tabId.toLowerCase().replace(/[^a-z0-9]/g, "")}`
  let started = false
  for (let i = 0; i < 5 && !started; i++) {
    if (i > 0) await sleep(2000)
    const pane = result(await run(["pane", "get", paneId]))?.pane
    if (pane?.agent === "opencode") {
      started = true
      break
    }
    if (await run(["agent", "start", name, "--kind", "opencode", "--pane", paneId], 60000)) {
      started = true
    }
  }
  if (!started) {
    process.stderr.write(`agent start failed: ${lastError}\n`)
    process.exit(1)
  }
  process.exit(0)
}

main()