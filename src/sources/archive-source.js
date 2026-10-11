import {
  ArchiveError, selectPages, imageType, parseComicInfo, titleFromComicInfo, directionFromComicInfo,
} from './archive-utils.js'
import { readZipIndex, readZipEntry, isZipEntrySupported } from './zip-index.js'
import { readTarIndex } from './tar-index.js'
import { blobToCanvas, placeholderCanvas } from './image-decode.js'

/**
 * Seitenquelle für ZIP- und TAR-Archive auf einem (disk-gestützten) File.
 * Gelesen wird pro Seite nur der Ausschnitt des Bildes.
 * Wirft ArchiveError: 'corrupt' | 'empty' | 'encrypted' | 'method' (ZIP mit Kompression,
 * die nur libarchive kann → useComicImport wandelt dann um).
 */
export async function openArchiveSource(file, format) {
  let entries
  let read
  if (format === 'zip') {
    entries = await readZipIndex(file)
    read = (entry, type) => readZipEntry(file, entry, type)
  } else {
    entries = await readTarIndex(file)
    read = async (entry, type) => file.slice(entry.offset, entry.offset + entry.size, type)
  }

  const { pages, comicInfo } = selectPages(entries)
  if (format === 'zip') {
    if (pages.some((p) => p.encrypted)) throw new ArchiveError('encrypted')
    if (!pages.every(isZipEntrySupported)) throw new ArchiveError('method')
  }

  let info = null
  if (comicInfo && !comicInfo.encrypted && (format !== 'zip' || isZipEntrySupported(comicInfo))) {
    try {
      info = parseComicInfo(await (await read(comicInfo, 'text/xml')).text())
    } catch (err) {
      console.warn('ComicInfo.xml nicht lesbar:', err)
    }
  }

  async function renderPage(pageNumber, maxWidth) {
    const entry = pages[pageNumber - 1]
    try {
      return await blobToCanvas(await read(entry, imageType(entry.path)), maxWidth)
    } catch (err) {
      console.error(`Seite ${pageNumber} (${entry.path}) nicht lesbar:`, err)
      return placeholderCanvas(maxWidth)
    }
  }

  return {
    format,
    numPages: pages.length,
    info,
    title: titleFromComicInfo(info),
    renderPage,
    async getSuggestedDirection() {
      return directionFromComicInfo(info)
    },
    destroy() {},
  }
}
