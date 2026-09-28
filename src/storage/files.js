import { QuotaError } from './errors.js'

/**
 * Comic-PDFs liegen als Dateien im Origin Private File System (OPFS):
 * app-eigener Ordner, keine Berechtigung nötig, unabhängig vom Original
 * (z. B. im Downloads-Ordner). Gelesen wird per getFile() — ein
 * disk-gestütztes File, das nicht komplett in den RAM geladen wird.
 */

const DIR_NAME = 'comics'

let worker = null
let nextId = 0
const pending = new Map()

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../workers/opfs-writer.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }) => {
      const entry = pending.get(data.id)
      if (!entry) return
      pending.delete(data.id)
      if (data.ok) {
        entry.resolve(data.size)
      } else if (data.name === 'QuotaExceededError') {
        entry.reject(new QuotaError())
      } else {
        const err = new Error(data.message || 'Datei konnte nicht gespeichert werden.')
        err.name = data.name || 'Error'
        entry.reject(err)
      }
    }
  }
  return worker
}

function createFileName() {
  const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${id}.pdf`
}

async function getDir() {
  const root = await navigator.storage.getDirectory()
  return root.getDirectoryHandle(DIR_NAME, { create: true })
}

/**
 * Kopiert ein File oder einen ArrayBuffer ins OPFS.
 * Gibt { fileName, size } zurück. Wirft QuotaError bei vollem Speicher.
 * Ein ArrayBuffer wird an den Worker übertragen (danach detached).
 */
export async function saveComicFile(source) {
  const fileName = createFileName()
  const id = nextId++
  const transfer = source instanceof ArrayBuffer ? [source] : []
  try {
    const size = await new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
      getWorker().postMessage({ id, fileName, source }, transfer)
    })
    return { fileName, size }
  } catch (err) {
    await deleteComicFile(fileName)
    throw err
  }
}

/**
 * Liefert die gespeicherte Datei als File (lazy, nicht im RAM).
 */
export async function getComicFile(fileName) {
  const dir = await getDir()
  const handle = await dir.getFileHandle(fileName)
  return handle.getFile()
}

/**
 * Löscht eine gespeicherte Datei. Fehlt sie bereits, passiert nichts.
 */
export async function deleteComicFile(fileName) {
  if (!fileName) return
  try {
    const dir = await getDir()
    await dir.removeEntry(fileName)
  } catch {}
}

/**
 * Bittet den Browser, den Speicher nicht automatisch zu räumen.
 */
export async function requestPersistence() {
  try {
    if (await navigator.storage?.persisted?.()) return
    await navigator.storage?.persist?.()
  } catch {}
}
