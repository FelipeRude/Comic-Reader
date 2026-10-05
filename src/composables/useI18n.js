import { ref, watchEffect } from 'vue'
import { LOCALES, DEFAULT_LOCALE } from '../../locales.config.mjs'

// Kleines i18n ohne Library (docs/SEO-PLAN.md, 5.1). Alle Sprachdateien sind klein und
// werden mitgebündelt, damit der Sprachwechsel auch offline funktioniert.
const files = import.meta.glob('../locales/*.json', { eager: true, import: 'default' })
const messages = Object.fromEntries(
  Object.entries(files).map(([file, data]) => [file.match(/([\w-]+)\.json$/)[1], data]),
)

// Wie auf der Landing: live-Sprachen immer, draft nur im Dev-Deploy – und nur mit Sprachdatei.
const locales = LOCALES.filter((l) => messages[l.code] && (l.status === 'live' || (__DEPLOY_DEV__ && l.status === 'draft')))

// Landing und App teilen sich diesen Key (gleicher Origin), die Landing schreibt den hreflang-Wert.
const STORAGE_KEY = 'cr-lang'

/** Findet die passende Sprache zu einem Code oder Browser-Tag (z. B. 'de-AT' → de). */
function match(tag) {
  if (!tag) return null
  const lower = String(tag).toLowerCase()
  const exact = locales.find((l) => l.code.toLowerCase() === lower || l.hreflang.toLowerCase() === lower)
  if (exact) return exact
  const base = lower.split(/[-_]/)[0]
  return locales.find((l) => l.accept.includes(base)) ?? null
}

function readStored() {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}

function store(l) {
  try { localStorage.setItem(STORAGE_KEY, l.hreflang) } catch {}
}

/** Reihenfolge laut Plan 5.2: ?lang → gespeicherte Wahl → Browsersprachen → Default. */
function detect() {
  const url = new URL(location.href)
  const fromUrl = match(url.searchParams.get('lang'))
  if (url.searchParams.has('lang')) {
    url.searchParams.delete('lang')
    history.replaceState(history.state, '', url.pathname + url.search + url.hash)
  }
  if (fromUrl) {
    store(fromUrl)
    return fromUrl.code
  }
  const stored = match(readStored())
  if (stored) return stored.code
  for (const tag of navigator.languages ?? [navigator.language]) {
    const l = match(tag)
    if (l) return l.code
  }
  return match(DEFAULT_LOCALE)?.code ?? locales[0].code
}

const locale = ref(detect())
const current = () => locales.find((l) => l.code === locale.value)

watchEffect(() => {
  document.documentElement.lang = current().hreflang
})

/** Bewusste Wahl in den Einstellungen: merken, auch für den Root-Redirect der Landing (Cookie). */
function setLocale(code) {
  const l = match(code)
  if (!l) return
  locale.value = l.code
  store(l)
  document.cookie = `lang=${l.path.slice(1, -1)};path=/;max-age=31536000;SameSite=Lax;Secure`
}

const lookup = (obj, key) => key.split('.').reduce((o, k) => o?.[k], obj)

function n(value, options) {
  return new Intl.NumberFormat(current().hreflang, options).format(value)
}

function d(value, options) {
  return new Intl.DateTimeFormat(current().hreflang, options).format(value)
}

/**
 * Übersetzt einen Key. Parameter in {geschweiften Klammern} werden ersetzt, Zahlen dabei
 * lokal formatiert. Ist der Eintrag ein Objekt ({ one, other, … }), wählt params.count die
 * Pluralform. Fehlt ein Key, greift Englisch.
 */
function t(key, params = {}) {
  let msg = lookup(messages[locale.value], key)
  if (msg == null) {
    msg = lookup(messages[DEFAULT_LOCALE], key)
    if (import.meta.env.DEV) console.warn(`[i18n] "${key}" fehlt in ${locale.value}`)
  }
  if (msg == null) return key
  if (typeof msg === 'object') {
    msg = msg[new Intl.PluralRules(current().hreflang).select(params.count)] ?? msg.other
  }
  return msg.replace(/\{(\w+)\}/g, (match, name) => {
    if (!(name in params)) return match
    return typeof params[name] === 'number' ? n(params[name]) : String(params[name])
  })
}

export function useI18n() {
  return { locale, locales, setLocale, t, n, d }
}
