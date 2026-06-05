import { ref, computed } from 'vue'

const ANIM_KEY   = 'cr-animation'
const PAD_KEY    = 'cr-padding'
const DETECT_KEY = 'cr-detect-v2'

// --- Animation ---
const storedAnim = localStorage.getItem(ANIM_KEY)
const animation = ref(storedAnim === 'instant' ? 'instant' : 'smooth')

// --- Padding ---
function loadPad() {
  try {
    const raw = localStorage.getItem(PAD_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

const pad = loadPad()
const paddingLeft   = ref(typeof pad.left   === 'number' ? pad.left   : null)
const paddingTop    = ref(typeof pad.top    === 'number' ? pad.top    : null)
const paddingRight  = ref(typeof pad.right  === 'number' ? pad.right  : null)
const paddingBottom = ref(typeof pad.bottom === 'number' ? pad.bottom : null)

// Defaults used by reader when no stored value exists yet.
const PAD_DEFAULTS = { left: 0.5, top: 0.5, right: 0.5, bottom: 0 }

// --- Kachelerkennung ---
function loadDetect() {
  try {
    const raw = localStorage.getItem(DETECT_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

const det = loadDetect()
const minGutterPx    = ref(typeof det.gutterPx === 'number' ? det.gutterPx : 3)
const minPanelRatioW = ref(typeof det.ratioW   === 'number' ? det.ratioW   : 0.25)
const minPanelRatioH = ref(typeof det.ratioH   === 'number' ? det.ratioH   : 0.167)

function saveDetect() {
  localStorage.setItem(DETECT_KEY, JSON.stringify({
    gutterPx: minGutterPx.value,
    ratioW:   minPanelRatioW.value,
    ratioH:   minPanelRatioH.value,
  }))
}

// Effective values (used by reader — never null).
const effectivePadLeft   = computed(() => paddingLeft.value   ?? PAD_DEFAULTS.left)
const effectivePadTop    = computed(() => paddingTop.value    ?? PAD_DEFAULTS.top)
const effectivePadRight  = computed(() => paddingRight.value  ?? PAD_DEFAULTS.right)
const effectivePadBottom = computed(() => paddingBottom.value ?? PAD_DEFAULTS.bottom)

function savePad() {
  localStorage.setItem(PAD_KEY, JSON.stringify({
    left:   paddingLeft.value,
    top:    paddingTop.value,
    right:  paddingRight.value,
    bottom: paddingBottom.value,
  }))
}

export function useSettings() {
  function setAnimation(value) {
    animation.value = value === 'instant' ? 'instant' : 'smooth'
    localStorage.setItem(ANIM_KEY, animation.value)
  }

  function setPaddingSide(side, value) {
    const num = Math.max(0, Math.min(20, parseFloat(value) || 0))
    if (side === 'left')   paddingLeft.value   = num
    if (side === 'top')    paddingTop.value    = num
    if (side === 'right')  paddingRight.value  = num
    if (side === 'bottom') paddingBottom.value = num
    savePad()
  }

  function setDetect(key, value) {
    if (key === 'gutterPx') minGutterPx.value    = Math.max(1, Math.min(20, Math.round(parseFloat(value) || 1)))
    if (key === 'ratioW')   minPanelRatioW.value = Math.max(0.01, Math.min(0.3, parseFloat(value) / 100 || 0.05))
    if (key === 'ratioH')   minPanelRatioH.value = Math.max(0.01, Math.min(0.3, parseFloat(value) / 100 || 0.05))
    saveDetect()
  }

  return {
    animation, setAnimation,
    paddingLeft, paddingTop, paddingRight, paddingBottom,
    effectivePadLeft, effectivePadTop, effectivePadRight, effectivePadBottom,
    PAD_DEFAULTS,
    setPaddingSide,
    minGutterPx, minPanelRatioW, minPanelRatioH,
    setDetect,
  }
}
