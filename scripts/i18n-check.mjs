// Prüft die App-Übersetzungen (src/locales/*.json), läuft vor jedem Build (npm run i18n:check):
// - jede live-Sprache aus locales.config.mjs hat eine Sprachdatei
// - alle Sprachdateien haben dieselben Keys wie die Default-Sprache
// - Platzhalter ({name}) stimmen pro Key überein, Pluralformen haben "other"
// - jeder im Code benutzte Key t('…') existiert
import fs from 'node:fs'
import path from 'node:path'
import { LOCALES, DEFAULT_LOCALE } from '../locales.config.mjs'

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
const LOCALE_DIR = path.join(ROOT, 'src/locales')
const PLURAL_FORMS = new Set(['zero', 'one', 'two', 'few', 'many', 'other'])

const errors = []
const isPlural = (v) => v && typeof v === 'object' && Object.keys(v).every((k) => PLURAL_FORMS.has(k))

/** Key → Liste der Texte (bei Pluralformen mehrere). */
function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix + k
    if (typeof v === 'string') out.set(key, [v])
    else if (isPlural(v)) out.set(key, Object.values(v))
    else if (v && typeof v === 'object') flatten(v, key + '.', out)
    else errors.push(`${key}: ungültiger Wert`)
  }
  return out
}

const placeholders = (texts) => [...new Set(texts.flatMap((s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1])))].sort().join(',')

const files = Object.fromEntries(fs.readdirSync(LOCALE_DIR).filter((f) => f.endsWith('.json')).map((f) => {
  const code = f.replace(/\.json$/, '')
  const file = path.join(LOCALE_DIR, f)
  let data
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')) } catch (err) { errors.push(`${f}: ${err.message}`); data = {} }
  return [code, data]
}))

for (const l of LOCALES.filter((l) => l.status === 'live')) {
  if (!files[l.code]) errors.push(`Sprachdatei src/locales/${l.code}.json fehlt (Sprache ist live)`)
}

const base = files[DEFAULT_LOCALE] ? flatten(files[DEFAULT_LOCALE]) : new Map()
for (const [code, data] of Object.entries(files)) {
  const keys = flatten(data)
  for (const [key, texts] of keys) {
    const raw = key.split('.').reduce((o, k) => o?.[k], data)
    if (isPlural(raw) && !('other' in raw)) errors.push(`${code}: ${key} hat keine Pluralform "other"`)
    if (code === DEFAULT_LOCALE) continue
    if (!base.has(key)) errors.push(`${code}: ${key} gibt es in ${DEFAULT_LOCALE} nicht`)
    else if (placeholders(texts) !== placeholders(base.get(key))) {
      errors.push(`${code}: ${key} hat andere Platzhalter ({${placeholders(texts)}}) als ${DEFAULT_LOCALE} ({${placeholders(base.get(key))}})`)
    }
  }
  if (code !== DEFAULT_LOCALE) {
    for (const key of base.keys()) if (!keys.has(key)) errors.push(`${code}: ${key} fehlt`)
  }
}

// Im Code benutzte Keys
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : /\.(vue|js)$/.test(e.name) ? [p] : []
  })
}
for (const file of walk(path.join(ROOT, 'src'))) {
  const src = fs.readFileSync(file, 'utf8')
  for (const m of src.matchAll(/\bt\(\s*'([\w.]+)'/g)) {
    if (!base.has(m[1])) errors.push(`${path.relative(ROOT, file)}: Key "${m[1]}" fehlt in ${DEFAULT_LOCALE}.json`)
  }
}

if (errors.length) {
  console.error(`✘ i18n-Prüfung fehlgeschlagen:\n${errors.map((e) => `  - ${e}`).join('\n')}`)
  process.exit(1)
}
console.log(`✔ i18n: ${Object.keys(files).join(', ')} · ${base.size} Keys`)
