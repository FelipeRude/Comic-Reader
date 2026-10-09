#!/usr/bin/env node
// Baut die statischen Landing Pages nach dist/ (docs/SEO-PLAN.md, 4.5).
// dist/app/ (Vite) wird nicht angefasst; alles andere in dist/ gehört diesem Skript.
//
//   node scripts/build-site.mjs               bauen
//   node scripts/build-site.mjs --serve       bauen + Vorschau-Server
//   node scripts/build-site.mjs --serve-only  nur Vorschau-Server
//   DEPLOY_TARGET=dev …                       Dev-Build: noindex, Draft-Sprachen
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import * as sass from 'sass'
import MarkdownIt from 'markdown-it'
import { LOCALES, DEFAULT_LOCALE, buildLocales, liveLocales as getLiveLocales } from '../locales.config.mjs'
import { SITE } from '../site/site.config.mjs'
import { renderLayout, LANG_SCRIPT } from '../site/templates/layout.mjs'
import { renderLanding } from '../site/templates/landing.mjs'
import { renderArticle } from '../site/templates/article.mjs'
import { renderGuidesIndex } from '../site/templates/guides-index.mjs'
import { renderRoot, render404, rootRedirectScript } from '../site/templates/special.mjs'
import { renderPage } from '../site/templates/page.mjs'
import { sitemapXml, robotsTxt, llmsTxt, htaccess } from './site/generate.mjs'
import { runChecks } from './site/checks.mjs'
import { serve } from './site/serve.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITE_DIR = path.join(ROOT, 'site')
const DIST = path.join(ROOT, 'dist')
const APP_DIR = 'app'

const args = new Set(process.argv.slice(2))
const isDev = process.env.DEPLOY_TARGET === 'dev'
const PORT = Number(process.env.PORT) || 4173

const locales = buildLocales(isDev)
const liveLocales = getLiveLocales()
const defaultLocale = LOCALES.find((l) => l.code === DEFAULT_LOCALE)
if (!defaultLocale || defaultLocale.status !== 'live') fail([`DEFAULT_LOCALE "${DEFAULT_LOCALE}" muss eine Live-Sprache sein`])

if (args.has('--serve-only')) {
  serve({ distDir: DIST, port: PORT, liveLocales, defaultLocale, isDev })
} else {
  build()
  if (args.has('--serve')) serve({ distDir: DIST, port: PORT, liveLocales, defaultLocale, isDev })
}

