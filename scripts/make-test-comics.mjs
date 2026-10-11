// Erzeugt Test-Comics (keine fremden Inhalte) unter test-comics/ (git-ignoriert):
//   test.cbz (Deflate), test-store.cbz (unkomprimiert), test.cbt, test.cb7, test.cbr (RAR5), test-rar4.cbr
//   sowie Fehlerfälle: encrypted.cbz, empty.cbz, broken.cbz, not-a-comic.cbz
//
// Inhalt jedes Archivs (absichtlich durcheinander, damit die Sortierung geprüft wird):
//   10.png, 2.png, 1.png               → Seiten 1–3 (natürlich sortiert: 1, 2, 10)
//   Kapitel 10/1.png                   → Seite 6
//   Kapitel 2/2.png, Kapitel 2/1.png   → Seiten 4–5 (Kapitel 2 vor Kapitel 10)
//   ComicInfo.xml, notes.txt, .DS_Store, __MACOSX/._1.png (werden ignoriert)
// Jede Seite zeigt groß die erwartete Seitennummer und vier Panels (2×2), damit Sortierung und
// Panel-Erkennung im Browser sichtbar sind.
//
// Benötigt: zip und tar (macOS: bsdtar, schreibt auch 7z).
// CBR: Mit `rar` im PATH (oder RAR=/pfad/zu/rar) echte komprimierte RAR4/RAR5-Dateien plus
// verschlüsselte Varianten. Ohne `rar` (RAR schreiben kann nur WinRAR, 7-Zip nur lesen) schreibt
// das Skript selbst RAR4- und RAR5-Container mit unkomprimierten Einträgen (Methode „Store“,
// nach der RAR-Formatbeschreibung von rarlab.com). Damit lassen sich die RAR-Header prüfen,
// nicht aber die RAR-Kompression selbst.
//
// Aufruf: node scripts/make-test-comics.mjs
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { execFileSync } from 'node:child_process'

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
const OUT = path.join(ROOT, 'test-comics')
const W = 800
const H = 1200

// --- PNG-Encoder (RGB, 8 Bit) ---------------------------------------------------------------
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function encodePng(pixels) {
  const raw = Buffer.alloc((W * 3 + 1) * H)
  for (let y = 0; y < H; y++) pixels.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0)
  ihdr.writeUInt32BE(H, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- Seite zeichnen ----------------------------------------------------------------------------
function rect(px, x0, y0, w, h, [r, g, b]) {
  for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) {
    for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      const i = (y * W + x) * 3
      px[i] = r; px[i + 1] = g; px[i + 2] = b
    }
  }
}
// 7-Segment-Ziffern: a b c d e f g
const SEGMENTS = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abcdfg']
function digit(px, d, x, y, s, color) {
  const t = Math.round(s / 5)
  const seg = {
    a: [x, y, s, t], g: [x, y + s - t / 2, s, t], d: [x, y + 2 * s - t, s, t],
    f: [x, y, t, s], b: [x + s - t, y, t, s], e: [x, y + s, t, s], c: [x + s - t, y + s, t, s],
  }
  for (const k of SEGMENTS[d]) rect(px, ...seg[k].map(Math.round), color)
}
function page(n, hue) {
  const px = Buffer.alloc(W * H * 3, 255)
  const gutter = 30
  const pw = (W - 3 * gutter) / 2
  const ph = (H - 3 * gutter) / 2
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const x = Math.round(gutter + col * (pw + gutter))
      const y = Math.round(gutter + row * (ph + gutter))
      rect(px, x, y, Math.round(pw), Math.round(ph), [0, 0, 0])
      rect(px, x + 6, y + 6, Math.round(pw) - 12, Math.round(ph) - 12, hue)
      // Panel-Nummer klein, Seitennummer groß im ersten Panel
      digit(px, row * 2 + col + 1, x + Math.round(pw) - 70, y + Math.round(ph) - 120, 50, [60, 60, 60])
    }
  }
  const digits = String(n).split('').map(Number)
  digits.forEach((d, i) => digit(px, d, gutter + 40 + i * 130, gutter + 40, 110, [0, 0, 0]))
  return encodePng(px)
}

