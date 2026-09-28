/**
 * Schreibt Comic-PDFs ins Origin Private File System (OPFS).
 * Läuft im Worker, weil createSyncAccessHandle nur hier verfügbar ist —
 * das asynchrone createWritable fehlt auf älteren iOS-Versionen.
 * Quelle ist ein File (Import, wird gestückelt gelesen → nie komplett im RAM)
 * oder ein ArrayBuffer (Migration aus IndexedDB).
 */

const DIR_NAME = 'comics'
const CHUNK_SIZE = 4 * 1024 * 1024

self.onmessage = async ({ data: { id, fileName, source } }) => {
  let access = null
  try {
    const root = await navigator.storage.getDirectory()
    const dir = await root.getDirectoryHandle(DIR_NAME, { create: true })
    const handle = await dir.getFileHandle(fileName, { create: true })
    access = await handle.createSyncAccessHandle()
    await access.truncate(0)

    const size = source.size ?? source.byteLength
    let offset = 0
    while (offset < size) {
      const chunk = source instanceof ArrayBuffer
        ? new Uint8Array(source, offset, Math.min(CHUNK_SIZE, size - offset))
        : new Uint8Array(await source.slice(offset, offset + CHUNK_SIZE).arrayBuffer())
      const written = access.write(chunk, { at: offset })
      // Safari meldet vollen Speicher teils nur über zu wenig geschriebene Bytes.
      if (written < chunk.byteLength) {
        throw new DOMException('Nicht genügend Speicher', 'QuotaExceededError')
      }
      offset += chunk.byteLength
    }

    await access.flush()
    self.postMessage({ id, ok: true, size })
  } catch (err) {
    self.postMessage({ id, ok: false, name: err?.name, message: err?.message })
  } finally {
    try { await access?.close() } catch {}
  }
}
