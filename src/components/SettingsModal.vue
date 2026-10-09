<template>
  <div class="settings" :class="{ 'is-closing': closing }" @click.self="close" @animationend.self="onAnimationEnd">
    <div class="settings__box" role="dialog" aria-modal="true">
      <header class="settings__header">
        <h2 class="settings__title">{{ t('common.settings') }}</h2>
        <button class="settings__close" :class="{ 'is-pressed': closing }" :aria-label="t('common.close')" @click="close">
          <img src="/UI-Icons/Keyboard-Asterisk-2-Filled.svg" class="icon" width="22" height="22" alt="" aria-hidden="true" />
        </button>
      </header>

      <!-- Sprache -->
      <!-- Auswahlliste statt Umschalter, damit auch viele Sprachen passen -->
      <template v-if="locales.length > 1">
        <div class="settings__row">
          <div class="settings__label">
            <span id="settings-language" class="settings__label-title">{{ t('settings.language') }}</span>
          </div>
        </div>
        <div ref="langEl" class="settings__lang" @focusout="onLangFocusOut" @keydown.esc.stop="langOpen = false">
          <button
            class="settings__lang-btn"
            aria-haspopup="listbox"
            :aria-expanded="langOpen"
            aria-labelledby="settings-language"
            @click="langOpen = !langOpen"
          >
            <img src="/UI-Icons/globe.svg" class="icon" width="18" height="18" alt="" aria-hidden="true" />
            <span class="settings__lang-code">{{ locale.toUpperCase() }}</span>
          </button>
          <ul v-if="langOpen" class="settings__lang-list" role="listbox" aria-labelledby="settings-language">
            <li v-for="l in locales" :key="l.code" role="option" :aria-selected="locale === l.code">
              <button
                class="settings__lang-option"
                :class="{ 'is-active': locale === l.code }"
                :lang="l.hreflang"
                @click="chooseLocale(l.code)"
              >
                <span class="settings__lang-option-code">{{ l.code.toUpperCase() }}</span>
                {{ l.nativeName }}
              </button>
            </li>
          </ul>
        </div>
      </template>

      <!-- Leserichtung (nur im Reader, gilt für das geöffnete Comic) -->
      <template v-if="direction">
        <div class="settings__row" :class="{ 'settings__row--pad': locales.length > 1 }">
          <div class="settings__label">
            <span class="settings__label-title">{{ t('settings.direction') }}</span>
            <span class="settings__label-hint">{{ t('settings.directionHint') }}</span>
          </div>
        </div>
        <div class="settings__toggle">
          <button
            class="settings__option"
            :class="{ 'settings__option--active': direction === 'ltr' }"
            @click="$emit('direction', 'ltr')"
          >
            {{ t('settings.directionLtr') }}
          </button>
          <button
            class="settings__option"
            :class="{ 'settings__option--active': direction === 'rtl' }"
            @click="$emit('direction', 'rtl')"
          >
            {{ t('settings.directionRtl') }}
          </button>
        </div>
      </template>

      <!-- Panel-Übergang -->
      <div class="settings__row" :class="{ 'settings__row--pad': locales.length > 1 || direction }">
        <div class="settings__label">
          <span class="settings__label-title">{{ t('settings.transition') }}</span>
          <span class="settings__label-hint">{{ t('settings.transitionHint') }}</span>
        </div>
      </div>
      <div class="settings__toggle">
        <button
          class="settings__option"
          :class="{ 'settings__option--active': animation === 'smooth' }"
          @click="setAnimation('smooth')"
        >
          {{ t('settings.smooth') }}
        </button>
        <button
          class="settings__option"
          :class="{ 'settings__option--active': animation === 'instant' }"
          @click="setAnimation('instant')"
        >
          {{ t('settings.instant') }}
        </button>
      </div>

      <!-- Zoom-Abstand -->
      <div class="settings__row settings__row--pad">
        <div class="settings__label">
          <span class="settings__label-title">{{ t('settings.padding') }}</span>
          <span class="settings__label-hint">{{ t('settings.paddingHint') }}</span>
        </div>
      </div>

      <div class="settings__cross">
        <div class="settings__cross-top">
          <label class="settings__pad-label" for="pad-top">{{ t('settings.top') }}</label>
          <div class="settings__pad-field">
            <button class="settings__pad-step" :aria-label="`${t('settings.top')} −`" @click="step('top', -1)">−</button>
            <input id="pad-top" class="settings__pad-input" type="number" inputmode="decimal" min="0" max="20" step="0.5" v-model.number="localTop" @change="save('top', localTop)" />
            <span class="settings__pad-unit">%</span>
            <button class="settings__pad-step" :aria-label="`${t('settings.top')} +`" @click="step('top', 1)">+</button>
          </div>
        </div>

        <div class="settings__cross-mid">
          <div class="settings__cross-side">
            <label class="settings__pad-label" for="pad-left">{{ t('settings.left') }}</label>
            <div class="settings__pad-field">
              <button class="settings__pad-step" :aria-label="`${t('settings.left')} −`" @click="step('left', -1)">−</button>
              <input id="pad-left" class="settings__pad-input" type="number" inputmode="decimal" min="0" max="20" step="0.5" v-model.number="localLeft" @change="save('left', localLeft)" />
              <span class="settings__pad-unit">%</span>
              <button class="settings__pad-step" :aria-label="`${t('settings.left')} +`" @click="step('left', 1)">+</button>
            </div>
          </div>

          <!-- Vorschau: Bildschirm mit Kachel. Abstände doppelt so groß wie echt,
               damit schon wenige Prozent sichtbar sind (max. 20 % → 40 %). -->
          <div class="settings__preview" :style="previewSize" aria-hidden="true">
            <div
              class="settings__preview-tile"
              :style="{ top: `${clampPad(localTop) * 2}%`, right: `${clampPad(localRight) * 2}%`, bottom: `${clampPad(localBottom) * 2}%`, left: `${clampPad(localLeft) * 2}%` }"
            />
          </div>

          <div class="settings__cross-side settings__cross-side--right">
            <label class="settings__pad-label" for="pad-right">{{ t('settings.right') }}</label>
            <div class="settings__pad-field">
              <button class="settings__pad-step" :aria-label="`${t('settings.right')} −`" @click="step('right', -1)">−</button>
              <input id="pad-right" class="settings__pad-input" type="number" inputmode="decimal" min="0" max="20" step="0.5" v-model.number="localRight" @change="save('right', localRight)" />
              <span class="settings__pad-unit">%</span>
              <button class="settings__pad-step" :aria-label="`${t('settings.right')} +`" @click="step('right', 1)">+</button>
            </div>
          </div>
        </div>

        <div class="settings__cross-bottom">
          <label class="settings__pad-label" for="pad-bottom">{{ t('settings.bottom') }}</label>
          <div class="settings__pad-field">
            <button class="settings__pad-step" :aria-label="`${t('settings.bottom')} −`" @click="step('bottom', -1)">−</button>
            <input id="pad-bottom" class="settings__pad-input" type="number" inputmode="decimal" min="0" max="20" step="0.5" v-model.number="localBottom" @change="save('bottom', localBottom)" />
            <span class="settings__pad-unit">%</span>
            <button class="settings__pad-step" :aria-label="`${t('settings.bottom')} +`" @click="step('bottom', 1)">+</button>
          </div>
        </div>
      </div>

      <p class="settings__version">{{ t('settings.version', { date: buildTime }) }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettings } from '../composables/useSettings.js'
