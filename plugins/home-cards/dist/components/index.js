import { h } from "preact"

// 分類的順序與說明；資料夾名稱要和 content/知識庫/ 底下的一致
const categories = [
  { folder: "諮商與心理治療理論", desc: "精神分析、阿德勒、個人中心、存在主義、完形等主要學派。" },
  { folder: "諮商的心理學基礎", desc: "發展、性格、社會、認知與神經心理學。" },
  { folder: "心理健康與變態心理學", desc: "變態心理學、DSM-5 診斷標準與心理衛生。" },
  { folder: "團體諮商與心理治療", desc: "團體的理論、階段與療效因子。" },
  { folder: "個案評估與心理衡鑑", desc: "個案概念化、衡鑑工具與量表。" },
  { folder: "諮商與心理治療實務與專業倫理", desc: "助人歷程、倫理守則與倫理決策。" },
  { folder: "心理學方法", desc: "心理統計、心理實驗與心理測驗。" },
]

const HomeCards = ({ fileData, allFiles }) => {
  if (fileData.slug !== "index") return null

  const countIn = (folder) =>
    allFiles.filter((f) => {
      const slug = f.slug ?? ""
      return slug.startsWith(`知識庫/${folder}/`) && !slug.endsWith("/index")
    }).length

  const cards = categories.map(({ folder, desc }) => {
    const count = countIn(folder)
    const body = [
      h("h3", { class: "home-card-title" }, folder),
      h("p", { class: "home-card-desc" }, desc),
      h(
        "span",
        { class: "home-card-count" },
        count > 0 ? `${count} 篇筆記` : "還沒有筆記",
      ),
    ]
    return count > 0
      ? h("a", { class: "home-card internal", href: `/知識庫/${folder}` }, body)
      : h("div", { class: "home-card is-empty" }, body)
  })

  return h("section", { class: "home-cards" }, [
    h("h2", { class: "home-cards-heading" }, "依分類瀏覽"),
    h("div", { class: "home-cards-grid" }, cards),
  ])
}

const HomeCards_default = () => HomeCards

export { HomeCards_default as HomeCards }
