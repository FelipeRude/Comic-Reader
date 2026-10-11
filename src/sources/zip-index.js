import { inflateSync } from 'fflate'
import { ArchiveError, normalizePath } from './archive-utils.js'

/**
 * ZIP (CBZ) mit wahlfreiem Zugriff: Nur das Inhaltsverzeichnis am Dateiende wird
 * gelesen, jede Seite später einzeln per file.slice() — das Archiv liegt nie komplett im RAM.
 */

const EOCD_SIG = 0x06054b50
const ZIP64_LOCATOR_SIG = 0x07064b50
const ZIP64_EOCD_SIG = 0x06064b50
const CENTRAL_SIG = 0x02014b50
const LOCAL_SIG = 0x04034b50

const METHOD_STORE = 0
const METHOD_DEFLATE = 8

const utf8 = new TextDecoder('utf-8')

async function readBytes(file, start, end) {
  return new Uint8Array(await file.slice(start, end).arrayBuffer())
}

function u64(view, offset) {
  return view.getUint32(offset, true) + view.getUint32(offset + 4, true) * 2 ** 32
}

/**
 * Liest das Inhaltsverzeichnis. Liefert [{ path, size, compSize, method, localOffset, encrypted }].
 * Wirft ArchiveError('corrupt'), wenn kein gültiges ZIP gefunden wird.
 */
export async function readZipIndex(file) {
  // End of Central Directory: 22 Bytes + bis zu 64 KB Kommentar am Dateiende
  const tailStart = Math.max(0, file.size - (22 + 0xffff))
  const tail = await readBytes(file, tailStart, file.size)
  const tailView = new DataView(tail.buffer)
  let eocd = -1
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tailView.getUint32(i, true) === EOCD_SIG) { eocd = i; break }
  }
  if (eocd < 0) throw new ArchiveError('corrupt', 'ZIP: Inhaltsverzeichnis fehlt')

  let count = tailView.getUint16(eocd + 10, true)
  let cdSize = tailView.getUint32(eocd + 12, true)
  let cdOffset = tailView.getUint32(eocd + 16, true)

  // ZIP64 (große Archive, viele Einträge)
  if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
    const loc = eocd - 20
    if (loc < 0 || tailView.getUint32(loc, true) !== ZIP64_LOCATOR_SIG) {
      throw new ArchiveError('corrupt', 'ZIP64-Verweis fehlt')
    }
    const z64Offset = u64(tailView, loc + 8)
    const z64 = new DataView((await readBytes(file, z64Offset, z64Offset + 56)).buffer)
    if (z64.getUint32(0, true) !== ZIP64_EOCD_SIG) throw new ArchiveError('corrupt', 'ZIP64-Ende fehlt')
    count = u64(z64, 32)
    cdSize = u64(z64, 40)
    cdOffset = u64(z64, 48)
  }

  if (cdOffset + cdSize > file.size) throw new ArchiveError('corrupt', 'ZIP ist unvollständig')
  const cd = await readBytes(file, cdOffset, cdOffset + cdSize)
  const view = new DataView(cd.buffer)
  const entries = []
  let p = 0
  for (let n = 0; n < count; n++) {
    if (p + 46 > cd.length || view.getUint32(p, true) !== CENTRAL_SIG) {
      throw new ArchiveError('corrupt', 'ZIP-Eintrag beschädigt')
    }
    const flags = view.getUint16(p + 8, true)
    const method = view.getUint16(p + 10, true)
    let compSize = view.getUint32(p + 20, true)
    let size = view.getUint32(p + 24, true)
    const nameLen = view.getUint16(p + 28, true)
    const extraLen = view.getUint16(p + 30, true)
    const commentLen = view.getUint16(p + 32, true)
    let localOffset = view.getUint32(p + 42, true)
    const path = normalizePath(utf8.decode(cd.subarray(p + 46, p + 46 + nameLen)))

    // ZIP64-Zusatzfeld: enthält nur die Werte, die oben 0xFFFFFFFF sind (in dieser Reihenfolge)
    let x = p + 46 + nameLen
    const extraEnd = x + extraLen
    while (x + 4 <= extraEnd) {
      const id = view.getUint16(x, true)
      const len = view.getUint16(x + 2, true)
      if (id === 0x0001) {
        let q = x + 4
        if (size === 0xffffffff) { size = u64(view, q); q += 8 }
        if (compSize === 0xffffffff) { compSize = u64(view, q); q += 8 }
        if (localOffset === 0xffffffff) { localOffset = u64(view, q) }
      }
      x += 4 + len
    }

    entries.push({ path, size, compSize, method, localOffset, encrypted: (flags & 1) === 1 })
    p = extraEnd + commentLen
  }
  return entries
}

/** true, wenn die eigene Leseroutine den Eintrag entpacken kann (sonst Umweg über libarchive). */
export function isZipEntrySupported(entry) {
  return entry.method === METHOD_STORE || entry.method === METHOD_DEFLATE
}

/**
 * Liefert die Daten eines Eintrags als Blob. Gespeicherte Bilder (der Normalfall bei CBZ)
 * bleiben ein Ausschnitt der Datei auf der Platte, nur Deflate wird im Speicher entpackt.
 */
export async function readZipEntry(file, entry, type) {
  const local = new DataView((await readBytes(file, entry.localOffset, entry.localOffset + 30)).buffer)
  if (local.byteLength < 30 || local.getUint32(0, true) !== LOCAL_SIG) {
    throw new ArchiveError('corrupt', 'ZIP-Eintrag beschädigt')
  }
  const start = entry.localOffset + 30 + local.getUint16(26, true) + local.getUint16(28, true)
  const end = start + entry.compSize
  if (end > file.size) throw new ArchiveError('corrupt', 'ZIP ist unvollständig')
  if (entry.method === METHOD_STORE) return file.slice(start, end, type)
  const data = inflateSync(await readBytes(file, start, end), { out: new Uint8Array(entry.size) })
  return new Blob([data], { type })
}
