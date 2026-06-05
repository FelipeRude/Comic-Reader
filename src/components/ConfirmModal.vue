<template>
  <div class="modal" @click.self="$emit('cancel')">
    <div class="modal__box" role="dialog" aria-modal="true">
      <h2 v-if="title" class="modal__title">{{ title }}</h2>
      <p class="modal__message">{{ message }}</p>
      <div class="modal__actions">
        <button
          v-if="showCancel"
          class="modal__btn modal__btn--ghost"
          @click="$emit('cancel')"
        >
          {{ cancelLabel }}
        </button>
        <button
          class="modal__btn"
          :class="danger ? 'modal__btn--danger' : 'modal__btn--primary'"
          @click="$emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: 'OK' },
  cancelLabel: { type: String, default: 'Abbrechen' },
  showCancel: { type: Boolean, default: true },
  danger: { type: Boolean, default: false },
})

defineEmits(['confirm', 'cancel'])
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
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
  }

  &__message {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  &__btn {
    padding: 0.6rem 1.1rem;
    font-size: 1.2rem;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-btn);
    box-shadow: 2px 2px 0 var(--border);
    transition: transform 0.08s, box-shadow 0.08s;

    &:active {
      transform: translate(2px, 2px);
      box-shadow: none;
    }

    &--ghost {
      color: var(--text-primary);
      background: var(--bg-card);
    }

    &--primary {
      color: var(--accent-text);
      background: var(--accent);
    }

    &--danger {
      color: #fff;
      background: #c0392b;
      border-color: #c0392b;
      box-shadow: 2px 2px 0 #8b0000;
    }
  }
}
</style>
