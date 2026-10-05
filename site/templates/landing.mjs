import { esc } from './util.mjs'
import { renderHeroAnimation } from './partials/hero-animation.mjs'

const paragraphs = (text) => [].concat(text).map((p) => `<p>${esc(p)}</p>`).join('\n          ')

/** Landing Page einer Sprache, Gliederung nach SEO-Plan 6.2. Texte in site/content/<code>/landing.json. */
export function renderLanding(page, ctx) {
  const { hero, problem, steps, features, install, comparison, audience, faq, finalCta } = page.data
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
          ${renderHeroAnimation(hero.animationLabel)}
        </div>
      </section>`,
    problem && section('problem', problem.title, paragraphs(problem.text)),
    steps && section('steps', steps.title, `<ol class="steps">
            ${steps.items.map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('\n            ')}
          </ol>`),
    ...features.map((f) => section('feature', f.title, paragraphs(f.text))),
    install && section('install', install.title, `${paragraphs(install.intro)}
          <div class="install">
            ${install.platforms.map((p) => `<div class="install__platform">
              <h3>${esc(p.name)}</h3>
              <ol>${p.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
            </div>`).join('\n            ')}
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
    audience && section('audience', audience.title, `${paragraphs(audience.intro)}
          <ul class="checklist">${audience.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`),
    faq && section('faq', faq.title, `<div class="faq">
            ${faq.items.map((i) => `<div class="faq__item"><h3>${esc(i.q)}</h3>${[].concat(i.a).map((a) => `<p>${esc(a)}</p>`).join('')}</div>`).join('\n            ')}
          </div>`),
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
