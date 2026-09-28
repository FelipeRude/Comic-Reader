import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// Build-Zeitpunkt, in den Einstellungen sichtbar → zeigt, ob das Update angekommen ist.
const BUILD_TIME = new Date().toLocaleString('de-DE', {
  timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // Registrierung in src/pwa.js (mit Update-Checks)
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mjs}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
      },
      manifest: {
        name: 'COMIC READER',
        short_name: 'COMIC READER',
        description: 'Offline PWA Comic Reader mit Smart-Zoom Panel-Navigation',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        background_color: '#ffffff',
        theme_color: '#1a1a2e',
        icons: [
          {
            src: 'img/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
