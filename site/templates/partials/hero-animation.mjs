import { esc } from '../util.mjs'

// Hero-Animation: Handy mit Comic-Seite, Panel-Erkennung, Tipp, Kamerafahrt von Panel zu Panel.
// Animiert wird alles in site.scss (Abschnitt "Hero-Animation"), dort stehen auch die
// Kamera-Werte. Sie werden aus denselben Panel-Koordinaten berechnet wie PANELS hier.
//
// Koordinaten: Bildschirm 180×300, die Seite (170×255) liegt bei (5, 22.5) darauf.

const PANELS = [
  [8, 8, 98, 96],     // 1 oben links: Landschaft
  [112, 8, 50, 96],   // 2 oben rechts, schmal: Figur mit Sprechblase
  [8, 110, 60, 137],  // 3 unten links, hoch: Baum
  [74, 110, 88, 137], // 4 unten rechts: zwei Figuren im Gespräch
]

// Bildinhalte der Panels, nur einfache Formen, keine lesbaren Texte
const ART = `<rect class="pz-tint" x="8" y="8" width="98" height="96"/>
<circle class="pz-paper" cx="82" cy="32" r="10"/>
<path class="pz-line" d="M24 26l4 3 4-3M38 20l3 2 3-2"/>
<path class="pz-paper" d="M8 74q22-20 44-6t54-6v42H8z"/>
<path class="pz-ink" d="M8 92q30-12 58-2t40-4v18H8z"/>
<ellipse class="pz-paper" cx="137" cy="27" rx="19" ry="11"/>
<path class="pz-paper" d="M132 37l1 10 6-10"/>
<path class="pz-bar" d="M127 24h20M130 30h12"/>
<circle class="pz-ink" cx="137" cy="60" r="7"/>
<path class="pz-ink" d="M125 104q1-34 12-36 11 2 12 36z"/>
<rect class="pz-tint" x="8" y="225" width="60" height="22"/>
<circle class="pz-paper" cx="54" cy="127" r="6"/>
<rect class="pz-ink" x="34" y="182" width="8" height="43"/>
<circle class="pz-tint" cx="25" cy="174" r="11"/>
<circle class="pz-tint" cx="51" cy="174" r="11"/>
<circle class="pz-tint" cx="38" cy="160" r="18"/>
<path class="pz-line" d="M74 222h88"/>
<ellipse class="pz-paper" cx="100" cy="146" rx="20" ry="12"/>
<path class="pz-paper" d="M96 157l-1 14 8-14"/>
<path class="pz-bar" d="M88 143h24M92 150h14"/>
<ellipse class="pz-paper" cx="142" cy="126" rx="15" ry="9"/>
<path class="pz-paper" d="M143 134l3 12 2-12"/>
<path class="pz-bar" d="M134 126h16"/>
<circle class="pz-ink" cx="98" cy="192" r="8"/>
<path class="pz-ink" d="M85 247q1-41 13-44 12 3 13 44z"/>
<circle class="pz-ink" cx="141" cy="182" r="9"/>
<path class="pz-ink" d="M126 247q1-50 15-54 14 4 15 54z"/>`

const panelRects = PANELS.map(([x, y, w, h]) => `<rect class="pz-panel" x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('')

// Erkennungsrahmen: 3 Einheiten außen um das Panel, pathLength="1" fürs Nachzeichnen per stroke-dashoffset
const frames = PANELS.map(([x, y, w, h], i) => {
  const o = 3
  return `<path class="pz-det pz-det--${i + 1}" d="M${x - o} ${y - o}h${w + 2 * o}v${h + 2 * o}h${-(w + 2 * o)}z" pathLength="1" vector-effect="non-scaling-stroke"/>`
}).join('')

/** Inline-SVG der Hero-Animation. label: übersetzte Kurzbeschreibung für Screenreader. */
export function renderHeroAnimation(label) {
  return `<svg class="hero-anim" viewBox="0 0 212 372" width="212" height="372" role="img" aria-label="${esc(label)}">
            <rect class="pz-shadow" x="8" y="8" width="200" height="360" rx="22"/>
            <rect class="pz-body" x="4" y="4" width="200" height="360" rx="22"/>
            <rect class="pz-detail" x="88" y="17" width="32" height="5" rx="2.5"/>
            <rect class="pz-detail" x="82" y="346" width="44" height="4" rx="2"/>
            <rect class="pz-screen" x="14" y="34" width="180" height="300" rx="3"/>
            <svg x="14" y="34" width="180" height="300" viewBox="0 0 180 300">
              <g class="pz-cam">
                <g transform="translate(5 22.5)">
                  <rect class="pz-paper" width="170" height="255"/>
                  <g class="pz-page">${panelRects}
${ART}</g>
                  ${frames}
                </g>
              </g>
              <circle class="pz-tap" cx="160" cy="150" r="12"/>
            </svg>
          </svg>`
}
