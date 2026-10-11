/**
 * Gemeinsame Helfer für Comic-Archive (CBZ/CBR/CB7/CBT): Formaterkennung,
 * Auswahl und Sortierung der Seitenbilder, ComicInfo.xml, Fehlertyp.
 */

/** Fehler beim Öffnen eines Archivs. code: 'empty' | 'encrypted' | 'corrupt' | 'unsupported' | 'offline' */
export class ArchiveError extends Error {
  constructor(code, message = code) {
    super(message)
    this.name = 'ArchiveError'
    this.code = code
  }
}

/**
 * Erkennt das Format an den ersten Bytes, nicht an der Endung
 * (als .cbr benannte ZIP-Dateien sind häufig).
 * Liefert 'pdf' | 'zip' | 'rar' | '7z' | 'tar' | null.
 */
export async function detectFormat(file) {
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer())
  const ascii = (from, len) => String.fromCharCode(...head.subarray(from, from + len))
  // PDF-Header darf laut Spezifikation in den ersten 1024 Bytes stehen, praktisch fast immer am Anfang
  if (ascii(0, 1024).includes('%PDF-')) return 'pdf'
  if (head[0] === 0x50 && head[1] === 0x4b && (head[2] === 3 || head[2] === 5 || head[2] === 7)) return 'zip'
  if (ascii(0, 7) === 'Rar!\x1a\x07\x00' || ascii(0, 8) === 'Rar!\x1a\x07\x01\x00') return 'rar'
  if (head[0] === 0x37 && head[1] === 0x7a && head[2] === 0xbc && head[3] === 0xaf && head[4] === 0x27 && head[5] === 0x1c) return '7z'
  if (ascii(257, 5) === 'ustar') return 'tar'
  // Alte V7-Tar-Dateien ohne Kennung: Prüfsumme des ersten Kopfblocks stimmt
  if (head.length >= 512 && tarChecksumOk(head.subarray(0, 512))) return 'tar'
  return null
}

function tarChecksumOk(block) {
  const stored = parseInt(String.fromCharCode(...block.subarray(148, 156)).replace(/[^0-7]/g, ''), 8)
  if (!Number.isFinite(stored)) return false
  let sum = 0
  for (let i = 0; i < 512; i++) sum += i >= 148 && i < 156 ? 32 : block[i]
  return sum === stored && block[0] !== 0
}

const IMAGE_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  bmp: 'image/bmp',
}

/** MIME-Typ eines Seitenbilds anhand der Endung, sonst null (= keine Seite). */
export function imageType(path) {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
  return IMAGE_TYPES[ext] ?? null
}

/** Systemdateien (macOS-Ressourcen, versteckte Dateien) gehören nicht zum Comic. */
export function isJunkPath(path) {
  const parts = path.split('/')
  const base = parts[parts.length - 1]
  return parts.includes('__MACOSX') || base.startsWith('.') || base.toLowerCase() === 'thumbs.db'
}

export function isComicInfo(path) {
  return path.split('/').pop().toLowerCase() === 'comicinfo.xml'
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** Natürliche Sortierung pro Pfadabschnitt: 2.jpg vor 10.jpg, „Kapitel 2/“ vor „Kapitel 10/“. */
export function comparePaths(a, b) {
  const pa = a.split('/')
  const pb = b.split('/')
  for (let i = 0; i < Math.min(pa.length, pb.length); i++) {
    const c = collator.compare(pa[i], pb[i]) || (pa[i] < pb[i] ? -1 : pa[i] > pb[i] ? 1 : 0)
    if (c) return c
  }
  return pa.length - pb.length
}

/**
 * Wählt aus allen Einträgen die Seitenbilder (natürlich sortiert) und die ComicInfo.xml
 * (die flachste, falls mehrere). Wirft ArchiveError('empty'), wenn kein Bild enthalten ist.
 */
export function selectPages(entries) {
  const files = entries.filter((e) => e.path && !e.path.endsWith('/') && !isJunkPath(e.path))
  const pages = files
    .filter((e) => imageType(e.path) && e.size > 0)
    .sort((a, b) => comparePaths(a.path, b.path))
  if (!pages.length) throw new ArchiveError('empty')
  const comicInfo = files
    .filter((e) => isComicInfo(e.path))
    .sort((a, b) => a.path.split('/').length - b.path.split('/').length)[0] ?? null
  return { pages, comicInfo }
}

/** Normalisiert Pfade aus Archiven (Backslashes, führendes ./ oder /). */
export function normalizePath(path) {
  return path.replace(/\\/g, '/').replace(/^(\.\/|\/)+/, '')
}

/**
 * Liest die wichtigsten Felder aus einer ComicInfo.xml (ComicRack-Schema).
 * Liefert { title, series, number, volume, manga } – fehlende Felder sind null.
 */
export function parseComicInfo(xmlText) {
  try {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml')
    if (doc.querySelector('parsererror')) return null
    const root = doc.documentElement
    const field = (name) => {
      const el = [...root.children].find((c) => c.localName.toLowerCase() === name.toLowerCase())
      const text = el?.textContent?.trim()
      return text || null
    }
    return {
      title: field('Title'),
      series: field('Series'),
      number: field('Number'),
      volume: field('Volume'),
      manga: field('Manga'),
    }
  } catch {
    return null
  }
}

/** Titel für die Bibliothek: „Serie #Nummer: Titel“, sonst Titel, sonst null. */
export function titleFromComicInfo(info) {
  if (!info) return null
  if (info.series) {
    let title = info.series
    if (info.number) title += ` #${info.number}`
    if (info.title && info.title !== info.series) title += `: ${info.title}`
    return title
  }
  return info.title
}

/** Leserichtung aus ComicInfo.xml: Manga="YesAndRightToLeft" → 'rtl'. */
export function directionFromComicInfo(info) {
  return info?.manga?.toLowerCase() === 'yesandrighttoleft' ? 'rtl' : null
}
