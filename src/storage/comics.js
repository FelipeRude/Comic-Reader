import { getDB } from './db.js'
import { wrapQuota } from './errors.js'
import { saveComicFile, deleteComicFile } from './files.js'

/**
 * Speichert die Metadaten eines neuen Comics. Das PDF selbst liegt
 * bereits als Datei im OPFS (siehe files.js), hier nur `fileName`.
 * Gibt die neue auto-generierte id zurück. Wirft QuotaError bei vollem Speicher.
 */
export function addComic({ title, fileName, size, coverDataUrl, pageCount }) {
  return wrapQuota(async () => {
    const db = await getDB()
    return db.add('comics', {
      title,
      fileName,
      size,
      coverDataUrl,
      pageCount,
      addedAt: Date.now(),
    })
  })
}

/**
 * Liefert alle Comics, neueste zuerst (nach addedAt absteigend).
 */
export async function getAllComics() {
  const db = await getDB()
  const comics = await db.getAll('comics')
  return comics.sort((a, b) => b.addedAt - a.addedAt)
}

/**
 * Liefert einen einzelnen Comic per id (oder undefined).
 */
export async function getComic(id) {
  const db = await getDB()
  return db.get('comics', id)
}

/**
 * Speichert die Leserichtung eines Comics: 'ltr' (Comic) oder 'rtl' (Manga).
 */
export async function setComicDirection(id, direction) {
  const db = await getDB()
  const comic = await db.get('comics', id)
  if (!comic) return
  await db.put('comics', { ...comic, direction })
}

/**
 * Löscht einen Comic samt PDF-Datei. Der Fortschritt wird separat
 * über progress.js entfernt.
 */
export async function deleteComic(id) {
  const db = await getDB()
  const comic = await db.get('comics', id)
  await db.delete('comics', id)
  await deleteComicFile(comic?.fileName)
}

/**
 * Migration: Ältere Versionen speicherten das PDF als ArrayBuffer (`blob`)
 * im Record — getAll() lud so alle PDFs in den RAM. Verschiebt die PDFs
 * einzeln ins OPFS, damit nie mehr als eins gleichzeitig im Speicher liegt.
 * Schlägt ein Comic fehl, bleibt er unverändert und wird beim nächsten
 * Start erneut versucht.
 */
export async function migrateBlobsToOpfs() {
  const db = await getDB()
  const keys = await db.getAllKeys('comics')
  let migrated = 0
  for (const key of keys) {
    let comic = await db.get('comics', key)
    if (!comic?.blob) continue
    try {
      const { fileName, size } = await saveComicFile(comic.blob)
      const { blob, ...rest } = comic
      comic = null
      await db.put('comics', { ...rest, fileName, size })
      migrated++
    } catch (err) {
      console.error(`Migration von Comic ${key} fehlgeschlagen:`, err)
    }
  }
  return migrated
}

