import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { createHash } from 'node:crypto'
import { rmSync } from 'node:fs'
import { CSP } from './scripts/site/csp.mjs'

// Build-Zeitpunkt, in den Einstellungen sichtbar → zeigt, ob das Update angekommen ist.
// Als ISO-String, die App formatiert ihn in der eingestellten Sprache.
const BUILD_TIME = new Date().toISOString()

// Dev-Deploy bekommt eigene (rote) Icons, damit sich beide PWAs am Homescreen unterscheiden
// (DEPLOY_TARGET setzt scripts/deploy.sh). Erzeugt von scripts/generate-icons.mjs.
const IS_DEV_DEPLOY = process.env.DEPLOY_TARGET === 'dev'
const ICON_DIR = IS_DEV_DEPLOY ? 'img/pwa-dev' : 'img/pwa'

// Die App liegt unter /app/, Landing Pages unter /de/ und /en/ (docs/SEO-PLAN.md, 4.6 a).
// Gebaut wird nach dist/app/, scripts/build-site.mjs schreibt danach den Rest von dist/.
const BASE = '/app/'

// Der Service Worker speichert Antworten samt Headern und lädt eine Datei nur neu,
// wenn sich ihr Inhalt ändert. Ohne diese Kennung behielte z. B. pdf.worker.min.mjs
// nach einer CSP-Änderung die alte CSP (WebAssembly blieb so auf iOS blockiert).
const CSP_REV = createHash('sha256').update(CSP).digest('hex').slice(0, 8)

export default defineConfig({
  base: BASE,
  build: {
    outDir: 'dist/app',
    emptyOutDir: true,
  },
  define: {
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
    // Dev-Deploy zeigt auch Sprachen mit status 'draft' (wie die Landing)
    __DEPLOY_DEV__: JSON.stringify(IS_DEV_DEPLOY),
  },
  plugins: [
    vue(),
    {
      name: 'deploy-icon',
      // 'pre': vor Vites eigener Verarbeitung, damit der Pfad danach noch mit BASE versehen wird
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => html.replaceAll('/img/pwa/', `/${ICON_DIR}/`),
      },
    },
    {
      // Live-Build: die Dev-Icons nicht mit ausliefern (img/pwa braucht auch der Dev-Build,
      // DashboardView lädt daraus das Logo)
      name: 'drop-dev-icons',
      apply: 'build',
      closeBundle() {
        if (!IS_DEV_DEPLOY) rmSync('dist/app/img/pwa-dev', { recursive: true, force: true })
      },
    },
    VitePWA({
      scope: BASE,
      registerType: 'autoUpdate',
      injectRegister: false, // Registrierung in src/pwa.js (mit Update-Checks)
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mjs}'],
        globIgnores: IS_DEV_DEPLOY ? [] : ['img/pwa-dev/**'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        // SW-Scope ist ohnehin /app/; die Allowlist stellt zusätzlich sicher,
        // dass Landing Pages nie aus dem App-Cache beantwortet werden.
        navigateFallbackAllowlist: [/^\/app\//],
        // CSP-Kennung an jede Revision hängen → neue CSP = alle Dateien frisch vom Server.
        manifestTransforms: [
          async (entries) => ({
            manifest: entries.map((e) => ({ ...e, revision: `${e.revision ?? ''}-csp${CSP_REV}` })),
            warnings: [],
          }),
        ],
      },
      manifest: {
        id: BASE,
        name: 'PanelZoom',
        short_name: 'PanelZoom',
        description: 'Read PDF comics on your phone, panel by panel. Automatic panel detection, offline, no account.',
        display: 'standalone',
        orientation: 'any',
        start_url: BASE,
        scope: BASE,
        // Splash-Hintergrund = Icon-Hintergrund (Creme), passend zu theme-color in index.html
        background_color: '#FFFEF0',
        theme_color: '#FFFEF0',
        icons: [
          { src: `${ICON_DIR}/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${ICON_DIR}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${ICON_DIR}/maskable-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: `${ICON_DIR}/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
