<template>
  <div class="pagejump" @click.self="$emit('close')">
    <div class="pagejump__box" role="dialog" aria-modal="true">
      <header class="pagejump__header">
        <h2 class="pagejump__title">Zu Seite springen</h2>
        <button class="pagejump__close" aria-label="Schließen" @click="$emit('close')">
          <img src="/UI-Icons/Keyboard-Asterisk-2 Streamline Freehand.svg" class="icon" width="22" height="22" alt="" aria-hidden="true" />
        </button>
      </header>

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
        <span class="pagejump__of">/ {{ totalPages }}</span>
      </div>

      <button class="pagejump__confirm" :disabled="!isValid" @click="confirm">
        Springen
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

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

function confirm() {
  if (!isValid.value) return
  emit('jump', parsed.value - 1)
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

  &__box {
    width: 100%;
    max-width: 480px;
    margin-top: calc(3rem + env(safe-area-inset-top));
    padding: 1.25rem 1.25rem 2rem;
    background: var(--bg-card);
    border-radius: var(--radius-modal);
    box-shadow: var(--shadow-modal);
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

  &__close {
    color: var(--text-secondary);

    .icon {
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
    font-weight: 700;
    text-align: center;
    color: var(--text-primary);
    background: var(--bg-secondary);
    border: 2px solid transparent;
    border-radius: var(--radius-btn);
    outline: none;
    transition: border-color 0.15s;

    &:focus {
      border-color: var(--accent);
    }
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
    font-size: 0.95rem;
    font-weight: 700;
    color: #fff;
    background: var(--accent);
    border-radius: var(--radius-btn);
    transition: opacity 0.15s;

    &:active {
      opacity: 0.8;
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }
}
</style>
