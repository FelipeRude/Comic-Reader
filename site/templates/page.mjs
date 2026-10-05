import { esc, formatDate } from './util.mjs'

/** Einfache Textseite aus Markdown (Impressum, Datenschutz). Inhalte in site/content/<code>/pages/. */
export function renderPage(page) {
  const { ui, locale } = page
  return `      <article class="wrap prose">
        <h1>${esc(page.h1)}</h1>
${page.html}
        ${page.updated ? `<p class="meta">${esc(ui.asOf)} <time datetime="${esc(page.updated)}">${esc(formatDate(page.updated, locale.hreflang))}</time></p>` : ''}
      </article>`
}
