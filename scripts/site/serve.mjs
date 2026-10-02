// Mini-Server für die lokale Vorschau von dist/ (Landing + App). Bildet die wichtigsten
// Regeln der .htaccess nach: Root-Redirect nach Sprache, Slash-Redirect, 404-Seite,
// no-cache für den Service Worker, X-Robots-Tag im Dev-Build. Kein Ersatz für den Test auf develop.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4',
}

export function serve({ distDir, port, liveLocales, defaultLocale, isDev }) {
  const segments = liveLocales.map((l) => l.path.slice(1, -1))

  function pickLocale(req) {
    const cookie = req.headers.cookie?.match(/(?:^|;\s*)lang=([^;]+)/)?.[1]
    if (segments.includes(cookie)) return `/${cookie}/`
    const langs = (req.headers['accept-language'] ?? '').split(',').map((s) => s.trim().split(/[-_;]/)[0].toLowerCase())
    for (const lang of langs) {
      const hit = liveLocales.find((l) => l.accept.includes(lang))
      if (hit) return hit.path
    }
    return defaultLocale.path
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const pathname = decodeURIComponent(url.pathname)
    if (isDev) res.setHeader('X-Robots-Tag', 'noindex, nofollow')

    if (pathname === '/') {
      res.writeHead(302, { Location: pickLocale(req), Vary: 'Accept-Language, Cookie', 'Cache-Control': 'no-store' })
      return res.end()
    }

    let file = path.join(distDir, pathname)
    if (!file.startsWith(distDir)) { res.writeHead(400); return res.end() }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(301, { Location: pathname + '/' + url.search })
        return res.end()
      }
      file = path.join(file, 'index.html')
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] })
      return fs.createReadStream(path.join(distDir, '404.html')).pipe(res)
    }
    const headers = { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' }
    if (/^\/app\/(sw\.js|index\.html|manifest\.webmanifest)?$/.test(pathname)) headers['Cache-Control'] = 'no-cache'
    res.writeHead(200, headers)
    fs.createReadStream(file).pipe(res)
  })

  server.listen(port, () => console.log(`▶ Vorschau: http://localhost:${port}/  (App: http://localhost:${port}/app/)`))
  return server
}