import { useI18n } from '../composables/useI18n.js'

defineProps({
  // 'ltr' | 'rtl' — nur im Reader gesetzt; null blendet den Abschnitt aus
  direction: { type: String, default: null },
})

const emit = defineEmits(['close', 'direction'])

// Schließen mit Animation: erst ausfahren, dann 'close' melden.
// Ohne Animation (reduzierte Bewegung) oder falls animationend ausbleibt: direkt.
const closing = ref(false)
let closeTimer = null

function close() {
  if (closing.value) return
  closing.value = true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    emit('close')
    return
  }
  closeTimer = setTimeout(() => emit('close'), 400)
}

function onAnimationEnd() {
  if (!closing.value) return
  clearTimeout(closeTimer)
  emit('close')
}

const { t, d, locale, locales, setLocale } = useI18n()

// Sprach-Liste: schließt bei Auswahl, Escape und Fokus außerhalb
const langOpen = ref(false)
const langEl = ref(null)

function chooseLocale(code) {
  setLocale(code)
  langOpen.value = false
}

function onLangFocusOut(e) {
  if (!langEl.value?.contains(e.relatedTarget)) langOpen.value = false
}

// Build-Zeitpunkt kommt als ISO-String und wird in der App-Sprache formatiert.
const buildTime = computed(() => d(new Date(__BUILD_TIME__), { dateStyle: 'medium', timeStyle: 'short' }))

const {
  animation, setAnimation,
  paddingLeft, paddingTop, paddingRight, paddingBottom, PAD_DEFAULTS, setPaddingSide,
} = useSettings()

const localLeft   = ref(0)
const localTop    = ref(0)
const localRight  = ref(0)
const localBottom = ref(0)

