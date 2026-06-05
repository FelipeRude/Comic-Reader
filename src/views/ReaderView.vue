<template>
  <div
    class="reader"
    ref="containerEl"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <div class="reader__stage" ref="stageEl" />

    <button class="reader__back" :class="{ 'is-hidden': !controlsVisible }" aria-label="Zurück" @click="$emit('back')">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
    </button>

    <button class="reader__debug-btn" :class="{ 'is-hidden': !controlsVisible, 'is-active': debugOverlay }" aria-label="Debug-Overlay" @touchstart.stop @touchend.stop @click="toggleDebug">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    </button>

    <button class="reader__settings" :class="{ 'is-hidden': !controlsVisible }" aria-label="Einstellungen" @touchstart.stop @touchend.stop @click="showSettings = true">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>

    <SettingsModal v-if="showSettings" @close="showSettings = false" />

    <div class="reader__zones" :class="{ 'is-hidden': !controlsVisible }">
      <div class="reader__zone reader__zone--left"><span class="reader__chevron">‹</span></div>
      <div class="reader__zone reader__zone--right"><span class="reader__chevron">›</span></div>
    </div>

    <div class="reader__hud" :class="{ 'is-hidden': !hudVisible }" @touchstart.stop @touchend.stop @click="showPageJump = true">
      Panel {{ currentPanelIndex + 1 }}/{{ currentPanels.length }} – Seite {{ currentPage + 1 }}/{{ totalPages }}
    </div>

    <PageJumpModal
      v-if="showPageJump"
      :current-page="currentPage"
      :total-pages="totalPages"
      @jump="onPageJump"
      @close="showPageJump = false"
    />

    <canvas v-if="debugOverlay" ref="overlayEl" class="reader__debug-overlay" />

    <div v-if="loading || transitioning" class="reader__loading">
      <div class="reader__spinner" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useReader } from '../composables/useReader.js'
import { useSettings } from '../composables/useSettings.js'
import SettingsModal from '../components/SettingsModal.vue'
import PageJumpModal from '../components/PageJumpModal.vue'

const props = defineProps({
  comicId: { type: Number, required: true },
})
defineEmits(['back'])

const {
  animation,
  effectivePadLeft, effectivePadTop, effectivePadRight, effectivePadBottom,
} = useSettings()

const viewport = reactive({ w: window.innerWidth, h: window.innerHeight })

const {
  prevCanvas,
  pageCanvas,
  nextCanvas,
  currentPage,
  currentPanelIndex,
  currentPanels,
  totalPages,
  loading,
  transitioning,
  manual,
  transformNumbers,
  zoomTransform,
  nextPanel,
  prevPanel,
  commitNextPage,
  commitPrevPage,
  setManual,
  jumpToPage,
  getPagePanels,
  init,
  destroy,
} = useReader(props.comicId, viewport)

const containerEl = ref(null)
const stageEl     = ref(null)
const overlayEl   = ref(null)
const showSettings = ref(false)
const showPageJump = ref(false)
const debugOverlay = ref(false)
const isPageAnimating = ref(false)

// --- Canvas-Verwaltung -------------------------------------------------------

// Setzt den Canvas sofort auf seine Zielposition (ohne Transition) in den Stage.
function mountCurrentCanvas(c) {
  if (!stageEl.value) return
  stageEl.value.replaceChildren()
  if (!c) return
  c.style.position   = 'absolute'
  c.style.top        = '0'
  c.style.left       = '0'
  c.style.maxWidth   = 'none'
  c.style.transformOrigin = '0 0'
  c.style.transition = 'none'
  c.style.transform  = zoomTransform.value
  stageEl.value.appendChild(c)
}

// Setzt die Zoom-Transition für Panel-Wechsel innerhalb der aktuellen Seite.
function updateCurrentTransform() {
  const c = pageCanvas.value
  if (!c) return
  c.style.transition = animation.value === 'smooth' && !manual.value
    ? 'transform 400ms ease-in-out'
    : 'none'
  c.style.transform = zoomTransform.value
}

watch(pageCanvas, mountCurrentCanvas)
watch(zoomTransform, updateCurrentTransform)

// --- Panel-Transform-Berechnung (identische Logik wie transformNumbers) ------

