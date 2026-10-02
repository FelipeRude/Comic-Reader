// Gemeinsame Sprachkonfiguration für Landing-Build (scripts/build-site.mjs), Sitemap,
// .htaccess-Generator und später die App-i18n (docs/SEO-PLAN.md, 4.4).
//
// Neue Sprache = neuer Eintrag + Texte in site/content/<code>/ (und src/locales/<code>.json).
//   status 'live'  → gebaut, verlinkt, in hreflang, Sitemap und Root-Redirect
//   status 'draft' → nur im Dev-Build (DEPLOY_TARGET=dev), nirgends verlinkt
//
// Felder:
//   code        interner Code, zugleich Ordner unter site/content/
//   hreflang    Wert für hreflang (BCP 47, z. B. 'pt-BR')
//   path        URL-Präfix der Sprache (Kleinbuchstaben, mit Slash)
//   ogLocale    Open-Graph-Locale
//   nativeName  Name im Sprachumschalter
//   guidesPath  Ordner für Ratgeber unter path
//   accept      Sprach-Präfixe aus Accept-Language, die auf diese Sprache führen
export const LOCALES = [
  { code: 'de', hreflang: 'de', path: '/de/', ogLocale: 'de_DE', nativeName: 'Deutsch', guidesPath: 'ratgeber', accept: ['de'], status: 'live' },
  { code: 'en', hreflang: 'en', path: '/en/', ogLocale: 'en_US', nativeName: 'English', guidesPath: 'guides', accept: ['en'], status: 'live' },
  // { code: 'fr',    hreflang: 'fr',    path: '/fr/',    ogLocale: 'fr_FR', nativeName: 'Français',  guidesPath: 'guides', accept: ['fr'], status: 'draft' },
  // { code: 'es',    hreflang: 'es',    path: '/es/',    ogLocale: 'es_ES', nativeName: 'Español',   guidesPath: 'guias',  accept: ['es'], status: 'draft' },
  // { code: 'pt-BR', hreflang: 'pt-BR', path: '/pt-br/', ogLocale: 'pt_BR', nativeName: 'Português', guidesPath: 'guias',  accept: ['pt'], status: 'draft' },
]

export const DEFAULT_LOCALE = 'en'

export const liveLocales = () => LOCALES.filter((l) => l.status === 'live')

/** Sprachen, die gebaut werden: live immer, draft nur im Dev-Build. */
export const buildLocales = (isDev) => LOCALES.filter((l) => l.status === 'live' || (isDev && l.status === 'draft'))
