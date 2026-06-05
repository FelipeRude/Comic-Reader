<template>
  <div class="settings" @click.self="$emit('close')">
    <div class="settings__box" role="dialog" aria-modal="true">
      <header class="settings__header">
        <h2 class="settings__title">Einstellungen</h2>
        <button class="settings__close" aria-label="Schließen" @click="$emit('close')">
          <img src="/UI-Icons/Keyboard-Asterisk-2 Streamline Freehand.svg" class="icon" width="22" height="22" alt="" aria-hidden="true" />
        </button>
      </header>

      <!-- Panel-Übergang -->
      <div class="settings__row">
        <div class="settings__label">
          <span class="settings__label-title">Panel-Übergang</span>
          <span class="settings__label-hint">Wie zwischen Panels gewechselt wird</span>
        </div>
      </div>
      <div class="settings__toggle">
        <button
          class="settings__option"
          :class="{ 'settings__option--active': animation === 'smooth' }"
          @click="setAnimation('smooth')"
        >
          Weiche Kamerafahrt
        </button>
        <button
          class="settings__option"
          :class="{ 'settings__option--active': animation === 'instant' }"
          @click="setAnimation('instant')"
        >
          Instantan
        </button>
      </div>

      <!-- Zoom-Abstand -->
      <div class="settings__row settings__row--pad">
        <div class="settings__label">
          <span class="settings__label-title">Zoom-Abstand</span>
          <span class="settings__label-hint">Abstand zum Rand beim Panel-Zoom (in %)</span>
        </div>
      </div>

      <div class="settings__cross">
        <div class="settings__cross-top">
          <label class="settings__pad-label">Oben</label>
          <div class="settings__pad-field">
            <input class="settings__pad-input" type="number" inputmode="decimal" min="0" max="20" step="0.5" v-model.number="localTop" @change="save('top', localTop)" />
            <span class="settings__pad-unit">%</span>
          </div>
        </div>

        <div class="settings__cross-mid">
          <div class="settings__cross-side">
            <label class="settings__pad-label">Links</label>
            <div class="settings__pad-field">
              <input class="settings__pad-input" type="number" inputmode="decimal" min="0" max="20" step="0.5" v-model.number="localLeft" @change="save('left', localLeft)" />
              <span class="settings__pad-unit">%</span>
            </div>
          </div>

          <div class="settings__cross-box" aria-hidden="true" />

          <div class="settings__cross-side settings__cross-side--right">
            <label class="settings__pad-label">Rechts</label>
            <div class="settings__pad-field">
              <input class="settings__pad-input" type="number" inputmode="decimal" min="0" max="20" step="0.5" v-model.number="localRight" @change="save('right', localRight)" />
              <span class="settings__pad-unit">%</span>
            </div>
          </div>
        </div>

        <div class="settings__cross-bottom">
          <label class="settings__pad-label">Unten</label>
          <div class="settings__pad-field">
            <input class="settings__pad-input" type="number" inputmode="decimal" min="0" max="20" step="0.5" v-model.number="localBottom" @change="save('bottom', localBottom)" />
            <span class="settings__pad-unit">%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSettings } from '../composables/useSettings.js'

defineEmits(['close'])

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

function save(side, value) {
  setPaddingSide(side, value)
}
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

  &__box {
    width: 100%;
    max-width: 480px;
    padding: 1.25rem 1.25rem 2rem;
    background: var(--bg-card);
    border-radius: var(--radius-modal) var(--radius-modal) 0 0;
    box-shadow: var(--shadow-modal);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__close {
    color: var(--text-secondary);

    .icon {
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
    font-size: 0.95rem;
    font-weight: 600;
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
    border-radius: var(--radius-btn);
  }

  &__option {
    flex: 1;
    padding: 0.6rem;
    border-radius: calc(var(--radius-btn) - 2px);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    transition: background 0.15s, color 0.15s;

    &--active {
      color: #fff;
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

  &__cross-box {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border: 2px solid var(--text-muted);
    border-radius: 6px;
    opacity: 0.35;
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
    gap: 0.25rem;
    padding: 0.3rem 0.5rem;
    background: var(--bg-secondary);
    border-radius: var(--radius-btn);
  }

  &__pad-input {
    width: 3.5rem;
    font-size: 0.95rem;
    font-weight: 700;
    text-align: center;
    color: var(--text-primary);
    background: transparent;
    outline: none;

    // Spinner-Pfeile ausblenden
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button { -webkit-appearance: none; }
    -moz-appearance: textfield;
  }

  &__pad-unit {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
  }
}
</style>
