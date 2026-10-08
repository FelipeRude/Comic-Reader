// Abstrakte Comic-Symbole für das Banner „Kein Account · Offline · Kostenlos“
// (site/content/<code>/landing.json → trust.items[].icon). Stil wie die Highlight-Icons:
// rote Flächen, Kontur in Textfarbe. Reine Deko: aria-hidden, kein Alt-Text.

const svg = (body) => `<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`

export const TRUST_ICONS = {
  // Comic-Augenmaske: anonym, kein Konto
  mask: svg('<path class="hl-red" d="M4 18q10-5 20 1q10-6 20-1q1 13-9 15q-6 1-11-5q-5 6-11 5q-10-2-9-15Z"/><path class="hl-paper" d="M11 22q4-3 8 1q-3 4-8-1ZM37 22q-4-3-8 1q3 4 8-1Z"/>'),
  // Sprechblase mit Zickzack statt Funkwellen: kein Netz nötig
  offline: svg('<path class="hl-paper" d="M6 9H42V33H22L12 42V33H6Z"/><path class="hl-red" d="M14 26L20 15L26 24L32 13L36 20" fill="none"/>'),
  // Comic-Explosion: gratis
  burst: svg('<path class="hl-red" d="M24 3L28 15L40 8L34 20L46 24L34 28L40 40L28 33L24 45L20 33L8 40L14 28L2 24L14 20L8 8L20 15Z"/><circle class="hl-paper" cx="24" cy="24" r="6"/>'),
}
