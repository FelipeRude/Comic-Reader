import { ref } from 'vue'

// Modul-Level: Listener früh registrieren, damit das Event nicht verpasst wird.
const deferredPrompt = ref(null)
const canInstall = ref(false)

window.addEventListener('beforeinstallprompt', (e) => {
  // Standard-Mini-Infobar unterdrücken → eigener Button im Dashboard.
  e.preventDefault()
  deferredPrompt.value = e
  canInstall.value = true
})

window.addEventListener('appinstalled', () => {
  deferredPrompt.value = null
  canInstall.value = false
})

/**
 * Android/Chrome Install-Prompt. Auf iOS feuert `beforeinstallprompt` nicht
 * (dort: "Zum Home-Bildschirm" über das Teilen-Menü) → `canInstall` bleibt false.
 */
export function useInstallPrompt() {
  async function promptInstall() {
    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    await deferredPrompt.value.userChoice
    deferredPrompt.value = null
    canInstall.value = false
  }

  return { canInstall, promptInstall }
}
