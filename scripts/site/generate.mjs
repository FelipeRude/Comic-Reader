// Generatoren für sitemap.xml, robots.txt, llms.txt und .htaccess (docs/SEO-PLAN.md, 4.2 + 7).
// Alle Sprach-Angaben kommen aus locales.config.mjs, damit eine neue Sprache nur ein Eintrag ist.

import { CSP } from './csp.mjs'

const xmlEsc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** sitemap.xml mit hreflang-Alternates; nur indexierbare Seiten in Live-Sprachen. */
export function sitemapXml(pages, site) {
  const urls = pages
    .filter((p) => p.inSitemap)
    .map((p) => {
      const lines = [`    <loc>${xmlEsc(site.origin + p.path)}</loc>`]
      if (p.updated || p.published) lines.push(`    <lastmod>${xmlEsc(p.updated || p.published)}</lastmod>`)
      for (const a of p.alternates) {
        lines.push(`    <xhtml:link rel="alternate" hreflang="${xmlEsc(a.hreflang)}" href="${xmlEsc(a.href)}"/>`)
      }
      return `  <url>\n${lines.join('\n')}\n  </url>`
    })
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`
}

/** robots.txt: live alles erlaubt (auch KI-Crawler, SEO-Plan 7.2), dev komplett gesperrt. */
export function robotsTxt(site, isDev) {
  if (isDev) {
    return `# Entwicklungsumgebung – nicht indexieren (zusätzlich X-Robots-Tag: noindex)
User-agent: *
Disallow: /
`
  }
  return `User-agent: *
Allow: /

Sitemap: ${site.origin}/sitemap.xml
`
}

/** llms.txt (optional, für KI-Agenten; Google ignoriert die Datei). */
export function llmsTxt(site, liveLocales, pages) {
  const guides = pages.filter((p) => p.type === 'article' && p.inSitemap)
  return `# ${site.name} – PDF Comic Reader

> Free, privacy-first web app (PWA) that reads PDF comics on phones panel by panel.
> Automatic panel detection, guided-view style smart zoom, reading progress saved per panel.
> Runs entirely in the browser: no account, no uploads, works offline.
> Available in: ${liveLocales.map((l) => l.nativeName).join(', ')}.

## Pages
${liveLocales.map((l) => `- [Landing (${l.hreflang})](${site.origin}${l.path})`).join('\n')}
- [Open the app](${site.origin}${site.appPath})
${guides.length ? `\n## Guides\n${guides.map((g) => `- [${g.h1 || g.title}](${site.origin}${g.path}) (${g.locale.hreflang})`).join('\n')}\n` : ''}`
}

/**
 * .htaccess für netcup (nginx vor Apache). Absolute https-Ziele in den Redirects,
 * weil Apache hinter dem Proxy sonst ggf. http:// erzeugt und ein zweiter Hop entsteht.
 */
// Zum Debuggen neuer Funktionen vorübergehend auf 'Content-Security-Policy-Report-Only' setzen.
const CSP_HEADER = 'Content-Security-Policy'

export function htaccess({ site, liveLocales, defaultLocale, isDev }) {
  const target = (p) => `https://%{HTTP_HOST}${p}`
  const segments = liveLocales.map((l) => reEsc(l.path.slice(1, -1))).join('|')
  const acceptRules = (anywhere) => liveLocales.flatMap((l) => l.accept.flatMap((code) => [
    `RewriteCond %{HTTP:Accept-Language} ${anywhere ? '(?:^|,)\\s*' : '^\\s*'}${reEsc(code)}(?:[-_;,\\s]|$) [NC]`,
    `RewriteRule ^$ ${target(l.path)} [R=302,L]`,
  ])).join('\n')

  return `# Generiert von scripts/build-site.mjs (${isDev ? 'Dev-Build' : 'Live-Build'}) – nicht von Hand bearbeiten.
AddDefaultCharset utf-8
DirectoryIndex index.html
ErrorDocument 404 /404.html

<IfModule mod_mime.c>
  AddType application/manifest+json .webmanifest
  AddType text/javascript .mjs
  AddType font/woff2 .woff2
  AddType video/webm .webm
  AddType image/webp .webp
</IfModule>

<IfModule mod_rewrite.c>
RewriteEngine On

# 1. HTTPS erzwingen. Hinter dem nginx-Proxy kommt TLS als X-Forwarded-Proto an.
RewriteCond %{HTTPS} !=on
RewriteCond %{HTTP:X-Forwarded-Proto} !=https
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L,NE]
${isDev ? '' : `
# 2. Eine Domain-Variante: www → ohne www
RewriteCond %{HTTP_HOST} ^www\\.${reEsc(site.host)}$ [NC]
RewriteRule ^ ${site.origin}%{REQUEST_URI} [R=301,L,NE]
`}
# 3. /…/index.html → /…/ (nicht in /app/, dort lädt der Service Worker index.html direkt)
RewriteCond %{REQUEST_URI} !^/app/
RewriteCond %{THE_REQUEST} \\s/+((?:[^?\\s]*/)?)index\\.html[?\\s]
RewriteRule ^ ${target('/%1')} [R=301,L,NE]

# 4. Root "/" (x-default): Sprache wählen, 302 (SEO-Plan 4.2)
#    a) bewusste Wahl über den Sprachumschalter (Cookie)
RewriteCond %{HTTP_COOKIE} (?:^|;\\s*)lang=(${segments})(?:;|$)
RewriteRule ^$ ${target('/%1/')} [R=302,L]
#    b) bevorzugte Browsersprache
${acceptRules(false)}
#    c) weitere Browsersprachen aus der Liste
${acceptRules(true)}
#    d) Default
RewriteRule ^$ ${target(defaultLocale.path)} [R=302,L]

# 5. Verzeichnisse immer mit Slash (/de → /de/, /app → /app/)
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^(.*[^/])$ ${target('/$1/')} [R=301,L,NE]
</IfModule>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  # Einbetten in fremde Seiten verbieten (Clickjacking)
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set ${CSP_HEADER} "${CSP}"
  <If "%{HTTPS} == 'on' || %{HTTP:X-Forwarded-Proto} == 'https'">
    Header always set Strict-Transport-Security "max-age=31536000"
  </If>

  # Root-Redirect hängt von Sprache und Cookie ab → nie cachen
  <If "%{REQUEST_URI} == '/'">
    Header always set Vary "Accept-Language, Cookie"
    Header always set Cache-Control "no-store"
  </If>

  # Service Worker, Manifest und App-Shell immer neu prüfen, sonst kommen Updates nicht an
  <If "%{REQUEST_URI} =~ m#^/app/(index\\.html|sw\\.js|workbox-[^/]+\\.js|manifest\\.webmanifest)?$#">
    Header set Cache-Control "no-cache"
  </If>

  # Dateien mit Hash im Namen dauerhaft cachen
  <If "%{REQUEST_URI} =~ m#^/(app/)?assets/#">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </If>
${isDev ? `
  # Entwicklungsumgebung nie indexieren (zusätzlich robots.txt Disallow)
  Header always set X-Robots-Tag "noindex, nofollow"
` : ''}</IfModule>
`
}
