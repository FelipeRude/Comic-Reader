import { esc } from './util.mjs'
import { renderVideo } from './partials/video.mjs'
import { HIGHLIGHT_ICONS } from './partials/highlight-icons.mjs'
import { PLATFORM_ICONS } from './partials/platform-icons.mjs'
import { TRUST_ICONS } from './partials/trust-icons.mjs'

const paragraphs = (text) => [].concat(text).map((p) => `<p>${esc(p)}</p>`).join('\n          ')

/** Landing Page einer Sprache, Gliederung nach SEO-Plan 6.2. Texte in site/content/<code>/landing.json. */
export function renderLanding(page, ctx) {
  const { hero, trust, intro, problem, steps, features, highlights, install, audience, faq, finalCta } = page.data
  const appHref = esc(ctx.appHref(page.locale))
  // h1 als Liste: jede weitere Zeile beginnt sichtbar neu. Das Leerzeichen davor bleibt im Text,
  // damit Suchmaschinen und Screenreader keine zusammengeklebten Wörter sehen.
  const [h1First, ...h1Rest] = [].concat(hero.h1)
  const h1 = esc(h1First) + h1Rest.map((line) => ` <span class="h1-line">${esc(line)}</span>`).join('')

  // Banner „Kein Account · Offline · Kostenlos“: unter dem Hero und vor dem Abschluss
  const trustBanner = trust && `<aside class="trust-banner" aria-label="${esc(trust.label)}">
        <ul class="wrap trust-banner__list">${trust.items.map((t) => `<li>${TRUST_ICONS[t.icon] ?? ''}<span>${esc(t.text)}</span></li>`).join('')}</ul>
      </aside>`

  const sections = [
    // Hero (dunkel): Video im Hintergrund links, Überschrift und Button unten rechts
    `<section class="hero">
        <div class="wrap hero__inner">
          ${renderVideo('hero-dark', hero.animationLabel, 'hero-video')}
          <div class="hero__text">
            <h1>${h1}</h1>
            <p><a class="btn" href="${appHref}">${esc(hero.cta)}</a></p>
          </div>
        </div>
      </section>`,
    trustBanner,
    // Unterzeile + Drop-Feld. Das Seitenskript (LANG_SCRIPT in layout.mjs) legt die gewählte PDF
    // in der IndexedDB „panelzoom-handoff“ ab und öffnet die App mit ?import=1, die sie importiert
    // (src/storage/handoff.js). Ohne Skript bleibt der Link zur App.
    intro && `<section class="intro">
        <div class="wrap">
          <p class="intro__lead">${esc(intro.lead)}</p>
          <label class="dropzone" data-dropzone data-app="${appHref}" data-msg-busy="${esc(intro.dropzone.busy)}" data-msg-type="${esc(intro.dropzone.wrongType)}">
            <input class="visually-hidden" type="file" accept="application/pdf,.pdf">
            ${DROP_ICON}
            <span class="dropzone__title">${esc(intro.dropzone.title)}</span>
            <span class="dropzone__hint">${esc(intro.dropzone.hint)}</span>
            <span class="btn dropzone__btn">${esc(intro.dropzone.button)}</span>
            <span class="dropzone__status" data-dropzone-status role="status" aria-live="polite"></span>
          </label>
          <noscript><p><a class="btn" href="${appHref}">${esc(intro.dropzone.noscript)}</a></p></noscript>
        </div>
      </section>`,
    problem && section('problem', problem.title, paragraphs(problem.text)),
    ...features.map((f) => f.video
      // Mit Video: Video links, Überschrift und Text rechts (schmal untereinander)
      ? `<section class="section section--feature">
        <div class="wrap feature">
          ${renderVideo(f.video, f.videoLabel, 'feature__video')}
          <div class="feature__text">
            <h2>${esc(f.title)}</h2>
            ${paragraphs(f.text)}
          </div>
        </div>
      </section>`
      : section('feature', f.title, paragraphs(f.text))),
    highlights && section('highlights', highlights.title, `<ul class="highlights">
            ${highlights.items.map((i) => `<li>${HIGHLIGHT_ICONS[i.icon] ?? ''}<h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></li>`).join('\n            ')}
          </ul>`),
    // Umschalter iOS/Android: ohne Skript stehen beide Anleitungen untereinander, das Skript
    // (LANG_SCRIPT in layout.mjs) blendet die Buttons ein, zeigt eine Anleitung und wählt das
    // erkannte System (Standard iOS).
    install && section('install', install.title, `${paragraphs(install.intro)}
          <div class="install" data-install>
            <div class="install__switch" hidden>
              <p class="install__choose" id="install-choose">${esc(install.chooseLabel)}</p>
              <div class="install__tabs" role="tablist" aria-labelledby="install-choose">
                ${install.platforms.map((p) => `<button type="button" class="install__tab" role="tab" id="install-tab-${p.platform}" aria-controls="install-${p.platform}" data-platform="${p.platform}">${PLATFORM_ICONS[p.platform] ?? ''}<span>${esc(p.tabLabel ?? p.name)}</span></button>`).join('\n                ')}
              </div>
            </div>
            ${install.platforms.map((p) => `<div class="install__platform" id="install-${p.platform}" data-platform="${p.platform}">
              <div class="install__text">
                <h3>${esc(p.name)}</h3>
                <ol>${p.steps.map((st) => `<li>${esc(st)}</li>`).join('')}</ol>
              </div>
              ${p.video ? renderVideo(p.video, p.videoLabel, 'install__video') : ''}
            </div>`).join('\n            ')}
          </div>`),
    steps && section('steps', steps.title, `<ol class="steps">
            ${steps.items.map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('\n            ')}
          </ol>`),
    audience && section('audience', audience.title, `${paragraphs(audience.intro)}
          <ul class="checklist">${audience.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`),
    faq && section('faq', faq.title, `<div class="faq">
            ${faq.items.map((i) => `<details class="faq__item"><summary><h3>${esc(i.q)}</h3></summary><div class="faq__answer">${[].concat(i.a).map((a) => `<p>${esc(a)}</p>`).join('')}</div></details>`).join('\n            ')}
          </div>`),
    trustBanner,
    finalCta && section('final-cta', finalCta.title, `${paragraphs(finalCta.text)}
          <p><a class="btn" href="${appHref}">${esc(finalCta.button)}</a></p>`),
  ]
  return sections.filter(Boolean).map((s) => `      ${s}`).join('\n')
}

// Comicseite mit Pfeil nach unten (Drop-Feld)
const DROP_ICON = '<svg class="dropzone__icon" viewBox="0 0 64 64" width="72" height="72" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><path class="hl-paper" d="M12 6H40L52 18V58H12Z"/><path d="M40 6V18H52"/><path class="hl-red" d="M26 22H38V36H45L32 50L19 36H26Z"/></svg>'

function section(kind, title, body) {
  return `<section class="section section--${kind}">
        <div class="wrap">
          <h2>${esc(title)}</h2>
          ${body}
        </div>
      </section>`
}
