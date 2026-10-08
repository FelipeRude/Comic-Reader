import { esc } from '../util.mjs'

// Videos, gerendert im Remotion-Projekt ClaudeMotion, Dateien in site/public/media/<name>.webm|mp4|webp,
// 960×1200 = doppelte Anzeigegröße. Das Standbild liegt unter dem Video: Poster beim Laden und
// alleinige Ansicht bei reduzierter Bewegung (site.scss blendet das Video dann aus).

/** Video mit Standbild. label: übersetzte Kurzbeschreibung (Alt-Text des Standbilds). */
export function renderVideo(name, label, className) {
  const src = (ext) => `/media/${name}.${ext}`
  return `<div class="comic-video ${className}">
            <img src="${src('webp')}" width="480" height="600" alt="${esc(label)}" loading="${className === 'hero-video' ? 'eager' : 'lazy'}">
            <video width="480" height="600" autoplay muted loop playsinline disablepictureinpicture aria-hidden="true">
              <source src="${src('webm')}" type="video/webm">
              <source src="${src('mp4')}" type="video/mp4">
            </video>
          </div>`
}
