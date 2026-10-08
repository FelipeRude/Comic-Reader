import { esc } from './util.mjs'
import { renderHead } from './partials/head.mjs'

// Sprachumschalter: merkt sich die Wahl für den Root-Redirect (Cookie) und die App (localStorage).
// Schließt außerdem das Sprach-Menü bei Klick daneben oder Escape.
// Wird als eigene Datei ausgeliefert (CSP erlaubt keine Inline-Skripte).
// FAQ: <details> klappt sonst schlagartig auf. Das Skript animiert die Höhe der Antwort
// (auch bei erneutem Tippen mitten in der Bewegung). Ohne Skript oder bei reduzierter Bewegung
// bleibt das normale Verhalten.
const FAQ_SCRIPT = `document.addEventListener('click',function(e){var s=e.target.closest&&e.target.closest('.faq summary');if(!s)return;var d=s.parentNode,a=d.querySelector('.faq__answer');if(!a||!a.animate||matchMedia('(prefers-reduced-motion: reduce)').matches)return;e.preventDefault();var closing=d.open&&!d.classList.contains('is-closing');var from=d.open?a.getBoundingClientRect().height:0;if(d._a)d._a.cancel();if(closing){d.classList.add('is-closing');d._a=a.animate([{height:from+'px',opacity:1},{height:'0px',opacity:0}],{duration:300,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});d._a.onfinish=function(){d.open=false;d.classList.remove('is-closing');d._a.cancel();d._a=null}}else{d.classList.remove('is-closing');d.open=true;var to=a.getBoundingClientRect().height;d._a=a.animate([{height:from+'px',opacity:from?1:0},{height:to+'px',opacity:1}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});d._a.onfinish=function(){d._a=null}}});`

// Installieren: Umschalter iOS/Android (Tabs mit Pfeiltasten). Erkennt das System, Standard iOS.
// iPadOS meldet sich als Mac, erkennbar an Touch. Beim Wechsel startet das Video von vorn.
const INSTALL_SCRIPT = `(function(){var w=document.querySelector('[data-install]');if(!w)return;var tabs=[].slice.call(w.querySelectorAll('[role=tab]')),panels=[].slice.call(w.querySelectorAll('.install__platform'));if(!tabs.length)return;var ua=navigator.userAgent;var cur=/Android/i.test(ua)?'android':'ios';function show(k,focus){tabs.forEach(function(t){var on=t.getAttribute('data-platform')===k;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;if(on&&focus)t.focus()});panels.forEach(function(p){var on=p.getAttribute('data-platform')===k;p.hidden=!on;var v=p.querySelector('video');if(v){if(on){try{v.currentTime=0}catch(_){}var r=v.play();if(r&&r.catch)r.catch(function(){})}else v.pause()}})}w.classList.add('is-tabs');w.querySelector('.install__switch').hidden=false;panels.forEach(function(p){p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby','install-tab-'+p.getAttribute('data-platform'))});show(cur);tabs.forEach(function(t,i){t.addEventListener('click',function(){show(t.getAttribute('data-platform'))});t.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;e.preventDefault();show(tabs[(i+d+tabs.length)%tabs.length].getAttribute('data-platform'),true)})})})();`

// Drop-Feld (landing.mjs): PDF per Auswahl oder Drag & Drop. Die Datei wird in der IndexedDB
// „panelzoom-handoff“ abgelegt (gleiche Origin wie die App), dann öffnet die App mit ?import=1 und
// importiert sie (src/storage/handoff.js). Klappt das Ablegen nicht, öffnet sich einfach die App.
const DROP_SCRIPT = `(function(){var z=document.querySelector('[data-dropzone]');if(!z)return;var input=z.querySelector('input[type=file]'),status=z.querySelector('[data-dropzone-status]'),app=z.getAttribute('data-app');function open(ok){location.href=ok?app+(app.indexOf('?')>-1?'&':'?')+'import=1':app}function go(f){if(!f||z.classList.contains('is-busy'))return;if(!/\\.pdf$/i.test(f.name)&&f.type!=='application/pdf'){status.textContent=z.getAttribute('data-msg-type');return}z.classList.add('is-busy');status.textContent=z.getAttribute('data-msg-busy');if(!window.indexedDB)return open(false);var r;try{r=indexedDB.open('panelzoom-handoff',1)}catch(_){return open(false)}r.onupgradeneeded=function(){r.result.createObjectStore('files')};r.onerror=function(){open(false)};r.onsuccess=function(){var db=r.result,tx;try{tx=db.transaction('files','readwrite');tx.objectStore('files').put({blob:f,name:f.name},'pending')}catch(_){db.close();return open(false)}tx.oncomplete=function(){db.close();open(true)};tx.onerror=tx.onabort=function(){db.close();open(false)}}}input.addEventListener('change',function(){go(input.files&&input.files[0]);input.value=''});['dragenter','dragover'].forEach(function(t){z.addEventListener(t,function(e){e.preventDefault();z.classList.add('is-over')})});['dragleave','dragend','drop'].forEach(function(t){z.addEventListener(t,function(e){e.preventDefault();z.classList.remove('is-over')})});z.addEventListener('drop',function(e){go(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0])})})();`

