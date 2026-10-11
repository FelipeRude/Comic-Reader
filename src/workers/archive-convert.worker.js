/**
 * Wandelt RAR (CBR), 7z (CB7) und ZIPs mit exotischer Kompression in ein unkomprimiertes
 * TAR im OPFS um. Danach liest der Reader die Seiten direkt per file.slice() (tar-index.js),
 * ohne WebAssembly — auch offline und ohne das Archiv je wieder zu entpacken.
 *
 * libarchive (WebAssembly) wird erst hier geladen, PDF-/CBZ-Nutzer laden es nie.
 * Speicher: Das Archiv wird stückweise direkt in den WASM-Speicher gelesen (keine
 * zweite Kopie), dann Eintrag für Eintrag entpackt und sofort geschrieben.
 * Der Worker wird nach jeder Umwandlung beendet, damit der WASM-Speicher frei wird.
 */
import libarchive from 'libarchive.js/src/webworker/wasm-gen/libarchive.js'
import { WasmModule } from 'libarchive.js/src/webworker/wasm-module.js'
import { imageType, isComicInfo, isJunkPath, normalizePath } from '../sources/archive-utils.js'

const DIR_NAME = 'comics'
const CHUNK_SIZE = 8 * 1024 * 1024
const BLOCK = 512
const utf8 = new TextEncoder()

class ConvertError extends Error {
  constructor(code, message = code) {
    super(message)
    this.code = code
  }
}

async function loadLibarchive() {
  try {
    const mod = await libarchive(new WasmModule())
    mod.initFunctions()
    return mod
  } catch (err) {
    // Typischer Fall: offline, und libarchive.wasm ist noch nicht im Cache
    throw new ConvertError('offline', String(err?.message ?? err))
  }
}

function writeOctal(block, offset, length, value) {
  const text = value.toString(8).padStart(length - 1, '0')
  for (let i = 0; i < length - 1; i++) block[offset + i] = text.charCodeAt(i)
  block[offset + length - 1] = 0
}

/** ustar-Kopfblock; Namen über 100 Bytes bekommen vorab einen GNU-Langnamen-Eintrag ('L'). */
function tarHeader(nameBytes, size, type = '0') {
  const block = new Uint8Array(BLOCK)
  block.set(nameBytes.subarray(0, 100), 0)
  writeOctal(block, 100, 8, 0o644)
  writeOctal(block, 108, 8, 0)
  writeOctal(block, 116, 8, 0)
  writeOctal(block, 124, 12, size)
  writeOctal(block, 136, 12, 0)
  block[156] = type.charCodeAt(0)
  block.set(utf8.encode('ustar\x0000'), 257)
  block.fill(32, 148, 156)
  let sum = 0
  for (let i = 0; i < BLOCK; i++) sum += block[i]
  writeOctal(block, 148, 7, sum)
  block[155] = 32
  return block
}

function createTarWriter(access) {
  let offset = 0
  const write = (bytes) => {
    const written = access.write(bytes, { at: offset })
    // Safari meldet vollen Speicher teils nur über zu wenig geschriebene Bytes
    if (written < bytes.byteLength) throw new DOMException('Nicht genügend Speicher', 'QuotaExceededError')
    offset += bytes.byteLength
  }
  const pad = (size) => {
    const rest = size % BLOCK
    if (rest) write(new Uint8Array(BLOCK - rest))
  }
  return {
    addFile(path, data) {
      const name = utf8.encode(path)
      if (name.length > 100) {
        write(tarHeader(utf8.encode('././@LongLink'), name.length + 1, 'L'))
        const longName = new Uint8Array(name.length + 1)
        longName.set(name)
        write(longName)
        pad(longName.length)
      }
      write(tarHeader(name, data.byteLength))
      write(data)
      pad(data.byteLength)
    },
    finish() {
      write(new Uint8Array(BLOCK * 2))
      return offset
    },
  }
}

const isEncryptionMessage = (msg) => /encrypt|passphrase|password/i.test(msg || '')

async function convert(file, fileName) {
  const mod = await loadLibarchive()
  const rc = mod.runCode

  const filePtr = rc.malloc(file.size)
  if (!filePtr) throw new ConvertError('tooLarge', 'Archiv passt nicht in den Speicher')
  let archive = 0
  let access = null
  try {
    for (let off = 0; off < file.size; off += CHUNK_SIZE) {
      const chunk = new Uint8Array(await file.slice(off, off + CHUNK_SIZE).arrayBuffer())
      mod.HEAPU8.set(chunk, filePtr + off)  // HEAPU8 erst nach malloc lesen (Speicher kann wachsen)
    }

    const root = await navigator.storage.getDirectory()
    const dir = await root.getDirectoryHandle(DIR_NAME, { create: true })
    const handle = await dir.getFileHandle(fileName, { create: true })
    access = await handle.createSyncAccessHandle()
    await access.truncate(0)
    const tar = createTarWriter(access)

    archive = rc.openArchive(filePtr, file.size, null, 'en_US.UTF-8')
    let pages = 0
    for (;;) {
      const entry = rc.getNextEntry(archive)
      if (!entry) break
      const path = normalizePath(rc.getEntryName(entry) || '')
      const size = rc.getEntrySize(entry)
      const isFile = rc.getEntryType(entry) === 0o100000
      const wanted = isFile && size > 0 && !isJunkPath(path) && (imageType(path) || isComicInfo(path))
      if (!wanted) {
        rc.skipEntry(archive)
        continue
      }
      if (rc.entryIsEncrypted(entry) > 0) throw new ConvertError('encrypted')
      const ptr = rc.getFileData(archive, size)
      if (ptr <= 0) {
        const msg = rc.getError(archive)
        throw new ConvertError(isEncryptionMessage(msg) ? 'encrypted' : 'corrupt', msg || 'Eintrag nicht lesbar')
      }
      const data = mod.HEAPU8.slice(ptr, ptr + size)
      rc.free(ptr)
      tar.addFile(path, data)
      if (imageType(path)) pages++
    }

    // getNextEntry liefert 0 bei Dateiende und bei Fehlern → Fehlertext unterscheidet
    const msg = rc.getError(archive)
    if (msg) throw new ConvertError(isEncryptionMessage(msg) ? 'encrypted' : 'corrupt', msg)
    if (!pages) throw new ConvertError('empty')

    const size = tar.finish()
    await access.flush()
    return { size, pages }
  } finally {
    try { await access?.close() } catch {}
    if (archive) rc.closeArchive(archive)
    rc.free(filePtr)
  }
}

self.onmessage = async ({ data: { file, fileName } }) => {
  try {
    self.postMessage({ ok: true, ...(await convert(file, fileName)) })
  } catch (err) {
    self.postMessage({ ok: false, code: err?.code, name: err?.name, message: err?.message ?? String(err) })
  }
}
