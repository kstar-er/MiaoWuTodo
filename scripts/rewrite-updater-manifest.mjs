import fs from "node:fs"
import path from "node:path"

const args = new Map()
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1])
}

const input = args.get("--input")
const output = args.get("--output")
const tag = args.get("--tag") || process.env.GITHUB_REF_NAME

if (!input || !output || !tag) {
  console.error("Usage: node scripts/rewrite-updater-manifest.mjs --input latest.json --output latest.gitee.json --tag v1.1.8")
  process.exit(1)
}

const githubReleaseBase =
  process.env.GITHUB_RELEASE_BASE ||
  `https://github.com/${process.env.GITHUB_REPOSITORY || "kstar-er/MiaoWuTodo"}/releases/download/${tag}`

const giteeReleaseBase =
  process.env.GITEE_RELEASE_BASE ||
  `https://gitee.com/k_star/miao-wu-todo/releases/download/${tag}`

const source = fs.readFileSync(input, "utf8")
const rewritten = source
  .replaceAll(`${githubReleaseBase}/`, `${giteeReleaseBase}/`)
  .replaceAll(githubReleaseBase, giteeReleaseBase)

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, rewritten)

console.log(`Updater manifest written: ${output}`)
console.log(`Replaced release base: ${githubReleaseBase} -> ${giteeReleaseBase}`)
