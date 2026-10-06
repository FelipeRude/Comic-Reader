import { esc } from './util.mjs'
import { renderThemedVideo } from './partials/themed-video.mjs'
import { HIGHLIGHT_ICONS } from './partials/highlight-icons.mjs'
import { PLATFORM_ICONS } from './partials/platform-icons.mjs'

const paragraphs = (text) => [].concat(text).map((p) => `<p>${esc(p)}</p>`).join('\n          ')

/** Landing Page einer Sprache, Gliederung nach SEO-Plan 6.2. Texte in site/content/<code>/landing.json. */
export function renderLanding(page, ctx) {
  const { hero, problem, steps, features, highlights, install, comparison, audience, faq, finalCta } = page.data
  const appHref = esc(ctx.appHref(page.locale))
  // h1 als Liste: jede weitere Zeile beginnt sichtbar neu. Das Leerzeichen davor bleibt im Text,
  // damit Suchmaschinen und Screenreader keine zusammengeklebten Wörter sehen.
  const [h1First, ...h1Rest] = [].concat(hero.h1)
  const h1 = esc(h1First) + h1Rest.map((line) => ` <span class="h1-line">${esc(line)}</span>`).join('')

  const sections = [
    `<section class="hero">
        <div class="wrap hero__inner">
          <div class="hero__text">
            <h1>${h1}</h1>
            <p class="lead">${esc(hero.lead)}</p>
            <p><a class="btn" href="${appHref}">${esc(hero.cta)}</a></p>
            <ul class="trust">${hero.trust.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          </div>
          ${renderThemedVideo('hero', hero.animationLabel, 'hero-video')}
        </div>
      </section>`,
    problem && section('problem', problem.title, paragraphs(problem.text)),
    steps && section('steps', steps.title, `<ol class="steps">
            ${steps.items.map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('\n            ')}
          </ol>`),
    ...features.map((f) => f.video
      // Mit Video: Video links, Überschrift und Text rechts (schmal untereinander)
      ? `<section class="section section--feature">
        <div class="wrap feature">
          ${renderThemedVideo(f.video, f.videoLabel, 'feature__video')}
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
              ${p.video ? renderThemedVideo(p.video, p.videoLabel, 'install__video') : ''}
            </div>`).join('\n            ')}
          </div>`),
    audience && section('audience', audience.title, `${paragraphs(audience.intro)}
          <ul class="checklist">${audience.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`),
    faq && section('faq', faq.title, `<div class="faq">
            ${faq.items.map((i) => `<details class="faq__item"><summary><h3>${esc(i.q)}</h3></summary><div class="faq__answer">${[].concat(i.a).map((a) => `<p>${esc(a)}</p>`).join('')}</div></details>`).join('\n            ')}
          </div>`),
    comparison && section('comparison', comparison.title, `${paragraphs(comparison.intro)}
          <div class="table-scroll">
            <table class="compare">
              <thead><tr><th scope="col"><span class="visually-hidden">${esc(comparison.featureLabel)}</span></th>${comparison.columns.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
              <tbody>
                ${comparison.rows.map((r) => `<tr><th scope="row">${esc(r.label)}</th>${r.values.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('\n                ')}
              </tbody>
            </table>
          </div>
          ${comparison.note ? `<p class="note">${esc(comparison.note)}</p>` : ''}`),
    finalCta && section('final-cta', finalCta.title, `${paragraphs(finalCta.text)}
          <p><a class="btn" href="${appHref}">${esc(finalCta.button)}</a></p>`),
  ]
  return sections.filter(Boolean).map((s) => `      ${s}`).join('\n')
}

function section(kind, title, body) {
  return `<section class="section section--${kind}">
        <div class="wrap">
          <h2>${esc(title)}</h2>
          ${body}
        </div>
      </section>`
}
