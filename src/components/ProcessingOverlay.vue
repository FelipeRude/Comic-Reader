<template>
  <div class="processing">
    <div class="processing__box">
      <div class="processing__spinner" />
      <p class="processing__text">Analysiere Seite {{ current }} von {{ total }}…</p>
      <div class="processing__bar">
        <div class="processing__bar-fill" :style="{ width: percent + '%' }" />
      </div>
      <p class="processing__hint">Panels werden erkannt — das passiert nur einmal.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: { type: Number, required: true },
  total: { type: Number, required: true },
})

const percent = computed(() =>
  props.total ? Math.round((props.current / props.total) * 100) : 0
)
</script>

<style lang="scss" scoped>
.processing {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--bg-overlay);

  &__box {
    width: 100%;
    max-width: 320px;
    padding: 2rem 1.5rem;
    text-align: center;
    background: var(--bg-card);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-modal);
    box-shadow: var(--shadow-modal);
  }

  &__spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 1.25rem;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__text {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  &__bar {
    height: 8px;
    background: var(--bg-secondary);
    border-radius: 999px;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 999px;
    transition: width 0.2s ease;
  }

  &__hint {
    margin-top: 1rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