function build() {
  const started = Date.now()
  cleanDist()

  const md = new MarkdownIt({ html: true, typographer: true })
  const ui = Object.fromEntries(locales.map((l) => [l.code, readJson(`content/${l.code}/ui.json`)]))
  const pages = locales.flatMap((locale) => loadPages(locale, ui[locale.code], md))

  // Übersetzungen über translationKey verbinden → hreflang + Sprachumschalter
  const groups = new Map()
  for (const p of pages) {
    if (!groups.has(p.translationKey)) groups.set(p.translationKey, new Map())
    groups.get(p.translationKey).set(p.locale.code, p)
  }
  for (const p of pages) {
    p.group = groups.get(p.translationKey)
    p.alternates = alternatesFor(p)
    p.inSitemap = !isDev && p.locale.status === 'live' && !p.noindex
  }

  const cssHref = buildCss()
  const langScriptSrc = writeHashed('lang', 'js', LANG_SCRIPT)
  const rootScriptSrc = writeHashed('root', 'js', rootRedirectScript({ liveLocales, defaultLocale }))
  copyDir(path.join(SITE_DIR, 'public'), DIST)

  const guidesOf = (locale) => pages
    .filter((p) => p.type === 'article' && p.locale.code === locale.code)
    .sort((a, b) => (b.published ?? '').localeCompare(a.published ?? ''))
  const ctx = {
    site: SITE,
    isDev,
    cssHref,
    langScriptSrc,
    rootScriptSrc,
    liveLocales,
    defaultLocale,
    homeAlternates: groups.get('home') ? alternatesFor(groups.get('home').get(defaultLocale.code)) : [],
    appHref: (locale) => `${SITE.appPath}?lang=${locale.code}`,
    guidesOf,
    hasGuides: (locale) => guidesOf(locale).length > 0,
    // Textseiten (Impressum, Datenschutz) für den Footer, sortiert nach Frontmatter "order"
    footerLinks: (locale) => pages
      .filter((p) => p.type === 'page' && p.locale.code === locale.code)
      .sort((a, b) => a.order - b.order),
    switcherLinks: (page) => liveLocales.map((l) => {
      const target = page.group.get(l.code) ?? groups.get('home')?.get(l.code)
      return { name: l.nativeName, short: l.code.toUpperCase(), hreflang: l.hreflang, segment: l.path.slice(1, -1), href: target?.path ?? l.path, current: l.code === page.locale.code }
    }),
  }

  const templates = { landing: renderLanding, article: renderArticle, guides: renderGuidesIndex, page: renderPage }
  // Platzhalter [[…]] (z. B. im Impressum) im Dev-Build gelb markieren; live darf keiner übrig sein.
  const placeholders = []
  for (const p of pages) {
    const html = renderLayout(p, templates[p.type](p, ctx), ctx)
    const found = [...html.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1])
    if (found.length) placeholders.push(`${p.path} (${p.source}): ${[...new Set(found)].join(', ')}`)
    writeFile(path.join(p.path, 'index.html'), html.replace(/\[\[([^\]]+)\]\]/g, '<mark class="placeholder">[$1]</mark>'))
  }
  if (placeholders.length) {
    if (isDev) for (const p of placeholders) console.warn(`⚠ Platzhalter: ${p}`)
    else fail(placeholders.map((p) => `Platzhalter noch nicht ersetzt: ${p}`))
  }

  writeFile('index.html', renderRoot(ctx))
  writeFile('404.html', render404(ctx))
  writeFile('sitemap.xml', sitemapXml(pages, SITE))
  writeFile('robots.txt', robotsTxt(SITE, isDev))
  writeFile('llms.txt', llmsTxt(SITE, liveLocales, pages))
  writeFile('.htaccess', htaccess({ site: SITE, liveLocales, defaultLocale, isDev }))
  if (!isDev && SITE.indexNowKey) writeFile(`${SITE.indexNowKey}.txt`, SITE.indexNowKey)

  const appBuilt = fs.existsSync(path.join(DIST, APP_DIR, 'index.html'))
  const { errors, warnings } = runChecks(pages, { distDir: DIST, site: SITE, liveLocales, appBuilt })
  for (const w of warnings) console.warn(`⚠ ${w}`)
  if (errors.length) fail(errors)

  console.log(`✔ Site gebaut (${isDev ? 'dev' : 'live'}): ${pages.length} Seiten in ${locales.map((l) => l.code).join(', ')} · ${Date.now() - started} ms`)
}

