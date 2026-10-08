/**
 * Übergabe von der Landing Page: Das Drop-Feld dort (site/templates/layout.mjs, DROP_SCRIPT)
 * legt die gewählte PDF in dieser eigenen IndexedDB ab und öffnet die App mit ?import=1.
 * Gleiche Origin, daher hat die App Zugriff. Die Datei wird nach dem Lesen gelöscht.
 */
const DB_NAME = 'panelzoom-handoff'
const STORE = 'files'
const KEY = 'pending'

/** true, wenn die App mit ?import=1 geöffnet wurde. Entfernt den Parameter aus der URL. */
export function consumeImportParam() {
  const url = new URL(location.href)
  if (!url.searchParams.has('import')) return false
  url.searchParams.delete('import')
  history.replaceState(history.state, '', url)
  return true
}

/** Liefert die übergebene PDF als File (oder null) und räumt die Übergabe-Datenbank auf. */
export async function takeHandoffFile() {
  if (!window.indexedDB) return null
  try {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const entry = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const get = store.get(KEY)
      store.delete(KEY)
      tx.oncomplete = () => resolve(get.result)
      tx.onerror = tx.onabort = () => reject(tx.error)
    })
    db.close()
    indexedDB.deleteDatabase(DB_NAME)
    if (!entry?.blob) return null
    return entry.blob instanceof File ? entry.blob : new File([entry.blob], entry.name || 'comic.pdf', { type: 'application/pdf' })
  } catch (err) {
    console.error('Übergabe von der Startseite fehlgeschlagen:', err)
    return null
  }
}
