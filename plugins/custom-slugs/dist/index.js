// 自訂網址（slug）
//
// Quartz 預設用「資料夾/檔名」當網址，中文會變成一長串 %E7%A5…。
// 這個外掛讓網址改用英文，但中文檔名和 [[雙向連結]] 完全不用動：
//   - 每篇筆記的 frontmatter 寫 `slug: frontal-lobe`，決定網址最後一段
//   - quartz.config.yaml 的 folders 對照表決定資料夾那幾段；設成 "" 代表這層不出現在網址
// 運作方式：其他外掛照原本的中文路徑處理完之後，這個外掛（排在最後）再把
//   1. 這一頁的 slug 換成英文
//   2. 頁面裡所有站內連結、圖片路徑，依新位置重新計算
//   3. 舊的中文網址加進 aliases，讓舊連結自動轉址
import fs from "node:fs"
import path from "node:path"
import {
  slugifyFilePath,
  simplifySlug,
  resolveRelative,
  joinSegments,
} from "@quartz-community/utils"

const FM = /^---\r?\n([\s\S]*?)\r?\n---/
const SLUG_LINE = /^slug:\s*["']?([^"'\r\n]+?)["']?\s*$/m

function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, base, out)
    else if (e.name.endsWith(".md")) out.push(path.relative(base, p).split(path.sep).join("/"))
  }
  return out
}

function cleanSegment(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

// 原本的 slug（中文路徑）→ 新的 slug（英文）
function buildMap(root, folders) {
  const map = new Map()
  const folderMap = new Map(Object.entries(folders ?? {}))
  const mapFolder = (dirParts) => {
    const out = []
    for (let i = 0; i < dirParts.length; i++) {
      const key = dirParts.slice(0, i + 1).join("/")
      const seg = folderMap.has(key) ? folderMap.get(key) : dirParts[i]
      if (seg !== "") out.push(seg)
    }
    return out
  }
  for (const rel of walk(root)) {
    const original = slugifyFilePath(rel)
    const parts = rel.split("/")
    const stem = parts.pop().replace(/\.md$/, "")
    const text = fs.readFileSync(path.join(root, rel), "utf8")
    const fm = FM.exec(text)?.[1] ?? ""
    const custom = SLUG_LINE.exec(fm)?.[1]
    const dir = mapFolder(parts)
    let last
    if (stem === "index") last = "index"
    else if (custom) last = cleanSegment(custom)
    else last = stem
    const next = slugifyFilePath([...dir, last].join("/") + ".md")
    if (next !== original) map.set(original, next)
  }
  // 資料夾頁（folder/index）也要對照
  const folderPages = new Map()
  for (const [orig, next] of map) {
    let o = orig.split("/")
    let n = next.split("/")
    o.pop()
    n.pop()
    while (o.length > 0) {
      const ok = o.join("/") + "/index"
      if (!map.has(ok) && !folderPages.has(ok) && n.length > 0)
        folderPages.set(ok, n.join("/") + "/index")
      o.pop()
      if (n.length > 0) n.pop()
    }
  }
  for (const [k, v] of folderPages) map.set(k, v)
  return map
}

function visit(node, fn) {
  fn(node)
  if (node.children) for (const c of node.children) visit(c, fn)
}

// 把「從原本位置寫的相對連結」換成「從新位置寫的相對連結」
function remapHref(href, fromOriginal, fromNew, map) {
  if (!href || /^(?:[a-z]+:|#|\/\/)/i.test(href)) return href
  const [, pathPart, rest = ""] = /^([^?#]*)(.*)$/.exec(href)
  if (pathPart === "") return href
  // 以原本頁面的位置把相對路徑解析成站內絕對路徑
  const base = new URL("https://x/" + fromOriginal)
  const abs = new URL(pathPart, base)
  let target = decodeURIComponent(abs.pathname).replace(/^\//, "")
  const isFolder = target.endsWith("/") || target === ""
  let lookup = isFolder ? target + "index" : target
  const mapped = map.get(lookup) ?? map.get(lookup.replace(/\.html$/, ""))
  let finalTarget
  if (mapped) finalTarget = mapped.endsWith("/index") ? mapped.slice(0, -5) : mapped
  else finalTarget = target
  if (pathPart.startsWith("/")) return "/" + finalTarget + rest
  const rel = resolveRelative(fromNew, finalTarget === "" ? "index" : finalTarget)
  return rel + rest
}

export default function CustomSlugs(opts = {}) {
  let map = null
  return {
    name: "CustomSlugs",
    htmlPlugins(ctx) {
      const root = ctx?.argv?.directory ?? "content"
      map ??= buildMap(root, opts.folders)
      return [
        () => (tree, file) => {
          const original = file.data.slug
          if (!original) return
          const next = map.get(original) ?? original
          if (next !== original) {
            visit(tree, (node) => {
              if (node.type !== "element") return
              const props = node.properties ?? {}
              for (const attr of ["href", "src"]) {
                if (typeof props[attr] === "string")
                  props[attr] = remapHref(props[attr], original, next, map)
              }
            })
          } else {
            // 這一頁網址沒變，但它連到的頁面可能變了
            visit(tree, (node) => {
              if (node.type !== "element") return
              const props = node.properties ?? {}
              if (typeof props.href === "string")
                props.href = remapHref(props.href, original, original, map)
            })
          }
          // 反向連結、關係圖譜用的連結清單
          if (Array.isArray(file.data.links)) {
            file.data.links = file.data.links.map((l) => {
              const full = l.endsWith("/") ? l + "index" : l
              const m = map.get(full) ?? map.get(l)
              return m ? simplifySlug(m) : l
            })
          }
          if (next !== original) {
            file.data.aliases = [...(file.data.aliases ?? []), original]
            file.data.slug = next
          }
        },
      ]
    },
  }
}
