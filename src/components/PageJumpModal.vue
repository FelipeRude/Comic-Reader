<template>
  <div class="pagejump" :class="{ 'is-closing': closing }" @click.self="close" @animationend.self="onAnimationEnd">
    <div class="pagejump__box" role="dialog" aria-modal="true">
      <header class="pagejump__header">
        <h2 class="pagejump__title">{{ t('pageJump.title') }}</h2>
        <button class="pagejump__close" :class="{ 'is-pressed': closing && !pendingJump }" :aria-label="t('common.close')" @click="close">
          <img src="/UI-Icons/Keyboard-Asterisk-2-Filled.svg" class="icon" width="22" height="22" alt="" aria-hidden="true" />
        </button>
      </header>

      <div class="pagejump__body">
      <div class="pagejump__field">
        <input
          ref="inputEl"
          v-model="value"
          class="pagejump__input"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          :placeholder="String(currentPage + 1)"
          @keydown.enter="confirm"
        />
        <span class="pagejump__of">/ {{ n(totalPages) }}</span>
      </div>

      <button class="pagejump__confirm" :disabled="!isValid" @click="confirm">
        {{ t('pageJump.confirm') }}
      </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'

const { t, n } = useI18n()

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages:  { type: Number, required: true },
})
const emit = defineEmits(['jump', 'close'])

const inputEl = ref(null)
const value = ref(String(props.currentPage + 1))

const parsed = computed(() => parseInt(value.value, 10))
const isValid = computed(() =>
  !isNaN(parsed.value) && parsed.value >= 1 && parsed.value <= props.totalPages
)

// Schließen mit Animation: erst ausfahren, dann melden (Sprung oder Schließen).
// Ohne Animation (reduzierte Bewegung) oder falls animationend ausbleibt: direkt.
const closing = ref(false)
const pendingJump = ref(null)
let closeTimer = null

function finish() {
  clearTimeout(closeTimer)
  if (pendingJump.value !== null) emit('jump', pendingJump.value)
  else emit('close')
}

function close() {
  if (closing.value) return
  closing.value = true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return finish()
  closeTimer = setTimeout(finish, 400)
}

function onAnimationEnd() {
  if (closing.value) finish()
}

function confirm() {
  if (!isValid.value || closing.value) return
  pendingJump.value = parsed.value - 1
  close()
}

onMounted(() => {
  inputEl.value?.select()
  inputEl.value?.focus()
})
</script>

<style lang="scss" scoped>
.pagejump {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--bg-overlay);
  animation: pagejump-fade-in 0.22s ease-out;

  &.is-closing {
    animation: pagejump-fade-out 0.2s ease-in forwards;
    pointer-events: none;
  }

  &__box {
    animation: pagejump-drop-in 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
    width: 100%;
    max-width: 480px;
    margin-top: calc(3rem + env(safe-area-inset-top));
    padding: 1.25rem 1.25rem 2rem;
    background: var(--bg-card);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-modal);
    box-shadow: var(--shadow-modal);
  }

  &.is-closing &__box {
    animation: pagejump-drop-out 0.2s ease-in forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    &,
    &__box,
    &.is-closing,
    &.is-closing &__box {
      animation: none;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  // Wie in den Einstellungen: Rahmen, Schatten, beim Drücken eingedrückt.
  // .is-pressed hält den Zustand, während der Dialog ausfährt.
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

  &__field {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  &__input {
    width: 6rem;
    padding: 0.6rem 0.75rem;
    font-size: 1.5rem;
    text-align: center;
    color: var(--text-primary);
    background: var(--bg-secondary);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-btn);
    outline: none;
  }

  &__of {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-muted);
    white-space: nowrap;
  }

  &__confirm {
    width: 100%;
    padding: 0.9rem;
    font-size: 1.3rem;
    color: var(--accent-text);
    background: var(--accent);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-btn);
    box-shadow: 3px 3px 0 var(--shadow-color);
    transition: transform 0.08s, box-shadow 0.08s;

    &:active {
      transform: translate(3px, 3px);
      box-shadow: none;
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }

  // Querformat: Tastatur verdeckt die untere Hälfte → Button neben das Input
  @media (orientation: landscape) and (max-height: 600px) {
    &__box {
      margin-top: calc(0.75rem + env(safe-area-inset-top));
      padding: 1rem 1.25rem 1.25rem;
    }

    &__header {
      margin-bottom: 1rem;
    }

    &__body {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    &__field {
      margin-bottom: 0;
    }

    &__confirm {
      flex: 1;
      padding: 0.6rem 0.9rem;
    }
  }
}

@keyframes pagejump-fade-in {
  from { background-color: transparent; }
}

@keyframes pagejump-fade-out {
  to { background-color: transparent; }
}

// Der Dialog sitzt oben, deshalb gleitet er von oben herein und wieder hinaus
@keyframes pagejump-drop-in {
  from { transform: translateY(-2rem); opacity: 0; }
}

@keyframes pagejump-drop-out {
  to { transform: translateY(-2rem); opacity: 0; }
}
</style>
