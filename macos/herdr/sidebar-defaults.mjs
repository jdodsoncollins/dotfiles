import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const file = path.join(os.homedir(), ".local/state/herdr/plugins/herdr-sidebar/state.json")
const state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {}
state.auto_open = false
fs.mkdirSync(path.dirname(file), { recursive: true })
fs.writeFileSync(file, JSON.stringify(state))
console.log(`Disabled sidebar auto-open in ${file}`)
