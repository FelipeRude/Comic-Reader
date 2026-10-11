import { ArchiveError } from './archive-utils.js'
import { QuotaError } from '../storage/errors.js'

/**
 * Wandelt ein RAR-/7z-Archiv im Worker (libarchive, WebAssembly) in ein TAR im OPFS um.
 * Pro Umwandlung ein eigener Worker, der danach beendet wird → WASM-Speicher wird frei.
 * Liefert { size, pages }. Wirft ArchiveError (code 'encrypted' | 'corrupt' | 'empty' |
 * 'offline' | 'tooLarge') oder QuotaError.
 */
export function convertArchiveToTar(file, fileName) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/archive-convert.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }) => {
      worker.terminate()
      if (data.ok) resolve({ size: data.size, pages: data.pages })
      else if (data.name === 'QuotaExceededError') reject(new QuotaError())
      else reject(new ArchiveError(data.code || 'corrupt', data.message))
    }
    // Worker-Skript nicht ladbar (offline, noch nicht im Cache)
    worker.onerror = (e) => {
      e.preventDefault?.()
      worker.terminate()
      reject(new ArchiveError(navigator.onLine === false ? 'offline' : 'corrupt', e.message || 'Worker-Fehler'))
    }
    worker.postMessage({ file, fileName })
  })
}
