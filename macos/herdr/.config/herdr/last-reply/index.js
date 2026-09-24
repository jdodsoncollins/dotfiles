const { execFile } = require("node:child_process")
const path = require("node:path")

const herdr = process.env.HERDR_BIN_PATH ?? "herdr"

const run = (args, timeout = 15000) =>
  new Promise((resolve) => {
    execFile(herdr, args, { timeout }, (err, stdout) => resolve(err ? null : stdout))
  })

const git = (cwd, args) =>
  new Promise((resolve) => {
    execFile("git", ["-C", cwd, ...args], { timeout: 5000 }, (err, stdout) =>
      resolve(err ? null : stdout.trim())
    )
  })

const result = (out) => {
  try {
    return JSON.parse(out)?.result ?? null
  } catch {
    return null
  }
}

const main = async () => {
  const raw = process.env.HERDR_PLUGIN_EVENT_JSON
  if (!raw) return

  let data = {}
  try {
    data = JSON.parse(raw).data ?? {}
  } catch {
    return
  }

  const pane = data.pane_id ?? data.paneId
  if (!pane) return

  const now = new Date()
  const hhmm = [now.getHours(), now.getMinutes()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":")

  await run([
    "pane",
    "report-metadata",
    pane,
    "--source",
    "user:last-reply",
    "--token",
    `last_reply=${hhmm}`,
  ])

  const info = (result(await run(["pane", "list"]))?.panes ?? []).find(
    (p) => p.pane_id === pane
  )
  if (!info) return

  let branch = ""
  let worktree = ""
  if (info.cwd && (await git(info.cwd, ["rev-parse", "--is-inside-work-tree"])) === "true") {
    branch =
      (await git(info.cwd, ["branch", "--show-current"])) ||
      (await git(info.cwd, ["rev-parse", "--short", "HEAD"])) ||
      ""
    const gitDir = await git(info.cwd, ["rev-parse", "--absolute-git-dir"])
    let commonDir = await git(info.cwd, ["rev-parse", "--git-common-dir"])
    if (gitDir && commonDir) {
      if (!commonDir.startsWith("/")) commonDir = path.resolve(info.cwd, commonDir)
      if (gitDir !== commonDir) {
        const topLevel = await git(info.cwd, ["rev-parse", "--show-toplevel"])
        worktree = topLevel ? path.basename(topLevel) : ""
      }
    }
  }

  if (info.tokens?.branch !== branch || info.tokens?.worktree !== worktree) {
    await run([
      "pane",
      "report-metadata",
      pane,
      "--source",
      "user:last-reply",
      "--token",
      `branch=${branch}`,
      "--token",
      `worktree=${worktree}`,
    ])
  }

  if (!info.tab_id) return

  const topic = info.tokens?.quota_topic
  let label =
    typeof topic === "string" && topic.trim()
      ? topic.trim()
      : (info.terminal_title_stripped ?? "")
  label = label
    .replace(/[\u200b-\u200f\u202a-\u202e\ufeff]/g, "")
    .replace(/^OC \| /, "")
    .trim()
  if (!label) return
  if (label.length > 48) label = `${label.slice(0, 47)}…`

  const tab = (result(await run(["tab", "list"]))?.tabs ?? []).find(
    (t) => t.tab_id === info.tab_id
  )
  if (!tab || tab.label === label) return

  await run(["tab", "rename", info.tab_id, label])
}

main()