// Erzeugt alle Icons (PWA, Favicon, Apple-Touch) aus dem Panel-Logo – ohne Abhängigkeiten.
// Aufruf: npm run icons   (Ergebnis wird eingecheckt; nur nach Änderungen am Motiv neu erzeugen)
//
// Ein Motiv ist eine Comic-Seite aus Panels in einem 1000×1000-Raster, jede Form eine Füllfläche
// aus Rechtecken mit Kontur. Die Konturen reichen genau bis an den Rand des Rasters.
// Rechtecke einer Form dürfen sich überlappen; für die Füllung wird jedes Rechteck um die halbe
// Kontur verkleinert, Überlappungen verhindern dabei Lücken an den Innenkanten von L-Formen.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..')

const MOTIFS = {
  // Logo (Design: logo.svg, 1250er Raster mit 125 Rand). Kontur 25 mittig auf der Formkante.
  live: {
    stroke: 25, inset: 0.5, radius: 0.1, fill: '#E63946',
    // Favicon: Kontur ganz außen, so treffen sich die Konturen benachbarter Panels (Abstand 50)
    // und werden zu einer Linie. Mittig blieben bei 16–32 px nur Bruchteile von Pixeln Abstand.
    favicon: { stroke: 25, inset: 0 },
    shapes: [
      [[12.5, 12.5, 387.5, 562.5]],                                                    // links, hoch
      [[12.5, 612.5, 387.5, 987.5]],                                                   // links unten
      [[437.5, 12.5, 987.5, 287.5], [612.5, 12.5, 987.5, 375.1]],                      // oben rechts, L-Form
      [[612.5, 424.5, 827.5, 786.5], [437.5, 512.5, 827.5, 786.5], [437.5, 512.5, 587.5, 787.5]], // Mitte, L-Form
      [[877.5, 424.5, 987.5, 787.5]],                                                  // rechts, schmal
    ],
  },
  // Bisheriges Raster, bleibt für die Dev-PWA. Kontur 25 außen um die Formkante.
  dev: {
    stroke: 25, inset: 0, radius: 0, fill: '#E53B3B',
    // Favicons werden bis 16 px klein dargestellt; dort wäre die 25er-Kontur unter einem halben Pixel.
    // Mit 37,5 berühren sich die Konturen benachbarter Panels und werden zu einer kräftigen Linie.
    favicon: { stroke: 37.5, inset: 0 },
    shapes: [
      [[25, 25, 375, 600]],                                 // links, hoch
      [[450, 25, 975, 325], [625, 325, 975, 425]],          // oben rechts, L-Form
      [[625, 575, 763, 675], [25, 675, 763, 975]],          // unten, L-Form
      [[837, 575, 975, 975]],                               // rechts, schmal
    ],
  },
}

const COLORS = { bg: '#FFFEF0', ink: '#1A1A1A' }

// Anteil der Kantenlänge, den das Motiv einnimmt
const SCALE = {
  any: 0.8, // wie im Logo (1000 von 1250)
  // Maskable: Android schneidet bis auf einen Kreis mit 40 % Radius zu. Die Ecken des Motivs
  // liegen bei 0.56/√2 ≈ 0.396 und damit gerade noch innerhalb.
  maskable: 0.56,
  favicon: 0.9,
}

/**
 * Layer (Hintergrund, Kontur, Füllung) in Pixelkoordinaten. round: Eckradius des Hintergrunds
 * (Anteil der Kantenlänge, außerhalb transparent); Apple-Touch und Maskable bleiben eckig,
 * dort rundet das System selbst.
 */
function layers(motif, size, scale, { stroke = motif.stroke, inset = motif.inset, round = 0 } = {}) {
  const k = (size * scale) / 1000
  const off = (size - size * scale) / 2
  // Kleine Bitmaps (Favicons): Kanten auf ganze Pixel runden, Kontur mindestens 1 px –
  // sonst verschwimmen die Linien zwischen zwei Pixeln zu Grau.
  const snap = size <= 48
  const pos = (v) => (snap ? Math.round(off + v * k) : off + v * k)
  const px = (v) => (snap ? Math.round(v * k) : v * k)
  let out = px(stroke * (1 - inset))
  let inn = px(stroke * inset)
  if (snap && out + inn < 1) out = 1
  const rects = motif.shapes.flat().map(([x0, y0, x1, y1]) => [pos(x0), pos(y0), pos(x1), pos(y1)])
  return [
    { color: COLORS.bg, rects: [[0, 0, size, size]], radius: round * size },
    { color: COLORS.ink, rects: rects.map(([x0, y0, x1, y1]) => [x0 - out, y0 - out, x1 + out, y1 + out]) },
    { color: motif.fill, rects: rects.map(([x0, y0, x1, y1]) => [x0 + inn, y0 + inn, x1 - inn, y1 - inn]) },
  ]
}

