import fs from "node:fs"
import path from "node:path"

const version = process.argv[2]

if (!version || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  console.error("Usage: node scripts/set-version.mjs <version>")
  console.error("Example: node scripts/set-version.mjs 1.1.8")
  process.exit(1)
}

const root = process.cwd()

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"))
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, 2)}\n`)
}

const packageJson = readJson("package.json")
packageJson.version = version
writeJson("package.json", packageJson)

if (fs.existsSync(path.join(root, "package-lock.json"))) {
  const lockJson = readJson("package-lock.json")
  lockJson.version = version
  if (lockJson.packages?.[""]) {
    lockJson.packages[""].version = version
  }
  writeJson("package-lock.json", lockJson)
}

const tauriConfigPath = path.join(root, "src-tauri/tauri.conf.json")
const tauriConfig = fs.readFileSync(tauriConfigPath, "utf8")
fs.writeFileSync(
  tauriConfigPath,
  tauriConfig.replace(/("version"\s*:\s*")[^"]+(")/, `$1${version}$2`)
)

console.log(`Version synced to ${version}`)
