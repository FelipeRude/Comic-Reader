// Illustrationen der Highlight-Boxen (site/content/<code>/landing.json → highlights.items[].icon).
// Comic-Stil wie das Logo: rote Flächen, Kontur in Textfarbe (currentColor), Papier in --bg.
// Farben kommen aus site.scss (.hl-paper, .hl-red).
// Reine Deko: aria-hidden, kein Alt-Text.

const svg = (body) => `<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`

export const HIGHLIGHT_ICONS = {
  // Comicseite mit Lesezeichen
  bookmark: svg('<rect class="hl-paper" x="9" y="7" width="40" height="51"/><path d="M9 26H49M28 7V26M9 42H49M23 42V58"/><path class="hl-red" d="M37 3V25L43.5 19.5L50 25V3Z"/>'),
  // Handy mit Schloss
  lock: svg('<rect class="hl-paper" x="14" y="4" width="36" height="56" rx="6"/><path d="M26 30V24a6 6 0 0 1 12 0v6"/><rect class="hl-red" x="21" y="30" width="22" height="17" rx="2"/><path d="M32 36V41"/><path d="M28 54H36"/>'),
  // Tablet und Handy
  devices: svg('<rect class="hl-paper" x="4" y="9" width="40" height="44" rx="4"/><rect class="hl-red" x="10" y="15" width="28" height="32"/><rect class="hl-paper" x="36" y="22" width="24" height="38" rx="4"/><rect class="hl-red" x="41" y="28" width="14" height="22"/><path d="M45 55H51"/>'),
}
