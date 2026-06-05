import { getDB } from './db.js'
import { wrapQuota } from './errors.js'

/**
 * Speichert einen neuen Comic. Erwartet bereits aufbereitete Daten.
 * `blob` ist ein ArrayBuffer (nicht File/Blob — siehe iOS/WebKit-Bug in
 * useComicImport); kann via loadPdf() direkt wieder geöffnet werden.
 * Gibt die neue auto-generierte id zurück. Wirft QuotaError bei vollem Speicher.
 */
export function addComic({ title, blob, coverDataUrl, pageCount }) {
  return wrapQuota(async () => {
    const db = await getDB()
    return db.add('comics', {
      title,
      blob,
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
 * Löscht einen Comic per id. Panels und Fortschritt werden separat
 * über panels.js / progress.js entfernt (siehe Masterplan Phase 3.4).
 */
export async function deleteComic(id) {
  const db = await getDB()
  return db.delete('comics', id)
}
