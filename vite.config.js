import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// Build-Zeitpunkt, in den Einstellungen sichtbar → zeigt, ob das Update angekommen ist.
const BUILD_TIME = new Date().toLocaleString('de-DE', {
  timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

// Dev-Deploy bekommt eigene (rote) Icons, damit sich beide PWAs am Homescreen unterscheiden
// (DEPLOY_TARGET setzt scripts/deploy.sh). Erzeugt von scripts/generate-icons.mjs.
const ICON_DIR = process.env.DEPLOY_TARGET === 'dev' ? 'img/pwa-dev' : 'img/pwa'

// Die App liegt unter /app/, Landing Pages unter /de/ und /en/ (docs/SEO-PLAN.md, 4.6 a).
// Gebaut wird nach dist/app/, scripts/build-site.mjs schreibt danach den Rest von dist/.
const BASE = '/app/'

export default defineConfig({
  base: BASE,
  build: {
    outDir: 'dist/app',
    emptyOutDir: true,
  },
  define: {
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
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
    VitePWA({
      scope: BASE,
      registerType: 'autoUpdate',
      injectRegister: false, // Registrierung in src/pwa.js (mit Update-Checks)
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mjs}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        // SW-Scope ist ohnehin /app/; die Allowlist stellt zusätzlich sicher,
        // dass Landing Pages nie aus dem App-Cache beantwortet werden.
        navigateFallbackAllowlist: [/^\/app\//],
      },
      manifest: {
        id: BASE,
        name: 'PanelZoom',
        short_name: 'PanelZoom',
        description: 'Read PDF comics on your phone, panel by panel. Automatic panel detection, offline, no account.',
        display: 'standalone',
        orientation: 'portrait',
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
