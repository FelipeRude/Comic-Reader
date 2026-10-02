import { esc } from './util.mjs'

/** Landing Page einer Sprache. Platzhalter-Gliederung, der volle Aufbau folgt in Phase 2 (SEO-Plan 6.2). */
export function renderLanding(page, ctx) {
  const { hero, features } = page.data
  return `      <section class="hero">
        <div class="wrap">
          <h1>${esc(hero.h1)}</h1>
          <p class="lead">${esc(hero.lead)}</p>
          <p><a class="btn" href="${esc(ctx.appHref(page.locale))}">${esc(hero.cta)}</a></p>
          <ul class="trust">${hero.trust.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
      </section>
      <section class="features">
        <div class="wrap features__grid">
${features.map((f) => `          <article class="card">
            <h2>${esc(f.title)}</h2>
            <p>${esc(f.text)}</p>
          </article>`).join('\n')}
        </div>
      </section>`
}
