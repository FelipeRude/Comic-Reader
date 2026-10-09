<template>
  <div class="modal">
    <div class="modal__box" role="dialog" aria-modal="true" aria-labelledby="direction-title">
      <h2 id="direction-title" class="modal__title">{{ t('direction.title') }}</h2>
      <p class="modal__message">{{ t('direction.message') }}</p>

      <div class="modal__options">
        <button
          v-for="opt in OPTIONS"
          :key="opt.value"
          class="modal__option"
          :class="{ 'modal__option--suggested': suggested === opt.value }"
          @click="$emit('select', opt.value)"
        >
          <span class="modal__grid" aria-hidden="true">
            <span v-for="n in opt.order" :key="n">{{ n }}</span>
          </span>
          <span class="modal__option-title">{{ t(opt.title) }}</span>
          <span class="modal__option-hint">{{ t(opt.hint) }}</span>
          <span v-if="suggested === opt.value" class="modal__badge">{{ t('direction.fromPdf') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

defineProps({
  // 'ltr' | 'rtl' | null — Vorschlag aus den PDF-Metadaten
  suggested: { type: String, default: null },
})

defineEmits(['select'])

// order = Ziffern einer 2×2-Seite, zeilenweise von links oben gelesen
const OPTIONS = [
  { value: 'ltr', title: 'direction.comic', hint: 'direction.ltr', order: [1, 2, 3, 4] },
  { value: 'rtl', title: 'direction.manga', hint: 'direction.rtl', order: [2, 1, 4, 3] },
]
</script>

<style lang="scss" scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--bg-overlay);

  &__box {
    width: 100%;
    max-width: 360px;
    padding: 1.5rem;
    background: var(--bg-card);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-modal);
    box-shadow: var(--shadow-modal);
    // Wie in den Einstellungen: nur Überschriften in der Comic-Schrift
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    letter-spacing: normal;
  }

  &__title {
    font-family: 'Bangers', system-ui, sans-serif;
    font-size: 1.35rem;
    font-weight: 400;
    letter-spacing: 0.04em;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
  }

  &__message {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-secondary);
    margin-bottom: 1.25rem;
  }

  &__options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  &__option {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 1rem 0.5rem 0.85rem;
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

    &--suggested {
      background: var(--accent);
      color: var(--accent-text);
    }
  }

  // Mini-Seite mit 2×2 Panels und ihrer Lesereihenfolge
  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1.6rem);
    gap: 0.2rem;
    margin-bottom: 0.35rem;

    span {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 1.6rem;
      font-size: 0.8rem;
      font-weight: 700;
      border: 2px solid currentColor;
      border-radius: 3px;
    }
  }

  &__option-title {
    font-family: 'Bangers', system-ui, sans-serif;
    font-size: 1.3rem;
    letter-spacing: 0.04em;
  }

  &__option-hint {
    font-size: 0.8rem;
    opacity: 0.75;
  }

  &__badge {
    position: absolute;
    top: -0.6rem;
    right: -0.4rem;
    padding: 0.1rem 0.4rem;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-primary);
    background: var(--bg-card);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-btn);
  }
}
</style>
