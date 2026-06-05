import { ref } from 'vue'
import { loadPdf, generateCover } from '../pdf-loader.js'
import { addComic } from '../storage/comics.js'
import { QuotaError } from '../storage/errors.js'

/**
 * Kapselt den Import-Flow: PDF-Datei → Cover + Metadaten → IndexedDB.
 * Reaktiver State für UI: importing, quotaError, error.
 */
export function useComicImport() {
  const importing = ref(false)
  const quotaError = ref(false)
  const error = ref(null)

  /**
   * Importiert eine einzelne PDF-Datei. Gibt die neue Comic-id zurück
   * oder null, falls ein Fehler auftrat (State entsprechend gesetzt).
   */
  async function importFile(file) {
    if (!file) return null
    importing.value = true
    quotaError.value = false
    error.value = null

    try {
      // ArrayBuffer einmal lesen und speichern (File/Blob direkt in IndexedDB
      // schlägt auf iOS/WebKit mit "Error preparing Blob/File data" fehl).
      // PDF.js bekommt eine Kopie, da es den Buffer sonst detached.
      const buffer = await file.arrayBuffer()
      const pdf = await loadPdf(buffer.slice(0))
      const pageCount = pdf.numPages
      const coverDataUrl = await generateCover(pdf)
      const title = file.name.replace(/\.pdf$/i, '')

      const id = await addComic({ title, blob: buffer, coverDataUrl, pageCount })
      pdf.destroy()
      return id
    } catch (err) {
      if (err instanceof QuotaError) {
        quotaError.value = true
      } else {
        error.value = err
        console.error('Import fehlgeschlagen:', err)
      }
      return null
    } finally {
      importing.value = false
    }
  }

  return { importing, quotaError, error, importFile }
}
