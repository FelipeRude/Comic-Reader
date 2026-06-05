import { createApp } from 'vue'
import App from './App.vue'
import { getDB } from './storage/db.js'
import './styles/main.scss'

// IndexedDB-Schema beim App-Start anlegen (Stores werden so in DevTools sichtbar).
getDB()

// iOS: Viewport-Zoom nach Rotation zurücksetzen (iOS ignoriert user-scalable bei Rotation).
const _metaViewport = document.querySelector('meta[name="viewport"]')
if (_metaViewport) {
  window.addEventListener('orientationchange', () => {
    const orig = _metaViewport.content
    _metaViewport.content = orig + ', maximum-scale=1'
    requestAnimationFrame(() => { _metaViewport.content = orig })
  })
}

createApp(App).mount('#app')
