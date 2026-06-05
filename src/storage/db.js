import { openDB } from 'idb'

const DB_NAME = 'comic-reader-db'
const DB_VERSION = 1

let dbPromise = null

/**
 * Liefert die geteilte IndexedDB-Verbindung (Singleton).
 * Beim ersten Aufruf wird das Schema angelegt:
 *   - comics:   { id (auto), title, blob, coverDataUrl, pageCount, addedAt }
 *   - panels:   { id (auto), comicId, pageIndex, panels: [{x,y,w,h}] }, Index: comicId
 *   - progress: { comicId (keyPath), pageIndex, panelIndex, updatedAt }
 */
export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('comics')) {
          db.createObjectStore('comics', {
            keyPath: 'id',
            autoIncrement: true,
          })
        }

        if (!db.objectStoreNames.contains('panels')) {
          const panelStore = db.createObjectStore('panels', {
            keyPath: 'id',
            autoIncrement: true,
          })
          panelStore.createIndex('comicId', 'comicId')
        }

        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'comicId' })
        }
      },
    })
  }
  return dbPromise
}