// --- Inhalt ------------------------------------------------------------------------------------
const PAGES = [
  ['10.png', 3], ['2.png', 2], ['1.png', 1],
  ['Kapitel 10/1.png', 6], ['Kapitel 2/2.png', 5], ['Kapitel 2/1.png', 4],
]
const HUES = [[255, 230, 230], [230, 255, 230], [230, 230, 255], [255, 255, 210], [200, 240, 240], [240, 205, 240]]

function comicInfo(format, manga) {
  return `<?xml version="1.0" encoding="utf-8"?>
<ComicInfo xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <Title>${format}-Test</Title>
  <Series>PanelZoom Testheft</Series>
  <Number>${{ CBZ: 1, CBT: 2, CB7: 3, CBR: 4, RAR4: 5 }[format] ?? 0}</Number>
  <Manga>${manga ? 'YesAndRightToLeft' : 'No'}</Manga>
</ComicInfo>
`
}

function writeTree(dir, format, { manga = false, images = true } = {}) {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const put = (rel, data) => {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
    fs.writeFileSync(path.join(dir, rel), data)
  }
  if (images) for (const [rel, n] of PAGES) put(rel, page(n, HUES[n - 1]))
  put('ComicInfo.xml', comicInfo(format, manga))
  put('notes.txt', 'Keine Seite, wird ignoriert.\n')
  put('.DS_Store', Buffer.from([0, 0, 0, 1, 66, 117, 100, 49]))
  put('__MACOSX/._1.png', Buffer.from('AppleDouble-Ressource, keine Seite'))
  return ['10.png', '2.png', '1.png', 'Kapitel 10', 'Kapitel 2', 'ComicInfo.xml', 'notes.txt', '.DS_Store', '__MACOSX']
    .filter((name) => fs.existsSync(path.join(dir, name)))
}

// --- Minimaler RAR-Schreiber (nur Store) ---------------------------------------------------------
function listFiles(dir, rel = '') {
  return fs.readdirSync(path.join(dir, rel), { withFileTypes: true })
    .flatMap((d) => d.isDirectory() ? listFiles(dir, path.posix.join(rel, d.name)) : [path.posix.join(rel, d.name)])
}
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b }
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b }
function vint(n) {
  const out = []
  do { let byte = n & 0x7f; n = Math.floor(n / 128); if (n) byte |= 0x80; out.push(byte) } while (n)
  return Buffer.from(out)
}

function writeRar4(dir, target) {
  const head = (type, flags, body) => {
    const rest = Buffer.concat([Buffer.from([type]), u16(flags), u16(7 + body.length), body])
    return Buffer.concat([u16(crc32(rest) & 0xffff), rest])
  }
  const parts = [Buffer.from('Rar!\x1a\x07\x00', 'latin1'), head(0x73, 0, Buffer.alloc(6))]
  for (const rel of listFiles(dir)) {
    const data = fs.readFileSync(path.join(dir, rel))
    const name = Buffer.from(rel, 'utf8')
    const body = Buffer.concat([
      u32(data.length), u32(data.length), Buffer.from([3]), u32(crc32(data)),
      u32(0x5b4a0000), Buffer.from([20, 0x30]), u16(name.length), u32(0o100644), name,
    ])
    parts.push(head(0x74, 0x8000, body), data)  // 0x8000: Datenbereich folgt; Host Unix, Methode Store
  }
  parts.push(head(0x7b, 0x4000, Buffer.alloc(0)))
  fs.writeFileSync(target, Buffer.concat(parts))
}

