const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escapen für Text und Attributwerte. */
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c])

/** Wie esc, zusätzlich **fett** → <strong>fett</strong>. */
export const escInline = (value) => esc(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

/** Datum (YYYY-MM-DD) lokalisiert ausgeben. */
export const formatDate = (iso, hreflang) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(hreflang, { day: 'numeric', month: 'long', year: 'numeric' })
