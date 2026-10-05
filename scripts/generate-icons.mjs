// Erzeugt alle Icons (PWA, Favicon, Apple-Touch) aus dem Panel-Raster – ohne Abhängigkeiten.
// Aufruf: npm run icons   (Ergebnis wird eingecheckt; nur nach Änderungen am Motiv neu erzeugen)
//
// Das Motiv ist eine Comic-Seite aus vier Panels in einem 1000×1000-Raster. Jede Form ist eine
// Füllfläche aus Rechtecken mit 25 Einheiten Kontur außen herum.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..')

const STROKE = 25
// Favicons werden bis 16 px klein dargestellt; dort wäre die 25er-Kontur unter einem halben Pixel.
// Mit 37,5 berühren sich die Konturen benachbarter Panels und werden zu einer kräftigen Linie.
const FAVICON_STROKE = 37.5
const SHAPES = [
  [[25, 25, 375, 600]],                                 // links, hoch
  [[450, 25, 975, 325], [625, 325, 975, 425]],          // oben rechts, L-Form
  [[625, 575, 763, 675], [25, 675, 763, 975]],          // unten, L-Form
  [[837, 575, 975, 975]],                               // rechts, schmal
]

const COLORS = {
  bg: '#FFFEF0',
  ink: '#1A1A1A',
  fill: { live: '#EAE2CE', dev: '#E53B3B' }, // Dev-PWA rot, damit beide am Homescreen unterscheidbar sind
}

// Anteil der Kantenlänge, den das Motiv einnimmt
const SCALE = {
  any: 0.8,
  // Maskable: Android schneidet bis auf einen Kreis mit 40 % Radius zu. Die Ecken des Motivs
  // liegen bei 0.56/√2 ≈ 0.396 und damit gerade noch innerhalb.
  maskable: 0.56,
  favicon: 0.9,
}

/** Layer (Hintergrund, Kontur, Füllung) als Rechtecke in Pixelkoordinaten. */
function layers(size, scale, fill, stroke = STROKE) {
  const k = (size * scale) / 1000
  const off = (size - size * scale) / 2
  // Kleine Bitmaps (Favicons): Kanten auf ganze Pixel runden, Kontur mindestens 1 px –
  // sonst verschwimmen die Linien zwischen zwei Pixeln zu Grau.
  const snap = size <= 48
  const pos = (v) => (snap ? Math.round(off + v * k) : off + v * k)
  const grow = snap ? Math.max(1, Math.round(stroke * k)) : stroke * k
  const rects = SHAPES.flat().map(([x0, y0, x1, y1]) => [pos(x0), pos(y0), pos(x1), pos(y1)])
  return [
    { color: COLORS.bg, rects: [[0, 0, size, size]] },
    { color: COLORS.ink, rects: rects.map(([x0, y0, x1, y1]) => [x0 - grow, y0 - grow, x1 + grow, y1 + grow]) },
    { color: fill, rects },
  ]
}

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))

/** Rastert die Layer mit 4×4-Supersampling (Kanten sind achsparallel, das reicht für saubere Ränder). */
function rasterize(size, scale, fill, stroke) {
  const ls = layers(size, scale, fill, stroke).map((l) => ({ ...l, rgb: hex(l.color) }))
  const N = 4
  const rgb = Buffer.alloc(size * size * 3)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const acc = [0, 0, 0]
      for (let sy = 0; sy < N; sy++) {
        for (let sx = 0; sx < N; sx++) {
          const px = x + (sx + 0.5) / N
          const py = y + (sy + 0.5) / N
          let c = ls[0].rgb
          for (const l of ls) {
            if (l.rects.some(([x0, y0, x1, y1]) => px >= x0 && px < x1 && py >= y0 && py < y1)) c = l.rgb
          }
          acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]
        }
      }
      const i = (y * size + x) * 3
      for (let ch = 0; ch < 3; ch++) rgb[i + ch] = Math.round(acc[ch] / (N * N))
    }
  }
  return rgb
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size, scale, fill, stroke) {
  const rgb = rasterize(size, scale, fill, stroke)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // Bittiefe
  ihdr[9] = 2 // RGB, deckend
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) rgb.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3)
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** ICO mit eingebetteten PNGs (von allen aktuellen Browsern unterstützt). */
function ico(sizes, scale, fill, stroke) {
  const images = sizes.map((s) => png(s, scale, fill, stroke))
  const header = Buffer.alloc(6 + 16 * sizes.length)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(sizes.length, 4)
  let offset = header.length
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i
    header[e] = s >= 256 ? 0 : s
    header[e + 1] = s >= 256 ? 0 : s
    header.writeUInt16LE(1, e + 4) // Farbebenen
    header.writeUInt16LE(32, e + 6) // Bit pro Pixel
    header.writeUInt32LE(images[i].length, e + 8)
    header.writeUInt32LE(offset, e + 12)
    offset += images[i].length
  })
  return Buffer.concat([header, ...images])
}

function svg(scale, fill, stroke) {
  const size = 1000
  const r = (l) => l.rects.map(([x0, y0, x1, y1]) => `M${+x0.toFixed(1)} ${+y0.toFixed(1)}H${+x1.toFixed(1)}V${+y1.toFixed(1)}H${+x0.toFixed(1)}Z`).join('')
  const [bg, ink, fl] = layers(size, scale, fill, stroke)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">`
    + `<path fill="${bg.color}" d="${r(bg)}"/><path fill="${ink.color}" d="${r(ink)}"/><path fill="${fl.color}" d="${r(fl)}"/></svg>\n`
}

function write(rel, data) {
  const file = path.join(ROOT, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, data)
  console.log(`  ${rel} (${data.length} B)`)
}

// App (Vite-public, landet unter /app/img/…): je ein Satz für live und dev
for (const [variant, dir] of [['live', 'public/img/pwa'], ['dev', 'public/img/pwa-dev']]) {
  const fill = COLORS.fill[variant]
  write(`${dir}/icon-192.png`, png(192, SCALE.any, fill))
  write(`${dir}/icon-512.png`, png(512, SCALE.any, fill))
  write(`${dir}/maskable-192.png`, png(192, SCALE.maskable, fill))
  write(`${dir}/maskable-512.png`, png(512, SCALE.maskable, fill))
  write(`${dir}/apple-touch-icon.png`, png(180, SCALE.any, fill))
  write(`${dir}/favicon-32.png`, png(32, SCALE.favicon, fill, FAVICON_STROKE))
  write(`${dir}/favicon.svg`, svg(SCALE.favicon, fill, FAVICON_STROKE))
}

// Landing Pages (site/public, landet an der Domain-Root). Browser fragen /favicon.ico und
// iOS /apple-touch-icon.png auch ohne <link> an der Root an.
write('site/public/favicon.ico', ico([16, 32, 48], SCALE.favicon, COLORS.fill.live, FAVICON_STROKE))
write('site/public/favicon.svg', svg(SCALE.favicon, COLORS.fill.live, FAVICON_STROKE))
write('site/public/apple-touch-icon.png', png(180, SCALE.any, COLORS.fill.live))
