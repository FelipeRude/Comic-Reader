import { loadPdf, loadPdfFromFile, renderPageToCanvas } from '../pdf-loader.js'

/** Seitenquelle für PDF (pdf.js). `source` ist ein File (Range-Zugriff) oder ein ArrayBuffer. */
export async function openPdfSource(source) {
  const pdf = source instanceof Blob ? await loadPdfFromFile(source) : await loadPdf(source)
  return {
    format: 'pdf',
    numPages: pdf.numPages,
    info: null,
    title: null,
    renderPage: (pageNumber, maxWidth) => renderPageToCanvas(pdf, pageNumber, maxWidth),
    // Vorschlag aus /ViewerPreferences /Direction
    async getSuggestedDirection() {
      const prefs = await pdf.getViewerPreferences().catch(() => null)
      return prefs?.Direction === 'R2L' ? 'rtl' : prefs?.Direction === 'L2R' ? 'ltr' : null
    },
    destroy: () => pdf.destroy(),
  }
}
