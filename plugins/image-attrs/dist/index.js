// 幫網站上的 <img> 加上：
// - width / height：從 content/ 裡的圖片檔讀出實際尺寸，避免圖片載入時版面跳動（CLS）
// - loading="lazy"、decoding="async"：捲到附近才載入；每頁第一張圖維持立即載入，不拖慢首屏
import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

const IMAGE_EXT = /\.(webp|png|jpe?g|gif|avif)$/i

// 依檔名建立「檔名 → 尺寸」對照表（content/ 底下的圖片檔名不重複）
async function buildSizeIndex(root) {
  const sizes = new Map()
  async function walk(dir) {
    let entries = []
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) await walk(p)
      else if (IMAGE_EXT.test(e.name)) {
        try {
          const { width, height } = await sharp(p).metadata()
          if (width && height) sizes.set(e.name.toLowerCase(), { width, height })
        } catch {}
      }
    }
  }
  await walk(root)
  return sizes
}

function visit(node, fn) {
  fn(node)
  if (node.children) for (const c of node.children) visit(c, fn)
}

export default function ImageAttrs() {
  let sizesPromise = null
  return {
    name: "ImageAttrs",
    htmlPlugins(ctx) {
      const root = ctx?.argv?.directory ?? "content"
      return [
        () => async (tree) => {
          sizesPromise ??= buildSizeIndex(root)
          const sizes = await sizesPromise
          let first = true
          visit(tree, (node) => {
            if (node.type !== "element" || node.tagName !== "img") return
            const props = (node.properties ??= {})
            const src = String(props.src ?? "")
            const file = decodeURIComponent(
              src.split(/[?#]/)[0].split("/").pop() ?? "",
            ).toLowerCase()
            const size = sizes.get(file)
            if (size && (props.width == null || props.width === "auto")) {
              props.width = size.width
              props.height = size.height
            }
            props.decoding ??= "async"
            if (first) {
              first = false
            } else {
              props.loading ??= "lazy"
            }
          })
        },
      ]
    },
  }
}