function computePanelTransform(canvas, panels, panelIdx) {
  if (!canvas || !panels?.length) return null
  const p   = panels[panelIdx] || panels[0]
  const cW  = canvas.width, cH = canvas.height
  const vW  = viewport.w,   vH = viewport.h

  const pl = vW * (effectivePadLeft.value   / 100)
  const pr = vW * (effectivePadRight.value  / 100)
  const pt = vH * (effectivePadTop.value    / 100)
  const pb = vH * (effectivePadBottom.value / 100)

  const px = p.x * cW, py = p.y * cH
  const pw = p.w * cW, ph = p.h * cH

  const availW = vW - pl - pr
  const availH = vH - pt - pb
  const scale = Math.min(availW / pw, availH / ph)
  const tx = pl + availW / 2 - (px + pw / 2) * scale
  const ty = pt + availH / 2 - (py + ph / 2) * scale
  return { scale, tx, ty }
}

// --- Nahtloser Seitenwechsel: beide Canvases im selben Koordinatenraum ------
//
// Statt einer Strip-Animation werden beide Seiten gleichzeitig animiert:
// Die "Kamera" zoomt vom letzten Panel der alten Seite zum ersten Panel
// der neuen Seite — genau wie ein Panel-Wechsel innerhalb einer Seite.
// Beide Canvases liegen untereinander im gleichen CSS-Koordinatenraum.

function styleCanvas(c, tx, ty, scale, transition) {
  c.style.position        = 'absolute'
  c.style.top             = '0'
  c.style.left            = '0'
  c.style.maxWidth        = 'none'
  c.style.transformOrigin = '0 0'
  c.style.transition      = transition
  c.style.transform       = `translate(${tx}px, ${ty}px) scale(${scale})`
}

async function animatePageCrossover(direction) {
  const { scale: s_c, tx: tx_c, ty: ty_c } = transformNumbers.value
  const currCanvas     = pageCanvas.value
  const incomingCanvas = direction === 'next' ? nextCanvas.value : prevCanvas.value

  // Zielpanel der einkommenden Seite berechnen
  const targetPageIdx = direction === 'next' ? currentPage.value + 1 : currentPage.value - 1
  const panels    = getPagePanels(targetPageIdx)
  const panelIdx  = direction === 'next' ? 0 : panels.length - 1
  const tgt = computePanelTransform(incomingCanvas, panels, panelIdx)
  if (!tgt) return

  const { scale: s_t, tx: tx_t, ty: ty_t } = tgt

  // Startposition der einkommenden Seite: direkt unterhalb/oberhalb der aktuellen.
  // Beide Seiten teilen denselben Koordinatenraum ("untereinander").
  const initY_incoming = direction === 'next'
    ? ty_c + currCanvas.height * s_c         // next: unter der aktuellen Seite
    : ty_c - incomingCanvas.height * s_c     // prev: über der aktuellen Seite

  // Zielposition der aktuellen Seite: Kamera bewegt sich zur einkommenden.
  const targetY_curr = direction === 'next'
    ? ty_t - currCanvas.height * s_t         // curr wandert nach oben raus
    : ty_t + incomingCanvas.height * s_t     // curr wandert nach unten raus

  // Beide Canvases initial positionieren (kein Übergang)
  styleCanvas(currCanvas,     tx_c, ty_c,          s_c, 'none')
  styleCanvas(incomingCanvas, tx_c, initY_incoming, s_c, 'none')
  stageEl.value.appendChild(incomingCanvas)

  // Reflow erzwingen, damit der Browser die Startposition registriert
  void incomingCanvas.offsetWidth

  // Beide gleichzeitig zur Zielposition animieren
  const T = 'transform 400ms ease-in-out'
  styleCanvas(currCanvas,     tx_t, targetY_curr, s_t, T)
  styleCanvas(incomingCanvas, tx_t, ty_t,         s_t, T)

  // Auf Ende der Animation warten
  await new Promise(resolve => {
    function onEnd(e) {
      if (e.propertyName !== 'transform') return
      incomingCanvas.removeEventListener('transitionend', onEnd)
      resolve()
    }
    incomingCanvas.addEventListener('transitionend', onEnd)
  })
}

// --- Debug-Overlay -----------------------------------------------------------

function toggleDebug() { debugOverlay.value = !debugOverlay.value }

