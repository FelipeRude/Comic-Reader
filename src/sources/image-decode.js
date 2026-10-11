/**
 * Dekodiert Seitenbilder speichersparend: Die Bildgröße wird vorab aus dem Dateikopf gelesen,
 * damit createImageBitmap große Scans gleich verkleinert dekodieren kann (wo der Browser
 * resizeWidth unterstützt). Bitmaps werden nach dem Zeichnen sofort geschlossen.
 */

const HEAD_BYTES = 256 * 1024  // JPEG: SOF-Marker kann hinter großen EXIF-/ICC-Blöcken liegen

/** Liest { width, height } aus dem Kopf von JPEG/PNG/GIF/WebP, sonst null. */
export async function readImageSize(blob) {
  const b = new Uint8Array(await blob.slice(0, HEAD_BYTES).arrayBuffer())
  const v = new DataView(b.buffer)
  if (b.length < 30) return null
  // PNG: IHDR direkt nach der Signatur
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { width: v.getUint32(16), height: v.getUint32(20) }
  }
  // GIF
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) {
    return { width: v.getUint16(6, true), height: v.getUint16(8, true) }
  }
  // WebP (VP8, VP8L, VP8X)
  if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45) {
    const chunk = String.fromCharCode(b[12], b[13], b[14], b[15])
    if (chunk === 'VP8 ') return { width: v.getUint16(26, true) & 0x3fff, height: v.getUint16(28, true) & 0x3fff }
    if (chunk === 'VP8L') {
      const bits = v.getUint32(21, true)
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
    }
    if (chunk === 'VP8X') {
      return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) }
    }
    return null
  }
  // JPEG: Marker durchlaufen bis zum Start of Frame
  if (b[0] === 0xff && b[1] === 0xd8) {
    let p = 2
    while (p + 9 < b.length) {
      if (b[p] !== 0xff) return null
      const marker = b[p + 1]
      if (marker === 0xff) { p++; continue }
      const len = v.getUint16(p + 2)
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      if (isSof) return { width: v.getUint16(p + 7), height: v.getUint16(p + 5) }
      p += 2 + len
    }
  }
  return null
}

// Fallback für Browser, deren createImageBitmap ein Format (z. B. AVIF) nicht kann:
// <img> mit Blob-URL, die direkt nach dem Laden wieder freigegeben wird.
function decodeWithImg(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild konnte nicht dekodiert werden')) }
    img.src = url
  })
}

async function decode(blob, maxWidth) {
  const size = await readImageSize(blob).catch(() => null)
  if (size && maxWidth && size.width > maxWidth) {
    try {
      return await createImageBitmap(blob, { resizeWidth: maxWidth, resizeQuality: 'high' })
    } catch {}
  }
  try {
    return await createImageBitmap(blob)
  } catch {
    return decodeWithImg(blob)
  }
}

/**
 * Zeichnet ein Bild auf ein neues Canvas mit höchstens maxWidth Breite.
 * Kleinere Bilder werden nicht hochskaliert (spart Speicher, der Reader zoomt ohnehin).
 */
export async function blobToCanvas(blob, maxWidth) {
  const image = await decode(blob, maxWidth)
  try {
    const w = image.width || image.naturalWidth
    const h = image.height || image.naturalHeight
    if (!w || !h) throw new Error('Bild ohne Größe')
    const scale = maxWidth && w > maxWidth ? maxWidth / w : 1
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    // Transparente PNGs/WebPs auf Weiß, wie eine Papierseite
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas
  } finally {
    image.close?.()
  }
}

/** Ersatzseite für ein kaputtes Bild, damit das Lesen weitergeht. */
export function placeholderCanvas(maxWidth = 1000) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.min(maxWidth, 1000)
  canvas.height = Math.round(canvas.width * 1.5)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#eee'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#999'
  ctx.font = `${Math.round(canvas.width / 6)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('?', canvas.width / 2, canvas.height / 2)
  return canvas
}
