<template>
  <div class="success" @click.self="$emit('close')">
    <div class="success__box" role="dialog" aria-modal="true">
      <div class="success__icon">
        <img src="/UI-Icons/check.svg" class="icon" width="28" height="28" alt="" aria-hidden="true" />
      </div>
      <h2 class="success__title">Erfolgreich!</h2>
      <p class="success__message">
        {{ pages }} {{ pages === 1 ? 'Seite' : 'Seiten' }} und
        {{ panels }} {{ panels === 1 ? 'Panel' : 'Panels' }} gefunden.
      </p>
      <button class="success__btn" @click="$emit('close')">Los geht's</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  pages: { type: Number, required: true },
  panels: { type: Number, required: true },
})

defineEmits(['close'])
</script>

<style lang="scss" scoped>
.success {
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
    border-radius: var(--radius-modal);
    box-shadow: var(--shadow-modal);
  }

  &__icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    border-radius: 50%;

    .icon {
      filter: invert(1);
    }
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  &__message {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  &__btn {
    width: 100%;
    padding: 0.8rem;
    font-size: 0.95rem;
    font-weight: 700;
    color: #fff;
    background: var(--accent);
    border-radius: var(--radius-btn);
    transition: opacity 0.15s;

    &:active {
      opacity: 0.8;
    }
  }
}
</style>
