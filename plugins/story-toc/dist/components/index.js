// 在文章開頭的故事區塊（> [!quote]）後面，自動插入可以點擊跳轉的目錄。
// 目錄列出內文的 ## 和 ### 小標題；沒有故事區塊的頁面，放在第一個 ## 小標題前面。
// 小標題少於三個的頁面不插入。

const script = `
document.addEventListener("nav", () => {
  const article = document.querySelector("article.popover-hint") || document.querySelector("article")
  if (!article || article.querySelector(".story-toc")) return
  const heads = [...article.querySelectorAll("h2[id], h3[id]")].filter((h) => !h.closest(".callout"))
  if (heads.length < 3) return
  const nav = document.createElement("details")
  nav.className = "story-toc"
  const sum = document.createElement("summary")
  sum.textContent = "本文目錄"
  nav.appendChild(sum)
  const top = document.createElement("ol")
  let cur = null
  heads.forEach((h) => {
    const li = document.createElement("li")
    const a = document.createElement("a")
    a.href = "#" + h.id
    a.className = "internal"
    a.textContent = h.textContent.replace(/#\\s*$/, "").trim()
    li.appendChild(a)
    if (h.tagName === "H2" || !cur) {
      top.appendChild(li)
      cur = li
    } else {
      let sub = cur.querySelector("ol")
      if (!sub) { sub = document.createElement("ol"); cur.appendChild(sub) }
      sub.appendChild(li)
    }
  })
  nav.appendChild(top)
  const story = [...article.querySelectorAll('.callout[data-callout="quote"]')].find((c) => !c.parentElement.closest(".callout"))
  if (story) {
    let anchor = story
    // 故事後面緊接的說明段落與影片，一起放在目錄前面
    while (anchor.nextElementSibling && !/^H[1-6]$/.test(anchor.nextElementSibling.tagName)) anchor = anchor.nextElementSibling
    anchor.after(nav)
  } else {
    const firstH2 = article.querySelector("h2[id]")
    if (firstH2) firstH2.before(nav)
  }
})
`

const StoryToc = () => null
StoryToc.afterDOMLoaded = script

const StoryToc_default = () => StoryToc

export { StoryToc_default as StoryToc }
