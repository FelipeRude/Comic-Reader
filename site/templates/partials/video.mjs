import { esc } from '../util.mjs'

// Videos, gerendert im Remotion-Projekt ClaudeMotion, Dateien in site/public/media/<name>.webm|mp4|webp,
// 960×1200 = doppelte Anzeigegröße. Das Standbild liegt unter dem Video: Poster beim Laden und
// alleinige Ansicht bei reduzierter Bewegung (site.scss blendet das Video dann aus).

/**
 * Video mit Standbild. label: übersetzte Kurzbeschreibung (Alt-Text des Standbilds).
 * Nur das Hero-Video spielt sofort. Die übrigen laden nichts vorab (preload="none") und starten
 * erst, wenn sie ins Bild kommen (VIDEO_SCRIPT in layout.mjs); ohne Skript bleibt das Standbild.
 */
export function renderVideo(name, label, className) {
  const src = (ext) => `/media/${name}.${ext}`
  const isHero = className === 'hero-video'
  return `<div class="comic-video ${className}">
            <img src="${src('webp')}" width="480" height="600" alt="${esc(label)}" ${isHero ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'}>
            <video width="480" height="600" ${isHero ? 'autoplay' : 'preload="none" data-lazy-video'} muted loop playsinline disablepictureinpicture aria-hidden="true">
              <source src="${src('webm')}" type="video/webm">
              <source src="${src('mp4')}" type="video/mp4">
            </video>
          </div>`
}
