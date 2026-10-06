// Symbole für den Umschalter iOS/Android (Abschnitt „Als App auf den Home-Bildschirm“).
// Füllung in currentColor, damit sie im aktiven (roten) und inaktiven Button passen. Deko: aria-hidden.

const svg = (body) => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="currentColor">${body}</svg>`

export const PLATFORM_ICONS = {
  ios: svg('<path d="M16.5 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.8zM14.2 5.8c.6-.8 1.1-1.8 1-2.8-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.3z"/>'),
  // Android-Kopf mit Antennen, Augen ausgespart
  android: svg('<path fill-rule="evenodd" d="M3.5 18a8.5 8.5 0 0 1 17 0ZM7.6 14.2a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0-2.2 0ZM14.2 14.2a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0-2.2 0Z"/><path d="M7.2 10.2 5.4 7.2M16.8 10.2l1.8-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
}
