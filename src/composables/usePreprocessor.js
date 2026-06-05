import { ref } from 'vue'
import { loadPdf, renderPageToCanvas } from '../pdf-loader.js'
import { savePanels } from '../storage/panels.js'
import { QuotaError } from '../storage/errors.js'
import { useSettings } from './useSettings.js'

// Analyse-Auflösung: Balance zwischen Gutter-Genauigkeit und RAM/Zeit auf Mobilgeräten.
const ANALYSIS_MAX_WIDTH = 1500

/**
 * Orchestriert die sequenzielle Panel-Analyse eines Comics.
 * Reaktiver State für das ProcessingOverlay: current, total, running, totalPanels.
 */
export function usePreprocessor() {
  const current = ref(0)
  const total = ref(0)
  const totalPanels = ref(0)
  const running = ref(false)
  const quotaError = ref(false)
  const error = ref(null)

  const { minGutterPx, minPanelRatioW, minPanelRatioH } = useSettings()

  let worker = null

  function analyze(imageData, pageIndex) {
    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => resolve(e.data.panels)
      worker.onerror = (e) => reject(e)
      worker.postMessage(
        { imageData, pageIndex, minGutterPx: minGutterPx.value, minPanelRatioW: minPanelRatioW.value, minPanelRatioH: minPanelRatioH.value },
        [imageData.data.buffer],
      )
    })
  }

  /**
   * Analysiert alle Seiten strikt sequenziell und persistiert die Panels.
   * Gibt true bei Erfolg, false bei Abbruch (z.B. QuotaError) zurück.
   */
  async function process(comic) {
    running.value = true
    current.value = 0
    totalPanels.value = 0
    quotaError.value = false
    error.value = null

    worker = new Worker(new URL('../workers/detector.worker.js', import.meta.url), {
      type: 'module',
    })

    let pdf = null
    try {
      pdf = await loadPdf(comic.blob)
      total.value = pdf.numPages

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        current.value = pageNum

        // 1. Seite rendern
        let canvas = await renderPageToCanvas(pdf, pageNum, ANALYSIS_MAX_WIDTH)
        let ctx = canvas.getContext('2d')
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // 2. Analyse im Worker (Buffer wird transferiert)
        const panels = await analyze(imageData, pageNum - 1)

        // 3. Persistieren (pageIndex 0-basiert)
        await savePanels(comic.id, pageNum - 1, panels)
        totalPanels.value += panels.length

        // 4. Referenzen freigeben → GC begünstigen (Chunking-Vorgabe)
        canvas.width = 0
        canvas.height = 0
        canvas = null
        ctx = null
        imageData = null
      }
      return true
    } catch (err) {
      if (err instanceof QuotaError) {
        quotaError.value = true
      } else {
        error.value = err
        console.error('Pre-Processing fehlgeschlagen:', err)
      }
      return false
    } finally {
      if (pdf) pdf.destroy()
      if (worker) {
        worker.terminate()
        worker = null
      }
      running.value = false
    }
  }

  return { current, total, totalPanels, running, quotaError, error, process }
}
