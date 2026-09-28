import { registerSW } from 'virtual:pwa-register'

// Wie oft bei offener App nach Updates gesucht wird.
const CHECK_INTERVAL_MS = 30 * 60 * 1000

/**
 * Registriert den Service Worker mit erzwungenem Update:
 * - autoUpdate: neuer SW übernimmt sofort, die Seite lädt automatisch neu
 * - Update-Check bei jedem Zurückholen der App (iOS beendet PWAs beim
 *   „Schließen“ oft nicht, sondern pausiert sie nur) und periodisch
 */
export function setupPwa() {
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return

      async function checkForUpdate() {
        if (registration.installing || !navigator.onLine) return
        try {
          // Offline/Serverfehler → kein update() (würde sonst fehlschlagen)
          const res = await fetch(swUrl, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } })
          if (res.status === 200) await registration.update()
        } catch {}
      }

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate()
      })
      setInterval(checkForUpdate, CHECK_INTERVAL_MS)
    },
  })
}
