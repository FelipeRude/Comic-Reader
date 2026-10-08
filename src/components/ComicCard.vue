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
        :aria-label="t('card.delete')"
        @click.stop="$emit('delete', comic)"
      >
        <img src="/UI-Icons/Delete-Bin-2-Filled.svg" class="icon" width="18" height="18" alt="" aria-hidden="true" />
      </button>
    </div>

    <div class="card__meta">
      <h3 class="card__title">{{ comic.title }}</h3>
      <p class="card__info">
        <span>{{ t('card.progress', { page: currentPage, total: comic.pageCount }) }}</span>
        <span class="card__percent">{{ t('card.percent', { percent }) }}</span>
      </p>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  comic: { type: Object, required: true },
  progress: { type: Object, default: null },
})

// Noch nie geöffnet → Seite 1, 0 %. Sonst gilt die aktuelle Seite als gelesen.
const currentPage = computed(() => (props.progress ? props.progress.pageIndex + 1 : 1))
const percent = computed(() =>
  props.progress && props.comic.pageCount
    ? Math.round((currentPage.value / props.comic.pageCount) * 100)
    : 0,
)

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


  // Dunkler Fuß mit Titel, Seite und Fortschritt
  &__meta {
    padding: 0.6rem 0.7rem 0.7rem;
    background: var(--ink);
    border-top: var(--border-width) solid var(--border);
  }

  &__title {
    font-size: 1rem;
    color: var(--cream);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__info {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: 0.15rem;
    font-size: 0.85rem;
    color: rgba(255, 254, 240, 0.7);
  }

  &__percent {
    color: var(--cream);
  }
}
</style>
