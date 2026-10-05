import { esc } from './util.mjs'

/** Landing Page einer Sprache. Platzhalter-Gliederung, der volle Aufbau folgt in Phase 2 (SEO-Plan 6.2). */
export function renderLanding(page, ctx) {
  const { hero, features } = page.data
  // h1 als Liste: jede weitere Zeile beginnt sichtbar neu. Das Leerzeichen davor bleibt im Text,
  // damit Suchmaschinen und Screenreader keine zusammengeklebten Wörter sehen.
  const [h1First, ...h1Rest] = [].concat(hero.h1)
  const h1 = esc(h1First) + h1Rest.map((line) => ` <span class="h1-line">${esc(line)}</span>`).join('')
  return `      <section class="hero">
        <div class="wrap">
          <h1>${h1}</h1>
          <p class="lead">${esc(hero.lead)}</p>
          <p><a class="btn" href="${esc(ctx.appHref(page.locale))}">${esc(hero.cta)}</a></p>
          <ul class="trust">${hero.trust.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
      </section>
${features.map((f) => `      <section class="feature">
        <div class="wrap">
          <h2>${esc(f.title)}</h2>
          <p>${esc(f.text)}</p>
        </div>
      </section>`).join('\n')}`
}