function writeRar5(dir, target) {
  const head = (fields) => {
    const body = Buffer.concat(fields)
    const sized = Buffer.concat([vint(body.length), body])
    return Buffer.concat([u32(crc32(sized)), sized])
  }
  const parts = [Buffer.from('Rar!\x1a\x07\x01\x00', 'latin1'), head([vint(1), vint(0), vint(0)])]
  for (const rel of listFiles(dir)) {
    const data = fs.readFileSync(path.join(dir, rel))
    const name = Buffer.from(rel, 'utf8')
    parts.push(head([
      vint(2), vint(0x02), vint(data.length),         // Typ Datei, Datenbereich vorhanden
      vint(0x04), vint(data.length), vint(0o100644),  // CRC32 vorhanden, Größe, Attribute
      u32(crc32(data)), vint(0), vint(1),             // Kompression: Version 0, Store; Host Unix
      vint(name.length), name,
    ]), data)
  }
  parts.push(head([vint(5), vint(0), vint(0)]))
  fs.writeFileSync(target, Buffer.concat(parts))
}

function run(cmd, args, cwd) {
  execFileSync(cmd, args, { cwd, stdio: ['ignore', 'ignore', 'inherit'] })
}

function findRar() {
  for (const cand of [process.env.RAR, 'rar', '/opt/homebrew/bin/rar', '/usr/local/bin/rar']) {
    if (!cand) continue
    try { execFileSync(cand, ['-?'], { stdio: 'ignore' }); return cand } catch (err) { if (err.status != null) return cand }
  }
  return null
}

fs.mkdirSync(OUT, { recursive: true })
const tmp = fs.mkdtempSync(path.join(OUT, '.tmp-'))
const out = (name) => path.join(OUT, name)
for (const f of fs.readdirSync(OUT)) if (/\.(cbz|cbr|cb7|cbt)$/.test(f)) fs.rmSync(out(f))

try {
  let src = path.join(tmp, 'cbz')
  let files = writeTree(src, 'CBZ')
  run('zip', ['-q', '-r', '-X', out('test.cbz'), ...files], src)
  run('zip', ['-q', '-r', '-0', out('test-store.cbz'), ...files], src)
  run('zip', ['-q', '-r', '-P', 'geheim', out('encrypted.cbz'), ...files], src)

  src = path.join(tmp, 'cbt')
  files = writeTree(src, 'CBT')
  run('tar', ['-cf', out('test.cbt'), ...files], src)

  src = path.join(tmp, 'cb7')
  files = writeTree(src, 'CB7')
  run('tar', ['--format', '7zip', '-cf', out('test.cb7'), ...files], src)

  const rar = findRar()
  if (rar) {
    src = path.join(tmp, 'cbr')
    files = writeTree(src, 'CBR', { manga: true })
    run(rar, ['a', '-r', '-ma5', '-idq', out('test.cbr'), ...files], src)
    src = path.join(tmp, 'rar4')
    files = writeTree(src, 'RAR4')
    run(rar, ['a', '-r', '-ma4', '-idq', out('test-rar4.cbr'), ...files], src)
    run(rar, ['a', '-r', '-ma5', '-hpgeheim', '-idq', out('encrypted.cbr'), ...files], src)
    run(rar, ['a', '-r', '-ma5', '-pgeheim', '-idq', out('encrypted-data.cbr'), ...files], src)
  } else {
    console.warn('rar nicht gefunden → CBR als selbst geschriebene Store-Container (ohne Verschlüsselungs-Tests)')
    src = path.join(tmp, 'cbr')
    writeTree(src, 'CBR', { manga: true })
    writeRar5(src, out('test.cbr'))
    src = path.join(tmp, 'rar4')
    writeTree(src, 'RAR4')
    writeRar4(src, out('test-rar4.cbr'))
  }

  // Fehlerfälle
  src = path.join(tmp, 'empty')
  files = writeTree(src, 'CBZ', { images: false })
  run('zip', ['-q', '-r', out('empty.cbz'), ...files], src)
  const full = fs.readFileSync(out('test.cbz'))
  fs.writeFileSync(out('broken.cbz'), full.subarray(0, Math.floor(full.length / 2)))
  fs.writeFileSync(out('not-a-comic.cbz'), 'Das ist nur Text mit falscher Endung.\n')
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}

for (const f of fs.readdirSync(OUT).sort()) {
  if (!f.startsWith('.')) console.log(`${f.padEnd(18)} ${(fs.statSync(out(f)).size / 1024).toFixed(1)} KB`)
}