function drawDebugOverlay() {
  const canvas = overlayEl.value
  if (!canvas || !pageCanvas.value) return

  const dpr = window.devicePixelRatio || 1
  canvas.width  = viewport.w * dpr
  canvas.height = viewport.h * dpr

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, viewport.w, viewport.h)

  const cW = pageCanvas.value.width
  const cH = pageCanvas.value.height
  const { scale, tx, ty } = transformNumbers.value
  const panels = currentPanels.value

  panels.forEach((p, i) => {
    const sx = p.x * cW * scale + tx
    const sy = p.y * cH * scale + ty
    const sw = p.w * cW * scale
    const sh = p.h * cH * scale
    const active = i === currentPanelIndex.value

    ctx.fillStyle   = active ? 'rgba(255,200,0,0.22)' : 'rgba(0,160,255,0.12)'
    ctx.strokeStyle = active ? 'rgba(255,200,0,0.95)' : 'rgba(0,160,255,0.75)'
    ctx.lineWidth   = active ? 2.5 : 1.5
    ctx.fillRect(sx, sy, sw, sh)
    ctx.strokeRect(sx, sy, sw, sh)

    const fontSize = Math.max(11, Math.min(22, sw / 5))
    ctx.font         = `bold ${fontSize}px sans-serif`
    ctx.fillStyle    = active ? 'rgba(255,200,0,1)' : 'rgba(0,160,255,1)'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(i + 1), sx + sw / 2, sy + sh / 2)
  })
}

watch([debugOverlay, zoomTransform, currentPanelIndex, currentPanels], () => {
  if (debugOverlay.value) nextTick(drawDebugOverlay)
})

// --- Page-Jump ---------------------------------------------------------------

async function onPageJump(pageIndex) {
  showPageJump.value = false
  await jumpToPage(pageIndex)
  hideControls()
}

// --- Controls / HUD auto-hide -----------------------------------------------

const controlsVisible = ref(true)
const hudVisible = ref(true)
let controlsTimer = null
let hudTimer = null

function pingControls() {
  controlsVisible.value = true
  hudVisible.value = true
  clearTimeout(controlsTimer)
  clearTimeout(hudTimer)
  controlsTimer = setTimeout(() => (controlsVisible.value = false), 3000)
  hudTimer = setTimeout(() => (hudVisible.value = false), 2000)
}

function hideControls() {
  controlsVisible.value = false
  hudVisible.value = false
  clearTimeout(controlsTimer)
  clearTimeout(hudTimer)
}

function toggleControls() {
  controlsVisible.value ? hideControls() : pingControls()
}

// --- Navigation --------------------------------------------------------------

async function goNext() {
  if (isPageAnimating.value) return
  if (currentPanelIndex.value < currentPanels.value.length - 1) {
    nextPanel()
    return
  }
  if (currentPage.value >= totalPages.value - 1) return

  isPageAnimating.value = true
  try {
    if (nextCanvas.value && animation.value === 'smooth') {
      await animatePageCrossover('next')
    }
    await commitNextPage()
  } finally {
    isPageAnimating.value = false
  }
}

async function goPrev() {
  if (isPageAnimating.value) return
  if (currentPanelIndex.value > 0) {
    prevPanel()
    return
  }
  if (currentPage.value <= 0) return

  isPageAnimating.value = true
  try {
    if (prevCanvas.value && animation.value === 'smooth') {
      await animatePageCrossover('prev')
    }
    await commitPrevPage()
  } finally {
    isPageAnimating.value = false
  }
}

// --- Touch: Tap / Pan / Pinch ------------------------------------------------
let touchStart = null
let pinch = null
let panBase = null
let isDragging = false

