import { esc } from '../util.mjs'

// Videos in einer hellen und einer dunklen Fassung, gerendert im Remotion-Projekt ClaudeMotion
// (Kompositionen PanelZoomHero/PanelZoomDetect), Dateien in site/public/media/<name>-light|dark.*,
// 960×1200 = doppelte Anzeigegröße. Das Standbild liegt unter dem Video: Poster beim Laden und
// alleinige Ansicht bei reduzierter Bewegung (site.scss blendet das Video dann aus).
// <source media> wählt beim Laden; LANG_SCRIPT in layout.mjs wechselt bei späterem Farbwechsel.

const DARK = '(prefers-color-scheme: dark)'

/** Video mit Standbild. label: übersetzte Kurzbeschreibung (Alt-Text des Standbilds). */
export function renderThemedVideo(name, label, className) {
  const src = (theme, ext) => `/media/${name}-${theme}.${ext}`
  return `<div class="themed-video ${className}">
            <picture>
              <source srcset="${src('dark', 'webp')}" media="${DARK}">
              <img src="${src('light', 'webp')}" width="480" height="600" alt="${esc(label)}" loading="${className === 'hero-video' ? 'eager' : 'lazy'}">
            </picture>
            <video width="480" height="600" autoplay muted loop playsinline disablepictureinpicture aria-hidden="true">
              <source src="${src('dark', 'webm')}" type="video/webm" media="${DARK}">
              <source src="${src('dark', 'mp4')}" type="video/mp4" media="${DARK}">
              <source src="${src('light', 'webm')}" type="video/webm">
              <source src="${src('light', 'mp4')}" type="video/mp4">
            </video>
          </div>`
}
