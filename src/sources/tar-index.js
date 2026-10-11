import { ArchiveError, normalizePath } from './archive-utils.js'

/**
 * TAR (CBT, und die beim Import aus CBR/CB7 erzeugten Dateien): unkomprimiert,
 * daher reicht pro Eintrag ein 512-Byte-Kopf. Daten werden per file.slice() gelesen.
 * Unterstützt ustar, GNU-Langnamen (L) und pax-Pfade (x).
 */

const BLOCK = 512
const latin = new TextDecoder('latin1')
const utf8 = new TextDecoder('utf-8')

function str(block, from, len, decoder = utf8) {
  const bytes = block.subarray(from, from + len)
  const end = bytes.indexOf(0)
  return decoder.decode(end < 0 ? bytes : bytes.subarray(0, end))
}

function octal(block, from, len) {
  // GNU-Base-256 für Größen über 8 GB
  if (block[from] & 0x80) {
    let n = 0
    for (let i = from + 1; i < from + len; i++) n = n * 256 + block[i]
    return n
  }
  const text = latin.decode(block.subarray(from, from + len)).replace(/[\0 ]+/g, ' ').trim()
  return text ? parseInt(text, 8) : 0
}

function parsePax(text) {
  const out = {}
  for (const line of text.split('\n')) {
    const m = /^\d+ ([^=]+)=(.*)$/.exec(line)
    if (m) out[m[1]] = m[2]
  }
  return out
}

/** Liefert [{ path, size, offset }] für alle regulären Dateien. */
export async function readTarIndex(file) {
  const entries = []
  let pos = 0
  let longName = null
  let pax = null
  while (pos + BLOCK <= file.size) {
    const block = new Uint8Array(await file.slice(pos, pos + BLOCK).arrayBuffer())
    if (block.every((b) => b === 0)) break  // Ende-Markierung
    const type = String.fromCharCode(block[156] || 48)
    // pax kann die Größe des folgenden Eintrags überschreiben (> 8 GB)
    const size = type !== 'x' && type !== 'L' && pax?.size ? Number(pax.size) : octal(block, 124, 12)
    const dataStart = pos + BLOCK
    if (!Number.isFinite(size) || dataStart + size > file.size) {
      throw new ArchiveError('corrupt', 'TAR ist unvollständig')
    }

    if (type === 'L' || type === 'x') {
      const text = utf8.decode(new Uint8Array(await file.slice(dataStart, dataStart + size).arrayBuffer()))
      if (type === 'L') longName = text.replace(/\0+$/, '')
      else pax = parsePax(text)
    } else {
      if (type === '0' || type === '7') {
        let name = str(block, 0, 100)
        const prefix = latin.decode(block.subarray(257, 262)) === 'ustar' ? str(block, 345, 155) : ''
        if (prefix) name = `${prefix}/${name}`
        name = pax?.path ?? longName ?? name
        entries.push({ path: normalizePath(name), size, offset: dataStart })
      }
      longName = null
      pax = null
    }
    pos = dataStart + Math.ceil(size / BLOCK) * BLOCK
  }
  if (!entries.length && pos === 0) throw new ArchiveError('corrupt', 'TAR ist leer oder beschädigt')
  return entries
}