/** Alle Seiten einer Sprache: Landing, Ratgeber (Markdown), Ratgeber-Übersicht. */
function loadPages(locale, ui, md) {
  const base = { locale, ui }
  const landing = readJson(`content/${locale.code}/landing.json`)
  const pages = [{
    ...base,
    type: 'landing',
    source: `content/${locale.code}/landing.json`,
    translationKey: landing.translationKey,
    path: locale.path,
    title: landing.meta.title,
    description: landing.meta.description,
    ogTitle: landing.meta.ogTitle,
    ogImage: landing.meta.ogImage,
    updated: landing.updated,
    data: landing,
  }]

  const guidesDir = path.join(SITE_DIR, 'content', locale.code, locale.guidesPath)
  const files = fs.existsSync(guidesDir) ? fs.readdirSync(guidesDir).filter((f) => f.endsWith('.md')) : []
  for (const file of files) {
    const source = `content/${locale.code}/${locale.guidesPath}/${file}`
    const { data, body } = parseFrontmatter(fs.readFileSync(path.join(guidesDir, file), 'utf8'), source)
    if (data.status === 'draft' && !isDev) continue
    for (const key of ['title', 'description', 'slug', 'translationKey']) {
      if (!data[key]) fail([`${source}: Frontmatter "${key}" fehlt`])
    }
    pages.push({
      ...base,
      type: 'article',
      source,
      translationKey: data.translationKey,
      path: `${locale.path}${locale.guidesPath}/${data.slug}/`,
      title: data.title,
      h1: data.h1 || data.title.replace(new RegExp(`\\s*\\|\\s*${SITE.name}$`), ''),
      description: data.description,
      ogImage: data.ogImage,
      published: data.published,
      updated: data.updated,
      html: md.render(body),
    })
  }

  // Textseiten (Impressum, Datenschutz): Markdown in content/<code>/pages/
  const pagesDir = path.join(SITE_DIR, 'content', locale.code, 'pages')
  for (const file of fs.existsSync(pagesDir) ? fs.readdirSync(pagesDir).filter((f) => f.endsWith('.md')) : []) {
    const source = `content/${locale.code}/pages/${file}`
    const { data, body } = parseFrontmatter(fs.readFileSync(path.join(pagesDir, file), 'utf8'), source)
    for (const key of ['title', 'description', 'slug', 'translationKey', 'navTitle']) {
      if (!data[key]) fail([`${source}: Frontmatter "${key}" fehlt`])
    }
    pages.push({
      ...base,
      type: 'page',
      source,
      translationKey: data.translationKey,
      path: `${locale.path}${data.slug}/`,
      title: data.title,
      h1: data.h1 || data.navTitle,
      navTitle: data.navTitle,
      description: data.description,
      noindex: data.noindex === 'true',
      order: Number(data.order ?? 0),
      updated: data.updated,
      html: md.render(body),
    })
  }

  if (pages.some((p) => p.type === 'article')) {
    pages.push({
      ...base,
      type: 'guides',
      source: `content/${locale.code}/ui.json (guidesIndex)`,
      translationKey: 'guides-index',
      path: `${locale.path}${locale.guidesPath}/`,
      title: ui.guidesIndex.title,
      description: ui.guidesIndex.description,
    })
  }
  return pages
}

/**
 * hreflang-Alternates einer Seite. Nur Live-Sprachen, nur wenn es mindestens zwei
 * Sprachversionen gibt (SEO-Plan 4.3). x-default: "/" für die Startseite (weiterleitende
 * Root), sonst die Version in der Default-Sprache.
 */
function alternatesFor(page) {
  if (page.locale.status !== 'live') return []
  const versions = [...page.group.values()].filter((p) => p.locale.status === 'live')
  if (versions.length < 2) return []
  const alternates = versions.map((p) => ({ hreflang: p.locale.hreflang, href: SITE.origin + p.path, locale: p.locale }))
  const xDefault = page.translationKey === 'home' ? '/' : page.group.get(defaultLocale.code)?.path
  if (xDefault) alternates.push({ hreflang: 'x-default', href: SITE.origin + xDefault })
  return alternates
}

/** Frontmatter im Format `key: value` zwischen `---`-Zeilen. */
function parseFrontmatter(text, source) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) fail([`${source}: Frontmatter fehlt`])
  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const idx = line.indexOf(':')
    if (idx < 0) fail([`${source}: ungültige Frontmatter-Zeile "${line}"`])
    data[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^(["'])(.*)\1$/, '$2')
  }
  return { data, body: match[2] }
}

function buildCss() {
  const { css } = sass.compile(path.join(SITE_DIR, 'styles/site.scss'), { style: 'compressed' })
  return writeHashed('site', 'css', css)
}

/** Schreibt eine Datei mit Inhalts-Hash im Namen nach /assets/ (dauerhaft cachebar) und gibt die URL zurück. */
function writeHashed(name, ext, content) {
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 8)
  const href = `/assets/${name}.${hash}.${ext}`
  writeFile(href, content)
  return href
}

/** dist/ leeren, aber dist/app/ (Vite-Build) behalten. */
function cleanDist() {
  fs.mkdirSync(DIST, { recursive: true })
  for (const entry of fs.readdirSync(DIST)) {
    if (entry !== APP_DIR) fs.rmSync(path.join(DIST, entry), { recursive: true, force: true })
  }
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return
  fs.cpSync(from, to, { recursive: true, filter: (src) => !src.endsWith('.DS_Store') })
}

function writeFile(rel, content) {
  const file = path.join(DIST, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(SITE_DIR, rel), 'utf8'))
}

function fail(errors) {
  console.error(`✖ Site-Build abgebrochen:\n${errors.map((e) => `  - ${e}`).join('\n')}`)
  process.exit(1)
}
