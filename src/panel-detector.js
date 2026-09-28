import { useSettings } from './composables/useSettings.js'

// Analyse-Auflösung: Die Erkennungs-Parameter (minGutterPx) sind auf diese Breite abgestimmt.
const ANALYSIS_MAX_WIDTH = 1500
const WHOLE_PAGE = [{ x: 0, y: 0, w: 1, h: 1 }]

let worker = null
let nextId = 0
const pending = new Map()

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./workers/detector.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (e) => {
      const req = pending.get(e.data.id)
      if (!req) return
      pending.delete(e.data.id)
      req.resolve(e.data.panels)
    }
    worker.onerror = (e) => {
      for (const req of pending.values()) req.reject(e)
      pending.clear()
    }
  }
  return worker
}

/**
 * Erkennt die Panels live auf einer bereits gerenderten Seite.
 * Das Canvas wird auf Analyse-Breite verkleinert, die Erkennung läuft im Worker.
 * Liefert normalisierte Rechtecke [{x,y,w,h}] (0–1); bei Fehlern die ganze Seite.
 */
export async function detectPanels(canvas) {
  const { minGutterPx, minPanelRatioW, minPanelRatioH } = useSettings()
  try {
    const scale = Math.min(1, ANALYSIS_MAX_WIDTH / canvas.width)
    const w = Math.round(canvas.width * scale)
    const h = Math.round(canvas.height * scale)
    const tmp = document.createElement('canvas')
    tmp.width = w
    tmp.height = h
    const ctx = tmp.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(canvas, 0, 0, w, h)
    const imageData = ctx.getImageData(0, 0, w, h)
    tmp.width = 0

    const id = nextId++
    return await new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
      getWorker().postMessage(
        {
          id,
          imageData,
          minGutterPx: minGutterPx.value,
          minPanelRatioW: minPanelRatioW.value,
          minPanelRatioH: minPanelRatioH.value,
        },
        [imageData.data.buffer],
      )
    })
  } catch (err) {
    console.error('Panel-Erkennung fehlgeschlagen:', err)
    return WHOLE_PAGE
  }
}