function dist(a, b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

function onTouchStart(e) {
  if (showSettings.value || showPageJump.value || isPageAnimating.value) return
  if (e.touches.length === 2) {
    const [a, b] = e.touches
    pinch = {
      d0: dist(a, b),
      midX0: (a.clientX + b.clientX) / 2,
      midY0: (a.clientY + b.clientY) / 2,
      base: { ...transformNumbers.value },
    }
    touchStart = null
  } else if (e.touches.length === 1) {
    const t = e.touches[0]
    touchStart = { x: t.clientX, y: t.clientY, t: Date.now() }
  }
}

function onTouchMove(e) {
  if (showSettings.value || showPageJump.value || isPageAnimating.value) return
  if (pinch && e.touches.length === 2) {
    e.preventDefault()
    const [a, b] = e.touches
    const factor = dist(a, b) / pinch.d0
    const midX = (a.clientX + b.clientX) / 2
    const midY = (a.clientY + b.clientY) / 2
    const scale = Math.max(0.2, Math.min(8, pinch.base.scale * factor))
    const ratio = scale / pinch.base.scale
    setManual({
      scale,
      tx: midX - (pinch.midX0 - pinch.base.tx) * ratio,
      ty: midY - (pinch.midY0 - pinch.base.ty) * ratio,
    })
  } else if (e.touches.length === 1 && touchStart) {
    const t = e.touches[0]
    const dx = t.clientX - touchStart.x
    const dy = t.clientY - touchStart.y
    if (!isDragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isDragging = true
      panBase = { ...transformNumbers.value }
    }
    if (isDragging) {
      setManual({ scale: panBase.scale, tx: panBase.tx + dx, ty: panBase.ty + dy })
    }
  }
}

function onTouchEnd(e) {
  if (showSettings.value || showPageJump.value || isPageAnimating.value) return
  if (pinch) {
    if (e.touches.length < 2) pinch = null
    return
  }
  if (isDragging) {
    isDragging = false
    panBase = null
    touchStart = null
    return
  }
  if (!touchStart) return

  const t = e.changedTouches[0]
  const dx = t.clientX - touchStart.x
  const dy = t.clientY - touchStart.y
  const dt = Date.now() - touchStart.t
  touchStart = null

  if (Math.abs(dx) > 10 || Math.abs(dy) > 10 || dt > 300) return

  const x = t.clientX
  if (x < viewport.w * 0.2) {
    goPrev()
  } else if (x > viewport.w * 0.8) {
    goNext()
  } else {
    toggleControls()
  }
}

// --- Keyboard (Desktop-Testing) ---------------------------------------------
function onKey(e) {
  if (e.key === 'ArrowRight') goNext()
  else if (e.key === 'ArrowLeft') goPrev()
  else if (e.key === 'Escape') document.activeElement?.blur()
}

function onResize() {
  viewport.w = window.innerWidth
  viewport.h = window.innerHeight
}

onMounted(async () => {
  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', onKey)
  await init()
  pingControls()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', onKey)
  clearTimeout(controlsTimer)
  clearTimeout(hudTimer)
  destroy()
})
</script>

<style lang="scss" scoped>
.reader {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow: hidden;
  background: #000;
  touch-action: none;

  &__stage {
    position: absolute;
    inset: 0;
  }

  &__back {
    position: absolute;
    top: calc(0.75rem + env(safe-area-inset-top));
    left: 0.75rem;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    backdrop-filter: blur(4px);
    transition: opacity 0.3s;
  }

  &__settings {
    position: absolute;
    top: calc(0.75rem + env(safe-area-inset-top));
    right: 0.75rem;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    backdrop-filter: blur(4px);
    transition: opacity 0.3s;
  }

  &__debug-btn {
    position: absolute;
    top: calc(0.75rem + env(safe-area-inset-top) + 42px + 0.5rem);
    right: 0.75rem;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    backdrop-filter: blur(4px);
    transition: opacity 0.3s, background 0.2s, color 0.2s;

    &.is-active {
      background: rgba(255, 200, 0, 0.85);
      color: #000;
    }
  }

  &__debug-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 3;
  }

  &__zones {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
    transition: opacity 0.3s;
  }

  &__zone {
    display: flex;
    align-items: center;
    width: 20%;
    height: 100%;

    &--left {
      justify-content: flex-start;
      padding-left: 0.5rem;
      background: linear-gradient(to right, rgba(0, 0, 0, 0.35), transparent);
    }

    &--right {
      justify-content: flex-end;
      padding-right: 0.5rem;
      background: linear-gradient(to left, rgba(0, 0, 0, 0.35), transparent);
    }
  }

  &__chevron {
    font-size: 2.5rem;
    line-height: 1;
    color: rgba(255, 255, 255, 0.9);
  }

  &__hud {
    position: absolute;
    bottom: calc(1rem + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    padding: 0.4rem 0.9rem;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
    color: #fff;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 999px;
    backdrop-filter: blur(4px);
    transition: opacity 0.3s;
    cursor: pointer;
  }

  .is-hidden {
    opacity: 0;
    pointer-events: none;
  }

  &__loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  &__spinner {
    width: 44px;
    height: 44px;
    border: 3px solid rgba(255, 255, 255, 0.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: reader-spin 0.8s linear infinite;
  }
}

@keyframes reader-spin {
  to { transform: rotate(360deg); }
}
</style>
