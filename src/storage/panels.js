import { getDB } from './db.js'
import { wrapQuota } from './errors.js'

/**
 * Speichert (oder aktualisiert) die Panel-Koordinaten einer Seite.
 * Idempotent: existiert bereits ein Eintrag für (comicId, pageIndex),
 * wird er überschrieben statt dupliziert.
 * Wirft QuotaError, wenn der Speicher voll ist.
 */
export function savePanels(comicId, pageIndex, panels) {
  return wrapQuota(async () => {
    const db = await getDB()
    const tx = db.transaction('panels', 'readwrite')
    const index = tx.store.index('comicId')

    let existingId
    for (let cursor = await index.openCursor(comicId); cursor; cursor = await cursor.continue()) {
      if (cursor.value.pageIndex === pageIndex) {
        existingId = cursor.value.id
        break
      }
    }

    const record = { comicId, pageIndex, panels }
    if (existingId !== undefined) record.id = existingId

    const id = await tx.store.put(record)
    await tx.done
    return id
  })
}

/**
 * Liefert die Panels einer einzelnen Seite (oder undefined).
 */
export async function getPanels(comicId, pageIndex) {
  const db = await getDB()
  const all = await db.getAllFromIndex('panels', 'comicId', comicId)
  return all.find((entry) => entry.pageIndex === pageIndex)
}

/**
 * Liefert alle Panel-Einträge eines Comics, nach pageIndex sortiert.
 */
export async function getAllPanelsForComic(comicId) {
  const db = await getDB()
  const all = await db.getAllFromIndex('panels', 'comicId', comicId)
  return all.sort((a, b) => a.pageIndex - b.pageIndex)
}

/**
 * Löscht alle Panel-Einträge eines Comics (per comicId-Index-Cursor).
 */
export async function deletePanelsForComic(comicId) {
  const db = await getDB()
  const tx = db.transaction('panels', 'readwrite')
  const index = tx.store.index('comicId')
  for (let cursor = await index.openCursor(comicId); cursor; cursor = await cursor.continue()) {
    await cursor.delete()
  }
  await tx.done
}
