/**
 * Panel-Erkennung via Projection-Profile / Gutter-Analyse (reines Vanilla-JS).
 * Läuft im Worker-Thread, damit die UI nicht blockiert.
 *
 * Eingang  (postMessage): { imageData, pageIndex }
 * Ausgang  (postMessage): { pageIndex, panels: [{x,y,w,h}] }
 */

const WHITE_THRESHOLD = 240 // Durchschnitts-Helligkeit ab der eine Linie als Gutter (weiß) gilt

/**
 * Durchschnittliche Helligkeit aller Pixel in Zeile y.
 */
function rowBrightness(data, width, y) {
  let sum = 0
  const start = y * width * 4
  for (let x = 0; x < width; x++) {
    const i = start + x * 4
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3
  }
  return sum / width
}

function isWhiteRow(data, width, y, threshold = WHITE_THRESHOLD) {
  return rowBrightness(data, width, y) >= threshold
}

/**
 * Durchschnittliche Helligkeit der Spalte x im Y-Bereich [y0, y1).
 */
function columnBrightness(data, width, y0, y1, x) {
  let sum = 0
  for (let y = y0; y < y1; y++) {
    const i = (y * width + x) * 4
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3
  }
  return sum / (y1 - y0)
}

function isWhiteColumn(data, width, y0, y1, x, threshold = WHITE_THRESHOLD) {
  return columnBrightness(data, width, y0, y1, x) >= threshold
}

/**
 * Horizontale Gutter-Analyse: liefert die Y-Bänder (Comic-Zeilen) als {yStart, yEnd}.
 * Erst nach minGutterPx aufeinanderfolgenden weißen Zeilen gilt der Gutter als echt.
 */
function findRowStrips(data, width, height, minGutterPx) {
  const strips = []
  let stripStart = null
  let pendingEnd = null // erste weiße Zeile nach Inhalt

  for (let y = 0; y < height; y++) {
    const white = isWhiteRow(data, width, y)
    if (!white) {
      if (stripStart === null) stripStart = y
      pendingEnd = null
    } else {
      if (stripStart !== null) {
        if (pendingEnd === null) pendingEnd = y
        if (y - pendingEnd + 1 >= minGutterPx) {
          strips.push({ yStart: stripStart, yEnd: pendingEnd })
          stripStart = null
          pendingEnd = null
        }
      }
    }
  }
  if (stripStart !== null) strips.push({ yStart: stripStart, yEnd: pendingEnd ?? height })
  return strips
}

/**
 * Vertikale Gutter-Analyse innerhalb eines Y-Bands: liefert Panels {x,y,w,h}.
 * Erst nach minGutterPx aufeinanderfolgenden weißen Spalten gilt der Gutter als echt.
 */
function findPanelsInStrip(data, width, yStart, yEnd, minGutterPx) {
  const panels = []
  let panelStart = null
  let pendingEnd = null

  for (let x = 0; x < width; x++) {
    const white = isWhiteColumn(data, width, yStart, yEnd, x)
    if (!white) {
      if (panelStart === null) panelStart = x
      pendingEnd = null
    } else {
      if (panelStart !== null) {
        if (pendingEnd === null) pendingEnd = x
        if (x - pendingEnd + 1 >= minGutterPx) {
          panels.push({ x: panelStart, y: yStart, w: pendingEnd - panelStart, h: yEnd - yStart })
          panelStart = null
          pendingEnd = null
        }
      }
    }
  }
  if (panelStart !== null) {
    panels.push({ x: panelStart, y: yStart, w: (pendingEnd ?? width) - panelStart, h: yEnd - yStart })
  }
  return panels
}

/**
 * Panels unterhalb der Mindestgröße werden nicht verworfen, sondern in den
 * geometrisch nächsten Nachbarn gemergt (Bounding-Box-Vereinigung).
 * - zu schmal → Nachbar mit y-Überlappung (links/rechts)
 * - zu niedrig → Nachbar mit x-Überlappung (oben/unten)
 * - beides    → nächster Nachbar nach Mittelpunkt-Abstand
 */
