import { openDB } from 'idb'

const DB_NAME = 'comic-reader-db'
const DB_VERSION = 2

let dbPromise = null

/**
 * Liefert die geteilte IndexedDB-Verbindung (Singleton).
 * Beim ersten Aufruf wird das Schema angelegt:
 *   - comics:   { id (auto), title, blob, coverDataUrl, pageCount, addedAt }
 *   - progress: { comicId (keyPath), pageIndex, panelIndex, updatedAt }
 */
export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // v2: Panels werden live im Reader erkannt → alter Panel-Speicher entfällt.
        if (db.objectStoreNames.contains('panels')) {
          db.deleteObjectStore('panels')
        }

        if (!db.objectStoreNames.contains('comics')) {
          db.createObjectStore('comics', {
            keyPath: 'id',
            autoIncrement: true,
          })
        }

        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'comicId' })
        }
      },
    })
  }
  return dbPromise
}
