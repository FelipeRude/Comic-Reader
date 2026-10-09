// Gemeinsame Content-Security-Policy für .htaccess (generate.mjs) und Service-Worker-Cache (vite.config.js).

// Content-Security-Policy: nur eigene Quellen, keine fremden Server (passt zum Datenschutz-Versprechen).
// blob:/data: für Bilder, weil pdf.js und die Panel-Erkennung Seiten als Blob/Canvas weiterreichen.
// 'wasm-unsafe-eval': pdf.js entpackt JPEG-2000-Bilder (häufig in gescannten Comics) per WebAssembly.
// Ohne den Zusatz scheitert jedes solche Bild still → komplett weiße Seiten und Cover.
// Erlaubt nur WebAssembly, kein eval() für JavaScript.
// Auf develop im Report-Only-Modus geprüft (Landing, Sprachwechsel, Import, Panel-Erkennung, SW-Cache): keine Verstöße.
// Ändert sich die CSP, lädt der Service Worker alle Dateien neu (vite.config.js,
// manifestTransforms) – sonst behalten gecachte Dateien die alten Header.
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ')
