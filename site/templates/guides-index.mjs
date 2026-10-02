import { esc } from './util.mjs'

/** Übersicht aller Ratgeber einer Sprache. */
export function renderGuidesIndex(page, ctx) {
  const { ui } = page
  const items = ctx.guidesOf(page.locale)
    .map((g) => `          <li><a href="${esc(g.path)}">${esc(g.h1 || g.title)}</a><br>${esc(g.description)}</li>`)
    .join('\n')
  return `      <section class="wrap prose">
        <h1>${esc(ui.guidesIndex.h1)}</h1>
        <p class="lead">${esc(ui.guidesIndex.lead)}</p>
        <ul class="guide-list">
${items}
        </ul>
      </section>`
}
