/**
 * Google Tag Manager container ID, e.g. "GTM-ABC1234".
 * Leave empty to disable GTM entirely (nothing is rendered).
 * Can also be supplied at build time via the GTM_ID environment variable.
 */
const RAW_GTM_ID = process.env.GTM_ID || "GTM-T6LW7MKH"

// Only accept well-formed container IDs so nothing odd is ever injected into the HTML.
export const GTM_ID: string = /^GTM-[A-Z0-9]+$/.test(RAW_GTM_ID) ? RAW_GTM_ID : ""

export function gtmHeadScript(id: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`
}

export function gtmNoscript(id: string): string {
  return `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
}

/**
 * Quartz uses SPA navigation, so the browser never does a full page load after the first one.
 * Quartz fires a "nav" event on the first load and on every SPA navigation; forward it to the
 * dataLayer so a GTM Custom Event trigger named "quartz_nav" can send page views.
 */
export const gtmNavScript = `window.dataLayer=window.dataLayer||[];document.addEventListener('nav',function(){window.dataLayer.push({event:'quartz_nav',page_path:location.pathname,page_title:document.title});});`
