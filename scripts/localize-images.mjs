// 把筆記裡從 Wikimedia 直接連結的圖片下載進 repo、轉成 WebP，並把連結改成本機路徑。
// 用法：node scripts/localize-images.mjs
// 圖片存到 content/assets/images/，已經下載過的會略過。
import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const CONTENT = "content"
const OUT_DIR = path.join(CONTENT, "assets", "images")
const MAX_WIDTH = 800
const HOSTS = /^https?:\/\/(commons\.wikimedia\.org|upload\.wikimedia\.org)\//
// Wikimedia 規定要帶可識別的 User-Agent
const UA = "kuripsy.space image localizer (https://kuripsy.space)"

// 網址可能用 <> 包起來（裡面可以有括號），或直接寫
const imageRe = /!\[([^\]]*)\]\(\s*(?:<(https?:\/\/[^>]+)>|(https?:\/\/[^)\s]+))\s*\)/g

async function walk(dir) {
  const out = []
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else if (e.name.endsWith(".md")) out.push(p)
  }
  return out
}

function nameFor(url) {
  const u = new URL(url)
  const raw = decodeURIComponent(u.pathname.split("/").pop() ?? "image")
  const stem = raw.replace(/\.[a-z0-9]+$/i, "")
  const slug = stem
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
  return `${slug || "image"}.webp`
}

async function download(url) {
  const u = new URL(url)
  const requested = Number(u.searchParams.get("width")) || MAX_WIDTH
  u.searchParams.set("width", String(Math.min(requested, MAX_WIDTH) * 2))
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(u, { headers: { "User-Agent": UA }, redirect: "follow" })
    if (res.ok)
      return { buf: Buffer.from(await res.arrayBuffer()), width: Math.min(requested, MAX_WIDTH) }
    if (attempt === 3) throw new Error(`${res.status} ${url}`)
    await new Promise((r) => setTimeout(r, 2000 * attempt))
  }
}

await fs.mkdir(OUT_DIR, { recursive: true })
const done = new Map()
let changedFiles = 0

for (const file of await walk(CONTENT)) {
  const text = await fs.readFile(file, "utf8")
  const matches = [...text.matchAll(imageRe)]
    .map((m) => ({ full: m[0], alt: m[1], url: m[2] ?? m[3] }))
    .filter((m) => HOSTS.test(m.url))
  if (matches.length === 0) continue

  let next = text
  for (const m of matches) {
    const url = m.url
    if (!done.has(url)) {
      const name = nameFor(url)
      const dest = path.join(OUT_DIR, name)
      try {
        await fs.access(dest)
      } catch {
        const { buf, width } = await download(url)
        await sharp(buf)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(dest)
        console.log(`下載 ${name}`)
        await new Promise((r) => setTimeout(r, 500))
      }
      done.set(url, dest)
    }
    const rel = path.relative(path.dirname(file), done.get(url)).split(path.sep).join("/")
    next = next.replace(m.full, `![${m.alt}](${rel})`)
  }
  if (next !== text) {
    await fs.writeFile(file, next)
    changedFiles++
    console.log(`改寫 ${file}（${matches.length} 張）`)
  }
}
console.log(`完成：${done.size} 張圖、${changedFiles} 個檔案`)
