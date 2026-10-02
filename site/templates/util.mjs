const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escapen für Text und Attributwerte. */
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c])

/** Datum (YYYY-MM-DD) lokalisiert ausgeben. */
export const formatDate = (iso, hreflang) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(hreflang, { day: 'numeric', month: 'long', year: 'numeric' })
