import { esc, formatDate } from './util.mjs'

/** Ratgeber-Seite (Markdown). Autorenkasten und JSON-LD kommen in Phase 3 dazu. */
export function renderArticle(page, ctx) {
  const { ui, locale } = page
  const date = page.updated || page.published
  return `      <article class="wrap prose">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="${esc(locale.path)}">${esc(ui.home)}</a> ›
          <a href="${esc(locale.path + locale.guidesPath + '/')}">${esc(ui.guides)}</a>
        </nav>
        <h1>${esc(page.h1 || page.title)}</h1>
        ${date ? `<p class="meta">${esc(page.updated ? ui.updated : ui.published)} <time datetime="${esc(date)}">${esc(formatDate(date, locale.hreflang))}</time></p>` : ''}
${page.html}
        <p><a class="btn" href="${esc(ctx.appHref(locale))}">${esc(ui.openApp)}</a></p>
      </article>`
}
