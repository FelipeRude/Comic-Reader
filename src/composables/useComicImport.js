import { ref } from 'vue'
import { openPageSource, generateCover, detectFormat, ArchiveError } from '../sources/index.js'
import { addComic } from '../storage/comics.js'
import { saveComicFile, getComicFile, deleteComicFile, requestPersistence, createFileName } from '../storage/files.js'
import { QuotaError } from '../storage/errors.js'

const EXTENSIONS = /\.(pdf|cbz|cbr|cb7|cbt|zip|rar|7z|tar)$/i

/**
 * Legt die Datei im OPFS ab. PDF, ZIP und TAR werden 1:1 kopiert (gestückelt, nie komplett
 * im RAM). RAR und 7z werden einmalig in ein TAR umgewandelt, damit der Reader sie ohne
 * WebAssembly seitenweise lesen kann.
 */
async function storeComicFile(file, format) {
  if (format === 'rar' || format === '7z') {
    const fileName = createFileName('cbt')
    try {
      const { convertArchiveToTar } = await import('../sources/archive-convert.js')
      const { size } = await convertArchiveToTar(file, fileName)
      return { fileName, size }
    } catch (err) {
      await deleteComicFile(fileName)
      throw err
    }
  }
  const ext = { pdf: 'pdf', zip: 'cbz', tar: 'cbt' }[format]
  return saveComicFile(file, ext)
}

/**
 * Kapselt den Import-Flow: Datei → Kopie im OPFS → Cover + Metadaten → IndexedDB.
 * Unterstützt PDF und Comic-Archive (CBZ, CBR, CB7, CBT).
 * Reaktiver State für UI: importing, quotaError, error.
 */
export function useComicImport() {
  const importing = ref(false)
  const quotaError = ref(false)
  const error = ref(null)

  /**
   * Importiert eine einzelne Datei. Gibt die neue Comic-id zurück
   * oder null, falls ein Fehler auftrat (State entsprechend gesetzt).
   */
  async function importFile(file) {
    if (!file) return null
    importing.value = true
    quotaError.value = false
    error.value = null

    let fileName = null
    let source = null
    try {
      const format = await detectFormat(file)
      if (!format) throw new ArchiveError('unsupported')

      requestPersistence()
      let saved = await storeComicFile(file, format)
      fileName = saved.fileName
      try {
        source = await openPageSource(await getComicFile(fileName))
      } catch (err) {
        // ZIP mit Kompression, die nur libarchive kennt (z. B. Deflate64, LZMA) → umwandeln
        if (!(err instanceof ArchiveError && err.code === 'method')) throw err
        await deleteComicFile(fileName)
        fileName = null
        saved = await storeComicFile(file, 'rar')
        fileName = saved.fileName
        source = await openPageSource(await getComicFile(fileName))
      }

      const pageCount = source.numPages
      const coverDataUrl = await generateCover(source)
      const title = source.title || file.name.replace(EXTENSIONS, '')
      const info = source.info

      return await addComic({
        title,
        fileName,
        size: saved.size,
        coverDataUrl,
        pageCount,
        format: source.format,
        series: info?.series ?? null,
        number: info?.number ?? null,
        volume: info?.volume ?? null,
      })
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
      source?.destroy()
      importing.value = false
    }
  }

  return { importing, quotaError, error, importFile }
}
