import { ref } from 'vue'
import { loadPdfFromFile, generateCover } from '../pdf-loader.js'
import { addComic } from '../storage/comics.js'
import { saveComicFile, getComicFile, deleteComicFile, requestPersistence } from '../storage/files.js'
import { QuotaError } from '../storage/errors.js'

/**
 * Kapselt den Import-Flow: PDF-Datei → Kopie im OPFS → Cover + Metadaten → IndexedDB.
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

    let fileName = null
    let pdf = null
    try {
      // Eigene Kopie im OPFS: unabhängig vom Original (Downloads o. ä.)
      // und gestückelt geschrieben → auch 1000+-Seiten-PDFs nie komplett im RAM.
      requestPersistence()
      const saved = await saveComicFile(file)
      fileName = saved.fileName
      pdf = await loadPdfFromFile(await getComicFile(fileName))
      const pageCount = pdf.numPages
      const coverDataUrl = await generateCover(pdf)
      const title = file.name.replace(/\.pdf$/i, '')

      return await addComic({ title, fileName, size: saved.size, coverDataUrl, pageCount })
    } catch (err) {
      await deleteComicFile(fileName)
      if (err instanceof QuotaError) {
        quotaError.value = true
      } else {
        error.value = err
        console.error('Import fehlgeschlagen:', err)
      }
      return null
    } finally {
      pdf?.destroy()
      importing.value = false
    }
  }

  return { importing, quotaError, error, importFile }
}