// Banner (landing.mjs): Laufband, das sich nur beim Scrollen nach rechts bewegt. Das Skript legt
// die Liste in eine Spur und hängt so viele Kopien (aria-hidden) an, dass die Breite immer gefüllt
// ist. Ohne Skript oder bei reduzierter Bewegung bleibt das Banner stehen.
const TRUST_SCRIPT = `(function(){var bs=document.querySelectorAll('.trust-banner');if(!bs.length||!window.matchMedia||matchMedia('(prefers-reduced-motion: reduce)').matches||!window.requestAnimationFrame)return;var its=[].map.call(bs,function(b){var l=b.querySelector('.trust-banner__list'),t=document.createElement('div');t.className='trust-banner__track';l.parentNode.insertBefore(t,l);t.appendChild(l);b.classList.add('is-marquee');return{b:b,t:t,l:l,w:0}});function move(){var y=(window.scrollY||window.pageYOffset)*0.3;its.forEach(function(it){if(it.w)it.t.style.transform='translate3d('+((y%it.w)-it.w)+'px,0,0)'})}function fill(){its.forEach(function(it){while(it.t.children.length>1)it.t.removeChild(it.t.lastChild);it.w=it.l.getBoundingClientRect().width;if(!it.w)return;for(var n=Math.ceil(it.b.clientWidth/it.w)+1;n>0;n--){var c=it.l.cloneNode(true);c.setAttribute('aria-hidden','true');it.t.appendChild(c)}});move()}var raf=0;addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(function(){raf=0;move()})},{passive:true});var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(fill,150)});fill();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fill)})();`

export const LANG_SCRIPT = FAQ_SCRIPT + INSTALL_SCRIPT + DROP_SCRIPT + TRUST_SCRIPT + `document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-lang]');if(a){var l=a.getAttribute('data-lang');document.cookie='lang='+l+';path=/;max-age=31536000;SameSite=Lax;Secure';try{localStorage.setItem('cr-lang',a.getAttribute('hreflang'))}catch(_){}}});`

/** Grundgerüst jeder Seite: Head, Header, Inhalt, Footer mit Rechtlichem und Sprachwahl. */
export function renderLayout(page, content, ctx) {
  const { ui, locale } = page
  const home = locale.path
  const guidesLink = ctx.hasGuides(locale)
    ? `<a href="${esc(home + locale.guidesPath + '/')}">${esc(ui.guides)}</a>`
    : ''
  const languages = ctx.switcherLinks(page)
  const footerNav = ctx.footerLinks(locale)
    .map((p) => `<li><a href="${esc(p.path)}"${p.path === page.path ? ' aria-current="page"' : ''}>${esc(p.navTitle)}</a></li>`)
    .join('')
  // Sprachwahl im Footer (die Sprache erkennt sonst der Root-Redirect). Aktuelle Sprache ohne Link.
  const langNav = languages.length > 1 ? `<nav class="footer-lang" aria-label="${esc(ui.languageNav)}"><ul>${languages
    .map((l) => l.current
      ? `<li><span aria-current="true" lang="${esc(l.hreflang)}">${esc(l.name)}</span></li>`
      : `<li><a href="${esc(l.href)}" hreflang="${esc(l.hreflang)}" lang="${esc(l.hreflang)}" data-lang="${esc(l.segment)}">${esc(l.name)}</a></li>`)
    .join('')}</ul></nav>` : ''

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
        ${langNav}
      </div>
    </footer>
    <script src="${esc(ctx.langScriptSrc)}"></script>
  </body>
</html>
`
}
