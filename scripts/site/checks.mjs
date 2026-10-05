// Prüfungen nach dem Rendern. Fehler brechen den Build ab, Warnungen werden nur ausgegeben.
// Geprüft wird das fertige HTML in dist/, damit genau das getestet wird, was ausgeliefert wird.
import fs from 'node:fs'
import path from 'node:path'

const TITLE_MAX = 60
const DESCRIPTION_MAX = 160

const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

function parseHead(html) {
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((m) => attrs(m[0]))
  const metas = [...html.matchAll(/<meta\b[^>]*>/g)].map((m) => attrs(m[0]))
  return {
    title: unesc(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''),
    description: unesc(metas.find((m) => m.name === 'description')?.content ?? ''),
    canonical: links.find((l) => l.rel === 'canonical')?.href,
    alternates: links.filter((l) => l.rel === 'alternate' && l.hreflang).map((l) => ({ hreflang: l.hreflang, href: l.href })),
  }
}

/** Existiert ein interner Pfad als Datei in dist/? */
function existsInDist(distDir, urlPath) {
  const clean = decodeURIComponent(urlPath.split(/[?#]/)[0])
  const file = path.join(distDir, clean.endsWith('/') ? clean + 'index.html' : clean)
  return fs.existsSync(file) && fs.statSync(file).isFile()
}

/**
 * @param pages   gerenderte Seiten (mit path, translationKey, locale, alternates)
 * @param opts    { distDir, site, liveLocales, appBuilt }
 * @returns       { errors: string[], warnings: string[] }
 */
export function runChecks(pages, { distDir, site, liveLocales, appBuilt }) {
  const errors = []
  const warnings = []
  const byPath = new Map()

  // Doppelte URLs (z. B. zwei Ratgeber mit gleichem Slug)
  for (const p of pages) {
    if (byPath.has(p.path)) errors.push(`Doppelte URL ${p.path} (${p.source} und ${byPath.get(p.path).source})`)
    byPath.set(p.path, p)
  }

  // Meta-Daten aus dem gerenderten HTML
  const heads = new Map()
  for (const p of pages) {
    const html = fs.readFileSync(path.join(distDir, p.path, 'index.html'), 'utf8')
    const head = parseHead(html)
    heads.set(site.origin + p.path, { page: p, head, html })
    const where = `${p.path} (${p.source})`
    if (!head.title) errors.push(`${where}: <title> fehlt`)
    else if (head.title.length > TITLE_MAX) warnings.push(`${where}: Title hat ${head.title.length} Zeichen (> ${TITLE_MAX})`)
    if (!head.description) errors.push(`${where}: Meta-Description fehlt`)
    else if (head.description.length > DESCRIPTION_MAX) errors.push(`${where}: Description hat ${head.description.length} Zeichen (> ${DESCRIPTION_MAX})`)
    if (head.canonical !== site.origin + p.path) errors.push(`${where}: canonical ist ${head.canonical ?? '–'}, erwartet ${site.origin + p.path}`)
    if (/<script(?![^>]*\s(?:src=|type="application\/ld\+json"))[^>]*>/i.test(html)) errors.push(`${where}: Inline-<script> gefunden – die CSP erlaubt nur Skripte aus Dateien`)
    if (/\sstyle="/i.test(html)) errors.push(`${where}: style-Attribut gefunden – die CSP erlaubt nur Styles aus Dateien`)
  }

  // hreflang: Selbstreferenz, Ziele existieren, Rückverweise vorhanden, x-default gesetzt
  for (const [url, { page, head }] of heads) {
    if (!head.alternates.length) continue
    const where = page.path
    const seen = new Set()
    for (const a of head.alternates) {
      if (seen.has(a.hreflang)) errors.push(`${where}: hreflang "${a.hreflang}" doppelt`)
      seen.add(a.hreflang)
    }
    if (!head.alternates.some((a) => a.href === url && a.hreflang === page.locale.hreflang)) {
      errors.push(`${where}: hreflang-Selbstreferenz fehlt`)
    }
    if (!seen.has('x-default')) errors.push(`${where}: hreflang x-default fehlt`)
    for (const a of head.alternates) {
      if (a.hreflang === 'x-default') {
        const p = a.href.replace(site.origin, '')
        if (!existsInDist(distDir, p)) errors.push(`${where}: x-default zeigt auf ${a.href}, die Seite gibt es nicht`)
        continue
      }
      const partner = heads.get(a.href)
      if (!partner) { errors.push(`${where}: hreflang "${a.hreflang}" zeigt auf ${a.href}, die Seite gibt es nicht`); continue }
      if (partner.page.locale.hreflang !== a.hreflang) errors.push(`${where}: ${a.href} ist als "${a.hreflang}" ausgezeichnet, ist aber "${partner.page.locale.hreflang}"`)
      if (!partner.head.alternates.some((b) => b.href === url)) errors.push(`${partner.page.path}: Rückverweis (hreflang) auf ${where} fehlt`)
    }
  }

  // Übersetzungen: fehlende Gegenstücke in Live-Sprachen sind erlaubt, aber erwähnenswert
  const groups = new Map()
  for (const p of pages.filter((p) => p.locale.status === 'live')) {
    groups.set(p.translationKey, [...(groups.get(p.translationKey) ?? []), p])
  }
  for (const [key, group] of groups) {
    const missing = liveLocales.filter((l) => !group.some((p) => p.locale.code === l.code))
    if (missing.length) warnings.push(`translationKey "${key}" fehlt in: ${missing.map((l) => l.code).join(', ')}`)
  }

  // Interne Links und Assets in allen HTML-Dateien
  const htmlFiles = fs.readdirSync(distDir, { recursive: true })
    .filter((f) => f.endsWith('.html') && !f.startsWith(`app${path.sep}`))
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(distDir, file), 'utf8')
    for (const [, attr, ref] of html.matchAll(/\b(href|src)="(\/(?!\/)[^"]*)"/g)) {
      if (ref.startsWith('/app/') && !appBuilt) continue
      if (!existsInDist(distDir, ref)) errors.push(`${file}: ${attr}="${ref}" zeigt ins Leere`)
    }
  }
  if (!appBuilt) warnings.push('dist/app/ fehlt (vite build nicht gelaufen), Links auf /app/ wurden nicht geprüft')

  return { errors, warnings }
}