function readSafeAreaPx(side) {
  const div = document.createElement('div')
  div.style.cssText = `position:fixed;top:0;left:0;pointer-events:none;visibility:hidden;padding-${side}:env(safe-area-inset-${side},0px);`
  document.body.appendChild(div)
  const propName = `padding${side[0].toUpperCase()}${side.slice(1)}`
  const val = parseFloat(getComputedStyle(div)[propName]) || 0
  div.remove()
  return val
}

function pxToWidthPct(px)  { return Math.round((px / window.innerWidth)  * 1000) / 10 }
function pxToHeightPct(px) { return Math.round((px / window.innerHeight) * 1000) / 10 }

onMounted(() => {
  const safeLeft   = pxToWidthPct(readSafeAreaPx('left'))
  const safeTop    = pxToHeightPct(readSafeAreaPx('top'))
  const safeRight  = pxToWidthPct(readSafeAreaPx('right'))
  const safeBottom = pxToHeightPct(readSafeAreaPx('bottom'))

  localLeft.value   = paddingLeft.value   ?? (safeLeft   > 0 ? safeLeft   : PAD_DEFAULTS.left)
  localTop.value    = paddingTop.value    ?? (safeTop    > 0 ? safeTop    : PAD_DEFAULTS.top)
  localRight.value  = paddingRight.value  ?? (safeRight  > 0 ? safeRight  : PAD_DEFAULTS.right)
  localBottom.value = paddingBottom.value ?? (safeBottom > 0 ? safeBottom : PAD_DEFAULTS.bottom)
})

const locals = { left: localLeft, top: localTop, right: localRight, bottom: localBottom }

function clampPad(v) {
  return Math.max(0, Math.min(20, parseFloat(v) || 0))
}

function save(side, value) {
  setPaddingSide(side, value)
}

// −/+ in 0,5er-Schritten, begrenzt auf 0–20 %
function step(side, dir) {
  const next = Math.round((clampPad(locals[side].value) + dir * 0.5) * 2) / 2
  locals[side].value = clampPad(next)
  save(side, locals[side].value)
}

// Vorschau im Seitenverhältnis des Bildschirms (Hoch- oder Querformat),
// höchstens 96 px hoch und 140 px breit, damit auch kleine Abstände sichtbar sind
const previewSize = (() => {
  const ratio = window.innerWidth / window.innerHeight
  const w = Math.min(140, 96 * ratio)
  return { width: `${Math.round(w)}px`, height: `${Math.round(w / ratio)}px` }
})()
</script>

