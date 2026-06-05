/**
 * Spezifischer Fehlertyp für vollen Browser-Speicher.
 * Wird von Schreiboperationen (addComic, savePanels) geworfen,
 * damit die UI-Schicht ein gezieltes Modal anzeigen kann.
 */
export class QuotaError extends Error {
  constructor(message = 'Nicht genügend Speicherplatz im Browser verfügbar.') {
    super(message)
    this.name = 'QuotaError'
  }
}

/**
 * Führt eine async-Schreiboperation aus und übersetzt einen nativen
 * QuotaExceededError (als DOMException) in einen QuotaError.
 * Andere Fehler werden unverändert weitergereicht.
 */
export async function wrapQuota(fn) {
  try {
    return await fn()
  } catch (err) {
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014
    if (isQuota) {
      throw new QuotaError()
    }
    throw err
  }
}
