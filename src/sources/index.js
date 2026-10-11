import { ArchiveError, detectFormat } from './archive-utils.js'
import { openPdfSource } from './pdf-source.js'

/**
 * Seitenquellen: PDF und Comic-Archive liefern dieselbe Schnittstelle
 *   { format, numPages, title, info, renderPage(n, maxWidth) → Canvas,
 *     getSuggestedDirection() → 'ltr'|'rtl'|null, destroy() }
 * Seiten sind wie bei pdf.js 1-basiert. Die Archiv-Module werden erst bei Bedarf geladen.
 */
export async function openPageSource(file) {
  const format = await detectFormat(file)
  if (format === 'pdf') return openPdfSource(file)
  if (format === 'zip' || format === 'tar') {
    const { openArchiveSource } = await import('./archive-source.js')
    return openArchiveSource(file, format)
  }
  // RAR/7z liegen nie direkt im Speicher, sie werden beim Import nach TAR umgewandelt.
  throw new ArchiveError('unsupported')
}

/** Cover als JPEG-DataURL aus Seite 1 (Standard max. 300px Breite). */
export async function generateCover(source, maxWidth = 300) {
  const canvas = await source.renderPage(1, maxWidth)
  const url = canvas.toDataURL('image/jpeg', 0.8)
  canvas.width = 0
  return url
}

export { ArchiveError, detectFormat, openPdfSource }
