<template>
  <article class="card" @click="$emit('open', comic)">
    <div class="card__cover">
      <img
        v-if="comic.coverDataUrl"
        :src="comic.coverDataUrl"
        :alt="comic.title"
        class="card__img"
        loading="lazy"
      />
      <div v-else class="card__img card__img--placeholder">
        <img src="/UI-Icons/Book-Flip-Page Streamline Freehand.svg" class="icon" width="48" height="48" alt="" aria-hidden="true" />
      </div>

      <button
        class="card__delete"
        aria-label="Comic löschen"
        @click.stop="$emit('delete', comic)"
      >
        <img src="/UI-Icons/Delete-Bin-2 Streamline Freehand.svg" class="icon" width="18" height="18" alt="" aria-hidden="true" />
      </button>

      <span v-if="progress" class="card__badge">
        Seite {{ progress.pageIndex + 1 }}/{{ comic.pageCount }}
      </span>
    </div>

    <div class="card__meta">
      <h3 class="card__title">{{ comic.title }}</h3>
      <p class="card__pages">{{ comic.pageCount }} Seiten</p>
    </div>
  </article>
</template>

<script setup>
defineProps({
  comic: { type: Object, required: true },
  progress: { type: Object, default: null },
})

defineEmits(['open', 'delete'])
</script>

<style lang="scss" scoped>
.card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border);
  box-shadow: var(--shadow-card);
  transition: transform 0.08s, box-shadow 0.08s;

  &:active {
    transform: translate(3px, 3px);
    box-shadow: none;
  }

  &__cover {
    position: relative;
    aspect-ratio: 3 / 4;
    background: var(--bg-secondary);
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;

    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;

      .icon {
        filter: var(--icon-filter);
      }
    }
  }

  &__delete {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: #fff;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);

    .icon {
      filter: invert(1);
    }
  }

  &__badge {
    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;
    padding: 0.2rem 0.5rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: #fff;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 999px;
  }

  &__meta {
    padding: 0.6rem 0.7rem 0.8rem;
  }

  &__title {
    font-size: 1rem;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__pages {
    margin-top: 0.15rem;
    font-size: 0.85rem;
    color: var(--text-muted);
  }
}
</style>
