import { ref, shallowRef, computed } from 'vue'
import { loadPdf, renderPageToCanvas } from '../pdf-loader.js'
import { getComic } from '../storage/comics.js'
import { getAllPanelsForComic } from '../storage/panels.js'
import { getProgress, saveProgress } from '../storage/progress.js'
import { useSettings } from './useSettings.js'

const RENDER_MAX_WIDTH = 2000
const WHOLE_PAGE = [{ x: 0, y: 0, w: 1, h: 1 }]

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

  const pagesPanels = ref([])
  const manual = ref(null)

  let pdf = null

  const currentPanels = computed(
    () => pagesPanels.value[currentPage.value] || WHOLE_PAGE
  )
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

  async function renderPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= totalPages.value) return null
    return renderPageToCanvas(pdf, pageIndex + 1, RENDER_MAX_WIDTH)
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
    pdf = await loadPdf(comic.value.blob)
    totalPages.value = pdf.numPages

    pagesPanels.value = []
    for (const entry of await getAllPanelsForComic(comicId)) {
      pagesPanels.value[entry.pageIndex] = entry.panels
    }

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
    return pagesPanels.value[pageIdx] || WHOLE_PAGE
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
    init,
    destroy,
  }
}