/** Liegt (x, y) im Quadrat [0, size] mit Eckradius r? */
function inRounded(x, y, size, r) {
  if (!r) return true
  const cx = Math.min(Math.max(x, r), size - r)
  const cy = Math.min(Math.max(y, r), size - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))

/** Rastert die Layer mit 4×4-Supersampling zu RGBA (Kanten sind achsparallel, das reicht). */
function rasterize(size, ls) {
  ls = ls.map((l) => ({ ...l, rgb: hex(l.color) }))
  const N = 4
  const rgba = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const acc = [0, 0, 0, 0]
      for (let sy = 0; sy < N; sy++) {
        for (let sx = 0; sx < N; sx++) {
          const px = x + (sx + 0.5) / N
          const py = y + (sy + 0.5) / N
          if (!inRounded(px, py, size, ls[0].radius)) continue
          let c = ls[0].rgb
          for (const l of ls) {
            if (l.rects.some(([x0, y0, x1, y1]) => px >= x0 && px < x1 && py >= y0 && py < y1)) c = l.rgb
          }
          acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3]++
        }
      }
      const i = (y * size + x) * 4
      // Farbe nur über die deckenden Samples mitteln (sonst dunkle Säume an runden Ecken)
      for (let ch = 0; ch < 3; ch++) rgba[i + ch] = acc[3] ? Math.round(acc[ch] / acc[3]) : 0
      rgba[i + 3] = Math.round((acc[3] / (N * N)) * 255)
    }
  }
  return rgba
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

function png(size, ls) {
  const rgba = rasterize(size, ls)
  // Ohne runde Ecken ist alles deckend: dann RGB, das spart ein Viertel
  const opaque = !ls[0].radius
  const ch = opaque ? 3 : 4
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // Bittiefe
  ihdr[9] = opaque ? 2 : 6 // RGB bzw. RGBA
  const row = size * ch
  const raw = Buffer.alloc(size * (row + 1))
  for (let i = 0; i < size * size; i++) {
    const o = Math.floor(i / size) * (row + 1) + 1 + (i % size) * ch
    for (let c = 0; c < ch; c++) raw[o + c] = rgba[i * 4 + c]
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** ICO mit eingebetteten PNGs (von allen aktuellen Browsern unterstützt). */
function ico(sizes, layersFor) {
  const images = sizes.map((s) => png(s, layersFor(s)))
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

function svg([bg, ink, fl]) {
  const size = 1000
  const n = (v) => +v.toFixed(1)
  const r = (l) => l.rects.map(([x0, y0, x1, y1]) => `M${n(x0)} ${n(y0)}H${n(x1)}V${n(y1)}H${n(x0)}Z`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">`
    + (bg.radius ? `<rect width="${size}" height="${size}" rx="${n(bg.radius)}" fill="${bg.color}"/>` : `<path fill="${bg.color}" d="${r(bg)}"/>`)
    + `<path fill="${ink.color}" d="${r(ink)}"/><path fill="${fl.color}" d="${r(fl)}"/></svg>\n`
}

function write(rel, data) {
  const file = path.join(ROOT, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, data)
  console.log(`  ${rel} (${data.length} B)`)
}

// App (Vite-public, landet unter /app/img/…): je ein Satz für live und dev
for (const [variant, dir] of [['live', 'public/img/pwa'], ['dev', 'public/img/pwa-dev']]) {
  const m = MOTIFS[variant]
  const round = m.radius
  write(`${dir}/icon-192.png`, png(192, layers(m, 192, SCALE.any, { round })))
  write(`${dir}/icon-512.png`, png(512, layers(m, 512, SCALE.any, { round })))
  write(`${dir}/maskable-192.png`, png(192, layers(m, 192, SCALE.maskable)))
  write(`${dir}/maskable-512.png`, png(512, layers(m, 512, SCALE.maskable)))
  write(`${dir}/apple-touch-icon.png`, png(180, layers(m, 180, SCALE.any)))
  write(`${dir}/favicon-32.png`, png(32, layers(m, 32, SCALE.favicon, { ...m.favicon, round })))
  write(`${dir}/favicon.svg`, svg(layers(m, 1000, SCALE.favicon, { ...m.favicon, round })))
  // Logo in voller Größe für die Kopfzeile der App
  write(`${dir}/logo.svg`, svg(layers(m, 1000, SCALE.any, { round })))
}

// Landing Pages (site/public, landet an der Domain-Root). Browser fragen /favicon.ico und
// iOS /apple-touch-icon.png auch ohne <link> an der Root an.
const live = MOTIFS.live
const fav = (s) => layers(live, s, SCALE.favicon, { ...live.favicon, round: live.radius })
write('site/public/favicon.ico', ico([16, 32, 48], fav))
write('site/public/favicon.svg', svg(fav(1000)))
write('site/public/apple-touch-icon.png', png(180, layers(live, 180, SCALE.any)))
write('site/public/logo.svg', svg(layers(live, 1000, SCALE.any, { round: live.radius })))
