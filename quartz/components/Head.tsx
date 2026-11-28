import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot, simplifySlug } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { GTM_ID, gtmHeadScript, gtmNavScript } from "../util/gtm"

export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const isHome = fileData.slug === "index"
    const baseTitle = fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title
    // seoTitle（frontmatter）優先；首頁本身就是站名，不再重複加後綴
    const title =
      (fileData.frontmatter?.seoTitle as string | undefined) ??
      (isHome || baseTitle === cfg.pageTitle ? baseTitle : baseTitle + titleSuffix)
    // 標籤頁、資料夾頁沒有內文可抓，自動產生一句說明，不要顯示「無描述」
    const isTagPage = fileData.slug === "tags/index" || fileData.slug!.startsWith("tags/")
    const isFolderPage = !isHome && fileData.slug!.endsWith("/index")
    const autoDescription = fileData.description?.trim()
      ? unescapeHTML(fileData.description.trim())
      : isTagPage
        ? `${cfg.pageTitle}中「${baseTitle}」相關的所有筆記。`
        : isFolderPage
          ? `${cfg.pageTitle}「${baseTitle}」分類的所有筆記，每篇都從一段故事開始。`
          : i18n(cfg.locale).propertyDefaults.description
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      autoDescription

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // Url of current page
    const usesCustomOgImage = ctx.cfg.plugins.emitters.some((e) => e.name === "CustomOgImages")
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    // index 頁一律用資料夾網址（/、/xxx/），避免 /index 和 / 被當成兩個網址
    const socialUrl =
      fileData.slug === "404"
        ? url.toString()
        : joinSegments(url.toString(), simplifySlug(fileData.slug!))

    // 只有一般筆記頁才算文章；首頁、資料夾頁、標籤頁不算
    const isArticle = !isHome && fileData.slug !== "404" && !isFolderPage && !isTagPage
    const dates = fileData.dates
    const jsonLd = isHome
      ? {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: cfg.pageTitle,
          url: socialUrl,
          inLanguage: cfg.locale,
          description,
        }
      : isArticle
        ? {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: baseTitle,
            description,
            inLanguage: cfg.locale,
            url: socialUrl,
            mainEntityOfPage: socialUrl,
            image: usesCustomOgImage
              ? joinSegments(url.toString(), `${fileData.slug}-og-image.webp`)
              : ogImageDefaultPath,
            ...(dates?.modified && { dateModified: new Date(dates.modified).toISOString() }),
            author: { "@type": "Organization", name: cfg.pageTitle, url: url.toString() },
            publisher: { "@type": "Organization", name: cfg.pageTitle, url: url.toString() },
          }
        : null

    const coreStylesheet = css[0]?.content
    const coreScript = js.find(
      (r) => r.loadTime === "beforeDOMReady" && r.contentType === "external",
    )

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {GTM_ID && (
          <>
            {/* data-persist: keep these scripts alive across SPA navigations instead of re-running them */}
            <script
              data-persist="true"
              dangerouslySetInnerHTML={{ __html: gtmHeadScript(GTM_ID) }}
            />
            <script data-persist="true" dangerouslySetInnerHTML={{ __html: gtmNavScript }} />
          </>
        )}
        {coreStylesheet && <link rel="preload" href={coreStylesheet} as="style" />}
        {coreScript && coreScript.contentType === "external" && (
          <link rel="preload" href={coreScript.src} as="script" />
        )}
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content={isArticle ? "article" : "website"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        {cfg.baseUrl && fileData.slug !== "404" && <link rel="canonical" href={socialUrl} />}
        {/* 標籤頁內容只是連結清單，不讓 Google 收錄，但照樣跟著連結爬 */}
        {isTagPage && <meta name="robots" content="noindex, follow" />}
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
          />
        )}
        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