function mergeSmallPanels(panels, minW, minH) {
  if (panels.length <= 1) return panels

  let result = [...panels]
  let changed = true

  while (changed) {
    changed = false
    for (let i = 0; i < result.length; i++) {
      const p = result[i]
      const tooNarrow = p.w < minW
      const tooShort  = p.h < minH
      if (!tooNarrow && !tooShort) continue

      let bestJ = -1
      let bestDist = Infinity

      for (let j = 0; j < result.length; j++) {
        if (j === i) continue
        const q = result[j]
        const yOverlap = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y)
        const xOverlap = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)
        const pcx = p.x + p.w / 2, pcy = p.y + p.h / 2
        const qcx = q.x + q.w / 2, qcy = q.y + q.h / 2

        let dist = Infinity
        if (tooNarrow && !tooShort && yOverlap > 0) dist = Math.abs(pcx - qcx)
        else if (tooShort && !tooNarrow && xOverlap > 0) dist = Math.abs(pcy - qcy)
        else if (tooNarrow && tooShort) dist = Math.hypot(pcx - qcx, pcy - qcy)

        if (dist < bestDist) { bestDist = dist; bestJ = j }
      }

      if (bestJ >= 0) {
        const a = result[i]
        const b = result[bestJ]
        const merged = {
          x: Math.min(a.x, b.x),
          y: Math.min(a.y, b.y),
          w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x),
          h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y),
        }
        const hi = Math.max(i, bestJ)
        const lo = Math.min(i, bestJ)
        result.splice(hi, 1)
        result.splice(lo, 1)
        result.push(merged)
        result.sort((a, b) => (a.y - b.y) || (a.x - b.x))
        changed = true
        break
      }
    }
  }
  return result
}

/**
 * Entfernt Panels, die vollständig in einem anderen Panel enthalten sind.
 * Passiert nach dem Merging, wenn eine vergrößerte Bounding-Box ein
 * benachbartes kleineres Panel vollständig überdeckt.
 */
function removeContainedPanels(panels) {
  if (panels.length <= 1) return panels

  const EPS = 2 // px Toleranz gegen Rundungsdifferenzen
  const byArea = [...panels].sort((a, b) => (b.w * b.h) - (a.w * a.h))
  const result = []

  for (const p of byArea) {
    const inside = result.some(
      (q) =>
        q.x - EPS <= p.x &&
        q.y - EPS <= p.y &&
        q.x + q.w + EPS >= p.x + p.w &&
        q.y + q.h + EPS >= p.y + p.h,
    )
    if (!inside) result.push(p)
  }

  return result.sort((a, b) => (a.y - b.y) || (a.x - b.x))
}

/**
 * Kombiniert beide Analysen, mergt zu kleine Panels und sortiert in westlicher
 * Leserichtung (oben→unten, links→rechts). Koordinaten werden auf 0–1
 * normalisiert (relativ zur Seitengröße → auflösungsunabhängig für den Reader).
 * Fallback: ganze Seite als ein Panel.
 */
function detectPanels(data, width, height, minGutterPx, minPanelRatioW, minPanelRatioH) {
  const minW = width * minPanelRatioW
  const minH = height * minPanelRatioH

  const panels = []
  for (const strip of findRowStrips(data, width, height, minGutterPx)) {
    for (const panel of findPanelsInStrip(data, width, strip.yStart, strip.yEnd, minGutterPx)) {
      panels.push(panel)
    }
  }

  const merged = removeContainedPanels(mergeSmallPanels(panels, minW, minH))
  merged.sort((a, b) => (a.y - b.y) || (a.x - b.x))

  if (merged.length === 0) {
    return [{ x: 0, y: 0, w: 1, h: 1 }]
  }

  return merged.map((p) => ({
    x: p.x / width,
    y: p.y / height,
    w: p.w / width,
    h: p.h / height,
  }))
}

self.onmessage = (e) => {
  const { imageData, pageIndex, minGutterPx = 3, minPanelRatioW = 0.25, minPanelRatioH = 0.167 } = e.data
  const { data, width, height } = imageData
  const panels = detectPanels(data, width, height, minGutterPx, minPanelRatioW, minPanelRatioH)
  self.postMessage({ pageIndex, panels })
}
