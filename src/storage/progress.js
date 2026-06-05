import { getDB } from './db.js'

/**
 * Speichert (oder aktualisiert) den Lesestand eines Comics.
 * keyPath ist comicId → put überschreibt automatisch.
 */
export async function saveProgress(comicId, pageIndex, panelIndex) {
  const db = await getDB()
  return db.put('progress', {
    comicId,
    pageIndex,
    panelIndex,
    updatedAt: Date.now(),
  })
}

/**
 * Liefert den Lesestand eines Comics (oder undefined, wenn noch nie gelesen).
 */
export async function getProgress(comicId) {
  const db = await getDB()
  return db.get('progress', comicId)
}

/**
 * Löscht den Lesestand eines Comics.
 */
export async function deleteProgress(comicId) {
  const db = await getDB()
  return db.delete('progress', comicId)
}
