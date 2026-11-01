import { h } from "preact"

// 首頁「依分類瀏覽」：由基礎到應用分三層
// 資料夾名稱要和 content/知識庫/ 底下的一致；順序改了，記得也改 quartz.config.yaml 裡 explorer 的 sortFn
const groups = [
  {
    title: "心理學的基礎學科",
    desc: "先認識人怎麼感受、思考和行動：從身體與大腦，到個人，再到身邊的人。",
    items: [
      { folder: "諮商的心理學基礎/普通心理學", name: "普通心理學", desc: "心理學的入門地圖：歷史、學派、學習、記憶、動機與情緒。" },
      { folder: "諮商的心理學基礎/生物心理學", name: "生物心理學", desc: "大腦、神經和荷爾蒙怎麼影響想法、情緒和行為。" },
      { folder: "諮商的心理學基礎/神經心理學", name: "神經心理學", desc: "大腦受傷或生病時，認知和行為會出現哪些改變。" },
      { folder: "諮商的心理學基礎/認知心理學", name: "認知心理學", desc: "人怎麼注意、記憶、思考和解決問題。" },
      { folder: "諮商的心理學基礎/發展心理學", name: "發展心理學", desc: "人從出生到老，身心怎麼一路改變。" },
      { folder: "諮商的心理學基礎/性格心理學", name: "性格心理學", desc: "為什麼每個人的個性不一樣，又要怎麼描述它。" },
      { folder: "諮商的心理學基礎/社會心理學", name: "社會心理學", desc: "身邊的人和所在的情境，怎麼影響我們。" },
    ],
  },
  {
    title: "心理學方法",
    desc: "心理學怎麼「知道」上面這些事：做研究、算數字、編測驗。",
    items: [
      { folder: "心理學方法/心理統計", name: "心理統計", desc: "用數字整理資料，判斷差異是不是巧合。" },
      { folder: "心理學方法/心理實驗", name: "心理實驗", desc: "研究怎麼設計、怎麼進行、報告怎麼寫。" },
      { folder: "心理學方法/心理測驗", name: "心理測驗", desc: "好的測驗要準又穩：信度、效度與題目分析。" },
    ],
  },
  {
    title: "臨床與諮商的應用",
    desc: "把前面學到的心理學，用來理解心理困擾、幫助個案。",
    items: [
      { folder: "心理健康與變態心理學", name: "心理健康與變態心理學", desc: "心理困擾怎麼形成、怎麼分類（DSM-5）。" },
      { folder: "諮商與心理治療理論", name: "諮商與心理治療理論", desc: "精神分析、阿德勒、個人中心、存在主義、完形等學派。" },
      { folder: "個案評估與心理衡鑑", name: "個案評估與心理衡鑑", desc: "怎麼理解一位個案：個案概念化、衡鑑工具與量表。" },
      { folder: "團體諮商與心理治療", name: "團體諮商與心理治療", desc: "團體的理論、階段與療效因子。" },
      { folder: "諮商與心理治療實務與專業倫理", name: "實務與專業倫理", desc: "助人歷程、倫理守則與倫理決策。" },
    ],
  },
]

// 把分類區塊移到首頁介紹文字之後、筆記列表之前；沒有 JavaScript 時就留在頁面最下面
const script = `
document.addEventListener("nav", () => {
  const section = document.querySelector(".home-cards")
  const article = document.querySelector(".markdown-rendered")
  if (!section || !article) return
  const firstHeading = article.querySelector(":scope > h2")
  firstHeading ? article.insertBefore(section, firstHeading) : article.appendChild(section)
})
`

const HomeCards = ({ fileData, allFiles }) => {
  if (fileData.slug !== "index") return null

  const countIn = (folder) =>
    allFiles.filter((f) => {
      const slug = f.slug ?? ""
      return slug.startsWith(`知識庫/${folder}/`) && !slug.endsWith("/index")
    }).length

  const card = ({ folder, name, desc }) => {
    const count = countIn(folder)
    const body = [
      h("span", { class: "home-card-title" }, name),
      h("span", { class: "home-card-desc" }, desc),
      h("span", { class: "home-card-count" }, count > 0 ? `${count} 篇筆記` : "還沒有筆記"),
    ]
    return count > 0
      ? h("a", { class: "home-card internal", href: `/知識庫/${folder}` }, body)
      : h("div", { class: "home-card is-empty" }, body)
  }

  const group = ({ title, desc, items }, i) => {
    const total = items.reduce((sum, item) => sum + countIn(item.folder), 0)
    return h("div", { class: "home-group" }, [
      h("div", { class: "home-group-head" }, [
        h("span", { class: "home-group-step" }, String(i + 1)),
        h("div", {}, [
          h("h3", { class: "home-group-title" }, [
            title,
            h("span", { class: "home-group-total" }, `${total} 篇`),
          ]),
          h("p", { class: "home-group-desc" }, desc),
        ]),
      ]),
      h("div", { class: "home-cards-grid" }, items.map(card)),
    ])
  }

  return h("section", { class: "home-cards" }, [
    h("h2", { class: "home-cards-heading" }, "依分類瀏覽"),
    ...groups.map(group),
  ])
}

HomeCards.afterDOMLoaded = script

const HomeCards_default = () => HomeCards

export { HomeCards_default as HomeCards }
