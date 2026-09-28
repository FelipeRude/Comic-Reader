import * as pdfjsLib from 'pdfjs-dist'

// Worker liegt als statisches Asset in public/ (siehe Masterplan / vite.config PWA-Cache).
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

// Klein halten: PDF.js liest beim Öffnen alle Seitenobjekte, die über die
// ganze Datei verteilt liegen — pro Objekt wird nur ein Chunk geladen.
const RANGE_CHUNK_SIZE = 64 * 1024

/**
 * Öffnet ein PDF aus einem Blob oder ArrayBuffer und liefert das PDFDocumentProxy.
 * Die Seitenzahl steht danach unter `pdf.numPages`.
 * Hinweis: PDF.js übernimmt (detached) den ArrayBuffer — wer den Buffer
 * weiterverwenden will, muss eine Kopie übergeben (siehe useComicImport).
 */
export async function loadPdf(source) {
  const data = source instanceof Blob ? await source.arrayBuffer() : source
  return pdfjsLib.getDocument({ data }).promise
}

/**
 * Öffnet ein PDF aus einem (disk-gestützten) File, ohne es komplett in den
 * RAM zu laden: PDF.js fordert per Range-Transport nur die Byte-Bereiche an,
 * die es für die jeweils gerenderten Seiten braucht.
 */
export async function loadPdfFromFile(file) {
  // Erster Chunk vorab (enthält den PDF-Header). Kleine Dateien liest PDF.js
  // ohnehin am Stück → dann komplette Datei mitgeben und als fertig markieren.
  const initialSize = file.size <= 2 * RANGE_CHUNK_SIZE ? file.size : RANGE_CHUNK_SIZE
  const initialData = new Uint8Array(await file.slice(0, initialSize).arrayBuffer())
  const complete = initialSize === file.size
  const transport = new pdfjsLib.PDFDataRangeTransport(file.size, initialData, complete)
  transport.requestDataRange = async (begin, end) => {
    try {
      const buf = await file.slice(begin, end).arrayBuffer()
      transport.onDataRange(begin, new Uint8Array(buf))
    } catch (err) {
      console.error('PDF-Bereich konnte nicht gelesen werden:', err)
    }
  }
  return pdfjsLib.getDocument({
    range: transport,
    length: file.size,
    rangeChunkSize: RANGE_CHUNK_SIZE,
    disableAutoFetch: true,
    disableStream: true,
  }).promise
}

/**
 * Rendert eine Seite (1-basiert) skaliert auf ein Canvas mit maximaler Breite.
 * Gibt das Canvas zurück. Aufrufer ist für das Aufräumen verantwortlich
 * (Canvas-Referenz nullen — wichtig fürs Chunking in Phase 4).
 */
export async function renderPageToCanvas(pdf, pageNumber, maxWidth) {
  const page = await pdf.getPage(pageNumber)
  const baseViewport = page.getViewport({ scale: 1 })
  const scale = maxWidth ? maxWidth / baseViewport.width : 1
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext('2d')

  await page.render({ canvasContext: ctx, viewport }).promise
  page.cleanup()
  return canvas
}

/**
 * Erzeugt aus Seite 1 ein Cover als JPEG-DataURL (Standard max. 300px Breite).
 */
export async function generateCover(pdf, maxWidth = 300) {
  const canvas = await renderPageToCanvas(pdf, 1, maxWidth)
  return canvas.toDataURL('image/jpeg', 0.8)
}
