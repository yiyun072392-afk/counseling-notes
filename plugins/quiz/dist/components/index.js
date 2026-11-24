// 把筆記裡的 > [!quiz] 區塊變成可以點的選擇題
//
// 寫法：
// > [!quiz] 小測驗
// > 1. 題目
// >     - [ ] 錯誤選項｜為什麼錯
// >     - [x] 正確選項｜為什麼對
//
// 選項和解析用全形直線「｜」隔開；[x] 是正確答案。
// 點選後立刻顯示對錯；答錯時，同時標出正確答案和它的解析。

const script = `
document.addEventListener("nav", () => {
  const SEP = "｜"
  const blocks = document.querySelectorAll('.callout[data-callout="quiz"]')
  blocks.forEach((block) => {
    if (block.dataset.quizReady) return
    block.dataset.quizReady = "1"
    const content = block.querySelector(".callout-content") || block
    const list = content.querySelector("ol")
    if (!list) return

    const questions = []
    Array.from(list.children).forEach((li) => {
      const optionList = li.querySelector("ul")
      if (!optionList) return
      const stemNode = li.cloneNode(true)
      stemNode.querySelectorAll("ul").forEach((n) => n.remove())
      const stem = stemNode.textContent.trim()
      const options = Array.from(optionList.children).map((opt) => {
        const box = opt.querySelector('input[type="checkbox"]')
        const correct = !!(box && box.checked)
        const node = opt.cloneNode(true)
        node.querySelectorAll("input").forEach((n) => n.remove())
        const raw = node.textContent.trim()
        const i = raw.indexOf(SEP)
        return {
          label: (i < 0 ? raw : raw.slice(0, i)).trim(),
          why: i < 0 ? "" : raw.slice(i + 1).trim(),
          correct,
        }
      })
      questions.push({ stem, options })
    })
    if (!questions.length) return

    const shuffle = (arr) => {
      const a = arr.slice()
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    }

    const wrap = document.createElement("div")
    wrap.className = "quiz"
    const score = document.createElement("p")
    score.className = "quiz-score"
    let answered = 0
    let right = 0
    const updateScore = () => {
      score.textContent = answered === questions.length
        ? "答對 " + right + " / " + questions.length + " 題"
        : "已作答 " + answered + " / " + questions.length + " 題"
    }

    const render = () => {
      wrap.innerHTML = ""
      answered = 0
      right = 0
      questions.forEach((q, qi) => {
        const card = document.createElement("div")
        card.className = "quiz-q"
        const stem = document.createElement("p")
        stem.className = "quiz-stem"
        stem.textContent = (qi + 1) + ". " + q.stem
        card.appendChild(stem)
        const opts = document.createElement("div")
        opts.className = "quiz-options"
        const feedback = document.createElement("div")
        feedback.className = "quiz-feedback"
        const buttons = []
        shuffle(q.options).forEach((o) => {
          const b = document.createElement("button")
          b.type = "button"
          b.className = "quiz-option"
          b.textContent = o.label
          b.addEventListener("click", () => {
            if (card.dataset.done) return
            card.dataset.done = "1"
            answered++
            if (o.correct) right++
            buttons.forEach(({ btn, opt }) => {
              btn.disabled = true
              if (opt.correct) btn.classList.add("is-correct")
            })
            if (!o.correct) b.classList.add("is-wrong")
            const verdict = document.createElement("p")
            verdict.className = "quiz-verdict " + (o.correct ? "ok" : "ng")
            verdict.textContent = o.correct ? "答對了！" : "答錯了。"
            feedback.appendChild(verdict)
            if (o.why) {
              const p = document.createElement("p")
              p.textContent = (o.correct ? "" : "「" + o.label + "」：") + o.why
              feedback.appendChild(p)
            }
            if (!o.correct) {
              const ans = q.options.find((x) => x.correct)
              if (ans) {
                const p = document.createElement("p")
                p.textContent = "正確答案是「" + ans.label + "」" + (ans.why ? "：" + ans.why : "。")
                feedback.appendChild(p)
              }
            }
            updateScore()
          })
          buttons.push({ btn: b, opt: o })
          opts.appendChild(b)
        })
        card.appendChild(opts)
        card.appendChild(feedback)
        wrap.appendChild(card)
      })
      const footer = document.createElement("div")
      footer.className = "quiz-footer"
      footer.appendChild(score)
      const reset = document.createElement("button")
      reset.type = "button"
      reset.className = "quiz-reset"
      reset.textContent = "重新作答"
      reset.addEventListener("click", render)
      footer.appendChild(reset)
      wrap.appendChild(footer)
      updateScore()
    }

    list.replaceWith(wrap)
    render()
  })
})
`

const Quiz = () => null
Quiz.afterDOMLoaded = script

const Quiz_default = () => Quiz

export { Quiz_default as Quiz }
