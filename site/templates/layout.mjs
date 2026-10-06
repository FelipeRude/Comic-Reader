import { esc } from './util.mjs'
import { renderHead } from './partials/head.mjs'

// Sprachumschalter: merkt sich die Wahl für den Root-Redirect (Cookie) und die App (localStorage).
// Schließt außerdem das Sprach-Menü bei Klick daneben oder Escape.
// Videos (themed-video.mjs): <source media> werten Browser nur beim Laden aus (ältere gar nicht). Das Skript
// wählt hell/dunkel passend zum Farbschema und wechselt mit, wenn es sich später ändert.
// Wird als eigene Datei ausgeliefert (CSP erlaubt keine Inline-Skripte).
const VIDEO_SCRIPT = `(function(){if(!window.matchMedia)return;var mq=matchMedia('(prefers-color-scheme: dark)');function set(){var t=mq.matches?'dark':'light';[].forEach.call(document.querySelectorAll('.themed-video video'),function(v){if(v.currentSrc&&v.currentSrc.indexOf('-'+t+'.')>-1)return;[].forEach.call(v.querySelectorAll('source'),function(s){s.removeAttribute('media');s.src=s.src.replace(/-(light|dark)\\./,'-'+t+'.')});v.load();var p=v.play();if(p&&p.catch)p.catch(function(){})})}set();if(mq.addEventListener)mq.addEventListener('change',set);else if(mq.addListener)mq.addListener(set)})();`

// FAQ: <details> klappt sonst schlagartig auf. Das Skript animiert die Höhe der Antwort
// (auch bei erneutem Tippen mitten in der Bewegung). Ohne Skript oder bei reduzierter Bewegung
// bleibt das normale Verhalten.
const FAQ_SCRIPT = `document.addEventListener('click',function(e){var s=e.target.closest&&e.target.closest('.faq summary');if(!s)return;var d=s.parentNode,a=d.querySelector('.faq__answer');if(!a||!a.animate||matchMedia('(prefers-reduced-motion: reduce)').matches)return;e.preventDefault();var closing=d.open&&!d.classList.contains('is-closing');var from=d.open?a.getBoundingClientRect().height:0;if(d._a)d._a.cancel();if(closing){d.classList.add('is-closing');d._a=a.animate([{height:from+'px',opacity:1},{height:'0px',opacity:0}],{duration:300,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});d._a.onfinish=function(){d.open=false;d.classList.remove('is-closing');d._a.cancel();d._a=null}}else{d.classList.remove('is-closing');d.open=true;var to=a.getBoundingClientRect().height;d._a=a.animate([{height:from+'px',opacity:from?1:0},{height:to+'px',opacity:1}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});d._a.onfinish=function(){d._a=null}}});`

// Installieren: Umschalter iOS/Android (Tabs mit Pfeiltasten). Erkennt das System, Standard iOS.
// iPadOS meldet sich als Mac, erkennbar an Touch. Beim Wechsel startet das Video von vorn.
const INSTALL_SCRIPT = `(function(){var w=document.querySelector('[data-install]');if(!w)return;var tabs=[].slice.call(w.querySelectorAll('[role=tab]')),panels=[].slice.call(w.querySelectorAll('.install__platform'));if(!tabs.length)return;var ua=navigator.userAgent;var cur=/Android/i.test(ua)?'android':'ios';function show(k,focus){tabs.forEach(function(t){var on=t.getAttribute('data-platform')===k;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;if(on&&focus)t.focus()});panels.forEach(function(p){var on=p.getAttribute('data-platform')===k;p.hidden=!on;var v=p.querySelector('video');if(v){if(on){try{v.currentTime=0}catch(_){}var r=v.play();if(r&&r.catch)r.catch(function(){})}else v.pause()}})}w.classList.add('is-tabs');w.querySelector('.install__switch').hidden=false;panels.forEach(function(p){p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby','install-tab-'+p.getAttribute('data-platform'))});show(cur);tabs.forEach(function(t,i){t.addEventListener('click',function(){show(t.getAttribute('data-platform'))});t.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;e.preventDefault();show(tabs[(i+d+tabs.length)%tabs.length].getAttribute('data-platform'),true)})})})();`

export const LANG_SCRIPT = VIDEO_SCRIPT + FAQ_SCRIPT + INSTALL_SCRIPT + `document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-lang]');if(a){var l=a.getAttribute('data-lang');document.cookie='lang='+l+';path=/;max-age=31536000;SameSite=Lax;Secure';try{localStorage.setItem('cr-lang',a.getAttribute('hreflang'))}catch(_){}}var m=document.querySelector('.lang-menu[open]');if(m&&!m.contains(e.target))m.removeAttribute('open')});document.addEventListener('keydown',function(e){var m=document.querySelector('.lang-menu[open]');if(e.key==='Escape'&&m){m.removeAttribute('open');m.querySelector('summary').focus()}});`

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
        <a class="brand" href="${esc(home)}"><img class="brand__logo" src="/logo.svg" width="44" height="44" alt=""><span class="brand__text">${esc(ctx.site.name)}<span class="brand__tag">Comic-Reader</span></span></a>
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
