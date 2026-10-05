import { esc } from './util.mjs'
import { renderHead } from './partials/head.mjs'

// Sprachumschalter: merkt sich die Wahl für den Root-Redirect (Cookie) und die App (localStorage).
// Schließt außerdem das Sprach-Menü bei Klick daneben oder Escape.
// Wird als eigene Datei ausgeliefert (CSP erlaubt keine Inline-Skripte).
export const LANG_SCRIPT = `document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-lang]');if(a){var l=a.getAttribute('data-lang');document.cookie='lang='+l+';path=/;max-age=31536000;SameSite=Lax;Secure';try{localStorage.setItem('cr-lang',a.getAttribute('hreflang'))}catch(_){}}var m=document.querySelector('.lang-menu[open]');if(m&&!m.contains(e.target))m.removeAttribute('open')});document.addEventListener('keydown',function(e){var m=document.querySelector('.lang-menu[open]');if(e.key==='Escape'&&m){m.removeAttribute('open');m.querySelector('summary').focus()}});`

// Weltkugel fürs Sprach-Menü (Strichstärke passend zu den Comic-Linien)
const GLOBE_ICON = '<svg class="lang-menu__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'

/** Grundgerüst jeder Seite: Head, Header, Inhalt, Footer mit Sprachumschalter. */
export function renderLayout(page, content, ctx) {
  const { ui, locale } = page
  const home = locale.path
  const guidesLink = ctx.hasGuides(locale)
    ? `<a href="${esc(home + locale.guidesPath + '/')}">${esc(ui.guides)}</a>`
    : ''
  const languages = ctx.switcherLinks(page)
  const current = languages.find((l) => l.current)
  const others = languages.filter((l) => !l.current)
    .map((l) => `<li><a href="${esc(l.href)}" hreflang="${esc(l.hreflang)}" lang="${esc(l.hreflang)}" data-lang="${esc(l.segment)}"><span class="lang-menu__code">${esc(l.short)}</span> ${esc(l.name)}</a></li>`)
    .join('')
  const footerNav = ctx.footerLinks(locale)
    .map((p) => `<li><a href="${esc(p.path)}"${p.path === page.path ? ' aria-current="page"' : ''}>${esc(p.navTitle)}</a></li>`)
    .join('')
  // Sprach-Menü oben rechts: <details> öffnet/schließt ohne JavaScript
  const langMenu = others ? `<details class="lang-menu">
            <summary class="lang-menu__btn" aria-label="${esc(ui.languageNav)}: ${esc(current.name)}">
              ${GLOBE_ICON}<span class="lang-menu__code">${esc(current.short)}</span>
            </summary>
            <ul class="lang-menu__list">${others}</ul>
          </details>` : ''

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
          ${langMenu}
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
        ${footerNav ? `<nav class="footer-nav" aria-label="${esc(ui.footerNav)}"><ul>${footerNav}</ul></nav>` : ''}
      </div>
    </footer>
    <script src="${esc(ctx.langScriptSrc)}"></script>
  </body>
</html>
`
}
