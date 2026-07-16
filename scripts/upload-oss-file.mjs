import OSS from "ali-oss"

const args = new Map()
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1])
}

const file = args.get("--file")
const key = args.get("--key") || process.env.ALI_OSS_OBJECT_KEY || "latest.json"

const required = {
  ALI_OSS_ACCESS_KEY_ID: process.env.ALI_OSS_ACCESS_KEY_ID,
  ALI_OSS_ACCESS_KEY_SECRET: process.env.ALI_OSS_ACCESS_KEY_SECRET,
  ALI_OSS_BUCKET: process.env.ALI_OSS_BUCKET,
  ALI_OSS_REGION: process.env.ALI_OSS_REGION
}

const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([name]) => name)

if (!file || missing.length > 0) {
  console.error("Usage: node scripts/upload-oss-file.mjs --file ./latest.json --key latest.json")
  if (missing.length > 0) {
    console.error(`Missing env: ${missing.join(", ")}`)
  }
  process.exit(1)
}

const client = new OSS({
  region: process.env.ALI_OSS_REGION,
  endpoint: process.env.ALI_OSS_ENDPOINT || undefined,
  accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
  stsToken: process.env.ALI_OSS_STS_TOKEN || undefined,
  bucket: process.env.ALI_OSS_BUCKET,
  secure: process.env.ALI_OSS_SECURE !== "false"
})

await client.put(key, file, {
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache"
  }
})

console.log(`Uploaded ${file} to oss://${process.env.ALI_OSS_BUCKET}/${key}`)
