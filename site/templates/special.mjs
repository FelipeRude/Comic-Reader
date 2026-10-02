import { esc } from './util.mjs'

/**
 * Fallback für "/": Normalerweise leitet die .htaccess vorher per 302 weiter.
 * Greift das nicht (z. B. lokaler Static-Server), wählt dieses Skript die Sprache
 * in derselben Reihenfolge (Cookie → Browser → Default).
 */
export function renderRoot(ctx) {
  const segments = ctx.liveLocales.map((l) => l.path.slice(1, -1))
  const accept = Object.fromEntries(ctx.liveLocales.flatMap((l) => l.accept.map((a) => [a, l.path])))
  const fallback = ctx.defaultLocale.path
  const script = `(function(){var s=${JSON.stringify(segments)},a=${JSON.stringify(accept)},m=document.cookie.match(/(?:^|;\\s*)lang=([^;]+)/);if(m&&s.indexOf(m[1])>-1)return location.replace('/'+m[1]+'/');var n=navigator.languages||[navigator.language||''];for(var i=0;i<n.length;i++){var p=a[String(n[i]).toLowerCase().split('-')[0]];if(p)return location.replace(p)}location.replace(${JSON.stringify(fallback)})})()`
  return `<!doctype html>
<html lang="${esc(ctx.defaultLocale.hreflang)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(ctx.site.name)}</title>
    ${ctx.homeAlternates.map((a) => `<link rel="alternate" hreflang="${esc(a.hreflang)}" href="${esc(a.href)}">`).join('\n    ')}
    <script>${script}</script>
  </head>
  <body>
    <ul>
      ${ctx.liveLocales.map((l) => `<li><a href="${esc(l.path)}" hreflang="${esc(l.hreflang)}">${esc(ctx.site.name)} – ${esc(l.nativeName)}</a></li>`).join('\n      ')}
    </ul>
  </body>
</html>
`
}

/** Gemeinsame, mehrsprachige 404-Seite (ErrorDocument in der .htaccess). */
export function render404(ctx) {
  return `<!doctype html>
<html lang="${esc(ctx.defaultLocale.hreflang)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>404 – ${esc(ctx.site.name)}</title>
    <link rel="icon" type="image/png" href="/img/icon.png">
    <link rel="stylesheet" href="${esc(ctx.cssHref)}">
  </head>
  <body>
    <main id="main" class="wrap prose not-found">
      <h1>404</h1>
      <p lang="en">This page doesn’t exist (anymore).</p>
      <p lang="de">Diese Seite gibt es nicht (mehr).</p>
      <ul>
        ${ctx.liveLocales.map((l) => `<li><a href="${esc(l.path)}" hreflang="${esc(l.hreflang)}" lang="${esc(l.hreflang)}">${esc(ctx.site.name)} – ${esc(l.nativeName)}</a></li>`).join('\n        ')}
      </ul>
    </main>
  </body>
</html>
`
}