<style lang="scss" scoped>
.settings {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: var(--bg-overlay);
  animation: settings-fade-in 0.22s ease-out;

  // Ausfahrweg des Fensters: im Hochformat von ganz unten, als Karte nur ein Stück
  --sheet-from: 100%;

  &.is-closing {
    animation: settings-fade-out 0.2s ease-in forwards;
    pointer-events: none;
  }

  &__box {
    animation: settings-sheet-in 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
    width: 100%;
    max-width: 480px;
    max-height: calc(100% - 0.75rem - env(safe-area-inset-top));
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
    padding: 1.25rem 1.25rem 2rem;
    background: var(--bg-card);
    border: var(--border-width) solid var(--border);
    border-bottom: none;
    border-radius: var(--radius-modal) var(--radius-modal) 0 0;
    box-shadow: var(--shadow-modal);
    // Nur Titel und Überschriften in der Comic-Schrift, der Rest normal
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    letter-spacing: normal;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  &.is-closing &__box {
    animation: settings-sheet-out 0.2s ease-in forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    &,
    &__box,
    &.is-closing,
    &.is-closing &__box {
      animation: none;
    }
  }

  // Querformat: als zentrierte Karte mit Abstand oben/unten, Inhalt scrollbar
  @media (orientation: landscape) and (max-height: 600px) {
    --sheet-from: 2rem;
    align-items: center;
    padding:
      calc(0.75rem + env(safe-area-inset-top))
      calc(0.75rem + env(safe-area-inset-right))
      calc(0.75rem + env(safe-area-inset-bottom))
      calc(0.75rem + env(safe-area-inset-left));

    &__box {
      max-height: 100%;
      padding-bottom: 1.25rem;
      border-bottom: var(--border-width) solid var(--border);
      border-radius: var(--radius-modal);
    }
  }

  &__title {
    font-family: 'Bangers', system-ui, sans-serif;
    font-size: 1.35rem;
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--text-primary);
  }

  // Wie die anderen Buttons: Rahmen, Schatten, beim Drücken eingedrückt.
  // .is-pressed hält den Zustand, während das Fenster ausfährt.
  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    background: var(--bg-card);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-btn);
    box-shadow: 2px 2px 0 var(--shadow-color);
    transition: transform 0.08s, box-shadow 0.08s, background 0.08s;

    &:active,
    &.is-pressed {
      transform: translate(2px, 2px);
      box-shadow: none;
      background: var(--bg-secondary);
    }

    .icon {
      width: 18px;
      height: 18px;
      filter: var(--icon-filter);
    }
  }

  &__row {
    margin-bottom: 0.75rem;

    &--pad {
      margin-top: 1.25rem;
    }
  }

  &__label-title {
    display: block;
    font-family: 'Bangers', system-ui, sans-serif;
    font-size: 1.15rem;
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--text-primary);
  }

  &__label-hint {
    display: block;
    margin-top: 0.15rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  &__toggle {
    display: flex;
    gap: 0.5rem;
    padding: 0.25rem;
    background: var(--bg-secondary);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-btn);
  }

  &__lang {
    position: relative;
    display: inline-block;
  }

  &__lang-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.7rem;
    font-size: 1.1rem;
    color: var(--text-primary);
    background: var(--bg-card);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-btn);
    box-shadow: 2px 2px 0 var(--shadow-color);
    transition: transform 0.08s, box-shadow 0.08s;

    &:active {
      transform: translate(2px, 2px);
      box-shadow: none;
    }

    // Pfeil: nach unten, bei offener Liste nach oben
    &::after {
      content: '';
      width: 0.4rem;
      height: 0.4rem;
      margin: 0 0.1rem 0.2rem 0.15rem;
      border: solid currentColor;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      transition: transform 0.15s, margin 0.15s;
    }

    &[aria-expanded='true']::after {
      margin-bottom: -0.2rem;
      transform: rotate(-135deg);
    }

    .icon {
      filter: var(--icon-filter);
    }
  }

  &__lang-code {
    letter-spacing: 0.04em;
  }

  &__lang-list {
    position: absolute;
    top: calc(100% + 0.4rem);
    left: 0;
    z-index: 5;
    min-width: 12rem;
    max-height: 16rem;
    overflow-y: auto;
    padding: 0.25rem;
    list-style: none;
    background: var(--bg-card);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-btn);
    box-shadow: var(--shadow-card);
  }

  &__lang-option {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    padding: 0.55rem 0.6rem;
    font-size: 1.05rem;
    text-align: left;
    color: var(--text-primary);
    border-radius: calc(var(--radius-btn) - 2px);
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: var(--bg-secondary);
    }

    &.is-active {
      color: var(--accent-text);
      background: var(--accent);
    }
  }

  &__lang-option-code {
    min-width: 1.6rem;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    opacity: 0.7;
  }

  &__option {
    flex: 1;
    padding: 0.6rem;
    border-radius: calc(var(--radius-btn) - 2px);
    font-size: 1.1rem;
    color: var(--text-secondary);
    transition: background 0.15s, color 0.15s;

    &--active {
      color: var(--accent-text);
      background: var(--accent);
    }
  }

  // Kreuz-Layout für Padding-Eingaben
  &__cross {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
  }

  &__cross-top,
  &__cross-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  &__cross-mid {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    justify-content: center;
  }

  &__cross-side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;

    &--right {
      align-items: flex-start;
    }
  }

  &__preview {
    position: relative;
    flex-shrink: 0;
    background: var(--bg-secondary);
    border: var(--border-width) solid var(--text-muted);
    border-radius: 6px;
    overflow: hidden;
  }

  &__preview-tile {
    position: absolute;
    background: var(--ink);
    border-radius: 2px;
    transition: inset 0.15s;
  }

  &__pad-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__pad-field {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    padding: 0 0.15rem;
    background: var(--bg-secondary);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-btn);
  }

  &__pad-step {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1;
    color: var(--text-primary);
    border-radius: calc(var(--radius-btn) - 2px);

    &:active {
      background: var(--border);
      color: var(--bg-card);
    }
  }

  &__pad-input {
    width: 2.4rem;
    font-size: 0.95rem;
    font-weight: 700;
    text-align: center;
    padding: 0.1rem 0;
    color: var(--text-primary);
    // Eigene helle Box nur um die Zahl
    background: var(--bg-card);
    border: 1.5px solid var(--border);
    border-radius: 3px;
    outline: none;

    // Spinner-Pfeile ausblenden
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button { -webkit-appearance: none; }
    -moz-appearance: textfield;
  }

  &__version {
    margin-top: 1.5rem;
    font-size: 0.75rem;
    text-align: center;
    color: var(--text-muted);
  }

  &__pad-unit {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
  }
}

@keyframes settings-fade-in {
  from { background-color: transparent; }
}

@keyframes settings-fade-out {
  to { background-color: transparent; }
}

@keyframes settings-sheet-in {
  from { transform: translateY(var(--sheet-from)); opacity: 0; }
}

@keyframes settings-sheet-out {
  to { transform: translateY(var(--sheet-from)); opacity: 0; }
}
</style>
