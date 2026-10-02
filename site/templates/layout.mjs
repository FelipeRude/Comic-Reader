import { esc } from './util.mjs'
import { renderHead } from './partials/head.mjs'

// Sprachumschalter: merkt sich die Wahl für den Root-Redirect (Cookie) und die App (localStorage).
const LANG_SCRIPT = `document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-lang]');if(!a)return;var l=a.getAttribute('data-lang');document.cookie='lang='+l+';path=/;max-age=31536000;SameSite=Lax;Secure';try{localStorage.setItem('cr-lang',a.getAttribute('hreflang'))}catch(_){}});`

/** Grundgerüst jeder Seite: Head, Header, Inhalt, Footer mit Sprachumschalter. */
export function renderLayout(page, content, ctx) {
  const { ui, locale } = page
  const home = locale.path
  const guidesLink = ctx.hasGuides(locale)
    ? `<a href="${esc(home + locale.guidesPath + '/')}">${esc(ui.guides)}</a>`
    : ''
  const switcher = ctx.switcherLinks(page)
    .map((l) => l.current
      ? `<li><span aria-current="true" lang="${esc(l.hreflang)}">${esc(l.name)}</span></li>`
      : `<li><a href="${esc(l.href)}" hreflang="${esc(l.hreflang)}" lang="${esc(l.hreflang)}" data-lang="${esc(l.segment)}">${esc(l.name)}</a></li>`)
    .join('')

  return `<!doctype html>
<html lang="${esc(locale.hreflang)}">
  <head>
    ${renderHead(page, ctx)}
  </head>
  <body>
    <a class="skip-link" href="#main">${esc(ui.skipToContent)}</a>
    <header class="site-header">
      <div class="wrap site-header__inner">
        <a class="brand" href="${esc(home)}">${esc(ctx.site.name)}</a>
        <nav class="site-nav">
          ${guidesLink}
          <a class="btn btn--small" href="${esc(ctx.appHref(locale))}">${esc(ui.openApp)}</a>
        </nav>
      </div>
    </header>
    <main id="main">
${content}
    </main>
    <footer class="site-footer">
      <div class="wrap">
        <p class="site-footer__brand">${esc(ctx.site.name)}</p>
        <p>${esc(ui.footerTagline)}</p>
        <nav aria-label="${esc(ui.languageNav)}">
          <ul class="lang-switch">${switcher}</ul>
        </nav>
      </div>
    </footer>
    <script>${LANG_SCRIPT}</script>
  </body>
</html>
`
}
