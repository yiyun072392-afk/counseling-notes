import { h } from "preact"

// 只抽「知識庫」裡的筆記，跳過資料夾頁（.../index）
const script = `
const pickRandom = async () => {
  const res = await fetch(new URL("/static/contentIndex.json", location.origin))
  const index = await res.json()
  const here = decodeURIComponent(location.pathname).replace(/^\\//, "").replace(/\\.html$/, "")
  let slugs = Object.keys(index).filter((s) => s.startsWith("知識庫/") && !s.endsWith("/index"))
  if (slugs.length > 1) slugs = slugs.filter((s) => s !== here)
  if (slugs.length === 0) return
  const slug = slugs[Math.floor(Math.random() * slugs.length)]
  const url = new URL("/" + encodeURI(slug), location.origin)
  window.spaNavigate ? window.spaNavigate(url) : location.assign(url)
}
document.addEventListener("nav", () => {
  for (const btn of document.getElementsByClassName("random-note")) {
    btn.addEventListener("click", pickRandom)
    window.addCleanup(() => btn.removeEventListener("click", pickRandom))
  }
})
`

const css = `
.random-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  margin: 0.5rem 0;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--lightgray);
  border-radius: 6px;
  background: var(--light);
  color: var(--secondary);
  font-family: var(--bodyFont);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.random-note:hover {
  background: var(--highlight);
  border-color: var(--secondary);
}
`

const RandomNote = ({ displayClass }) =>
  h(
    "button",
    { class: ["random-note", displayClass].filter(Boolean).join(" "), "aria-label": "隨機複習一篇筆記" },
    "🎲 隨機複習",
  )

RandomNote.afterDOMLoaded = script
RandomNote.css = css

const RandomNote_default = () => RandomNote

export { RandomNote_default as RandomNote }
