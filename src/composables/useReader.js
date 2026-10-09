import { ref, shallowRef, computed } from 'vue'
import { loadPdf, loadPdfFromFile, renderPageToCanvas } from '../pdf-loader.js'
import { getComic, setComicDirection } from '../storage/comics.js'
import { getComicFile } from '../storage/files.js'
import { detectPanels } from '../panel-detector.js'
import { getProgress, saveProgress } from '../storage/progress.js'
import { useSettings } from './useSettings.js'

const RENDER_MAX_WIDTH = 2000
const WHOLE_PAGE = [{ x: 0, y: 0, w: 1, h: 1 }]

// Lesereihenfolge: oben→unten, innerhalb einer Zeile links→rechts (Comic)
// bzw. rechts→links (Manga).
function orderPanels(panels, direction) {
  const dir = direction === 'rtl' ? -1 : 1
  return [...panels].sort((a, b) => (a.y - b.y) || dir * (a.x - b.x))
}

export function useReader(comicId, viewport) {
  const { effectivePadLeft, effectivePadTop, effectivePadRight, effectivePadBottom } = useSettings()
  const comic = ref(null)

  // 3-Canvas-Cache: vorherige, aktuelle und nächste Seite gleichzeitig vorgerendert.
  const prevCanvas = shallowRef(null)
  const pageCanvas = shallowRef(null)  // aktuelle Seite
  const nextCanvas = shallowRef(null)

  const currentPage = ref(0)
  const currentPanelIndex = ref(0)
  const totalPages = ref(0)
  const loading = ref(true)
  const transitioning = ref(false)  // nur noch für init / jumpToPage

  // Live erkannte Panels pro Seite – nur für diese Lesesitzung im Speicher.
  const pagesPanels = ref([])
  const manual = ref(null)

  // 'ltr' | 'rtl' — null, solange der Nutzer beim ersten Öffnen noch nicht gewählt hat.
  const direction = ref(null)
  // Vorschlag aus den PDF-Metadaten (/ViewerPreferences /Direction), sonst null.
  const suggestedDirection = ref(null)

  let pdf = null

  const currentPanels = computed(() => getPagePanels(currentPage.value))
  const currentPanel = computed(
    () => currentPanels.value[currentPanelIndex.value] || currentPanels.value[0]
  )

  const transformNumbers = computed(() => {
    if (manual.value) return manual.value

    const canvas = pageCanvas.value
    if (!canvas) return { scale: 1, tx: 0, ty: 0 }

    const cW = canvas.width
    const cH = canvas.height
    const vW = viewport.w
    const vH = viewport.h
    const p = currentPanel.value

    const px = p.x * cW
    const py = p.y * cH
    const pw = p.w * cW
    const ph = p.h * cH

    const pl = vW * (effectivePadLeft.value   / 100)
    const pr = vW * (effectivePadRight.value  / 100)
    const pt = vH * (effectivePadTop.value    / 100)
    const pb = vH * (effectivePadBottom.value / 100)

    const availW = vW - pl - pr
    const availH = vH - pt - pb

    const scale = Math.min(availW / pw, availH / ph)
    const tx = pl + availW / 2 - (px + pw / 2) * scale
    const ty = pt + availH / 2 - (py + ph / 2) * scale
    return { scale, tx, ty }
  })

  const zoomTransform = computed(() => {
    const { scale, tx, ty } = transformNumbers.value
    return `translate(${tx}px, ${ty}px) scale(${scale})`
  })

  function releaseCanvas(c) {
    if (c) c.width = 0
  }

  // Rendert eine Seite und erkennt direkt darauf die Panels. Das Canvas wird
  // erst zurückgegeben, wenn die Panels feststehen (wichtig für Seitenwechsel).
  async function renderPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= totalPages.value) return null
    const canvas = await renderPageToCanvas(pdf, pageIndex + 1, RENDER_MAX_WIDTH)
    if (!pagesPanels.value[pageIndex]) {
      pagesPanels.value[pageIndex] = await detectPanels(canvas)
    }
    return canvas
  }

  function persist() {
    saveProgress(comicId, currentPage.value, currentPanelIndex.value)
  }

  // Nur innerhalb einer Seite — Seitenwechsel läuft über commitNextPage/commitPrevPage.
  function nextPanel() {
    manual.value = null
    currentPanelIndex.value++
    persist()
  }

  function prevPanel() {
    manual.value = null
    currentPanelIndex.value--
    persist()
  }

  // Wird von der View nach der Strip-Animation aufgerufen.
  async function commitNextPage() {
    manual.value = null
    releaseCanvas(prevCanvas.value)
    prevCanvas.value = pageCanvas.value
    pageCanvas.value = nextCanvas.value   // bereits vorgerendert (oder null als Fallback)
    nextCanvas.value = null
    currentPage.value++
    currentPanelIndex.value = 0
    persist()

    if (!pageCanvas.value) {
      // Fallback: nächste Seite war noch nicht fertig gerendert
      transitioning.value = true
      pageCanvas.value = await renderPage(currentPage.value)
      transitioning.value = false
    }

    // Neue übernächste Seite im Hintergrund vorrendern
    const newNextIdx = currentPage.value + 1
    if (newNextIdx < totalPages.value) {
      renderPage(newNextIdx).then(c => {
        releaseCanvas(nextCanvas.value)
        nextCanvas.value = c
      })
    }
  }

  async function commitPrevPage() {
    manual.value = null
    releaseCanvas(nextCanvas.value)
    nextCanvas.value = pageCanvas.value
    pageCanvas.value = prevCanvas.value   // bereits vorgerendert (oder null als Fallback)
    prevCanvas.value = null
    currentPage.value--
    currentPanelIndex.value = (pagesPanels.value[currentPage.value]?.length || 1) - 1
    persist()

    if (!pageCanvas.value) {
      transitioning.value = true
      pageCanvas.value = await renderPage(currentPage.value)
      currentPanelIndex.value = (pagesPanels.value[currentPage.value]?.length || 1) - 1
      persist()
      transitioning.value = false
    }

    // Neue vorvorherige Seite im Hintergrund vorrendern
    const newPrevIdx = currentPage.value - 1
    if (newPrevIdx >= 0) {
      renderPage(newPrevIdx).then(c => {
        releaseCanvas(prevCanvas.value)
        prevCanvas.value = c
      })
    }
  }

  function setManual(t) {
    manual.value = t
  }

  async function jumpToPage(pageIndex) {
    manual.value = null
    transitioning.value = true

    releaseCanvas(prevCanvas.value)
    releaseCanvas(pageCanvas.value)
    releaseCanvas(nextCanvas.value)
    prevCanvas.value = null
    nextCanvas.value = null

    currentPage.value = pageIndex
    currentPanelIndex.value = 0
    pageCanvas.value = await renderPage(pageIndex)
    persist()
    transitioning.value = false

    // Nachbarn im Hintergrund vorrendern
    Promise.all([
      renderPage(pageIndex - 1),
      renderPage(pageIndex + 1),
    ]).then(([p, n]) => {
      releaseCanvas(prevCanvas.value)
      releaseCanvas(nextCanvas.value)
      prevCanvas.value = p
      nextCanvas.value = n
    })
  }

  async function init() {
    comic.value = await getComic(comicId)
    // Fallback: Migration ins OPFS ist für diesen Comic noch nicht gelungen.
    pdf = comic.value.fileName
      ? await loadPdfFromFile(await getComicFile(comic.value.fileName))
      : await loadPdf(comic.value.blob)
    totalPages.value = pdf.numPages
    direction.value = comic.value.direction ?? null
    if (!direction.value) {
      const prefs = await pdf.getViewerPreferences().catch(() => null)
      suggestedDirection.value = prefs?.Direction === 'R2L' ? 'rtl' : prefs?.Direction === 'L2R' ? 'ltr' : null
    }

    pagesPanels.value = []

    const prog = await getProgress(comicId)
    currentPage.value = Math.min(prog?.pageIndex ?? 0, totalPages.value - 1)
    currentPanelIndex.value = prog?.panelIndex ?? 0

    pageCanvas.value = await renderPage(currentPage.value)

    if (currentPanelIndex.value >= currentPanels.value.length) {
      currentPanelIndex.value = 0
    }
    loading.value = false

    // Nachbarn im Hintergrund vorrendern
    Promise.all([
      renderPage(currentPage.value - 1),
      renderPage(currentPage.value + 1),
    ]).then(([p, n]) => {
      prevCanvas.value = p
      nextCanvas.value = n
    })
  }

  function getPagePanels(pageIdx) {
    const panels = pagesPanels.value[pageIdx]
    return panels ? orderPanels(panels, direction.value) : WHOLE_PAGE
  }

  // Beim Umschalten bleibt das gerade gezeigte Panel aktiv, nur sein Index ändert sich.
  async function setDirection(value) {
    const dir = value === 'rtl' ? 'rtl' : 'ltr'
    const active = currentPanel.value
    direction.value = dir
    const idx = currentPanels.value.indexOf(active)
    if (idx >= 0) currentPanelIndex.value = idx
    persist()
    await setComicDirection(comicId, dir)
  }

  function destroy() {
    releaseCanvas(prevCanvas.value)
    releaseCanvas(pageCanvas.value)
    releaseCanvas(nextCanvas.value)
    prevCanvas.value = null
    pageCanvas.value = null
    nextCanvas.value = null
    if (pdf) {
      pdf.destroy()
      pdf = null
    }
  }

  return {
    comic,
    prevCanvas,
    pageCanvas,
    nextCanvas,
    currentPage,
    currentPanelIndex,
    currentPanels,
    currentPanel,
    totalPages,
    loading,
    transitioning,
    manual,
    transformNumbers,
    zoomTransform,
    nextPanel,
    prevPanel,
    commitNextPage,
    commitPrevPage,
    setManual,
    jumpToPage,
    getPagePanels,
    direction,
    suggestedDirection,
    setDirection,
    init,
    destroy,
  }
}
