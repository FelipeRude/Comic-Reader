<template>
  <main class="dashboard">
    <header class="dashboard__header">
      <h1 class="dashboard__title"><img :src="logoSrc" class="dashboard__logo" width="40" height="40" alt="" /><span class="dashboard__name">PanelZoom<span class="dashboard__tag">Comic-Reader</span></span></h1>
      <div class="dashboard__actions">
        <button v-if="canInstall" class="dashboard__install" @click="promptInstall">
          {{ t('dashboard.install') }}
        </button>
        <button class="dashboard__settings" :aria-label="t('common.settings')" @click="showSettings = true">
          <img src="/UI-Icons/Settings-Cog-Double-1 Streamline Freehand.svg" class="icon" width="24" height="24" alt="" aria-hidden="true" />
        </button>
      </div>
    </header>

    <button class="dashboard__add" :disabled="importing" @click="triggerFilePicker">
      <img src="/UI-Icons/Add-Sign-Bold Streamline Freehand.svg" class="icon" width="20" height="20" alt="" aria-hidden="true" />
      <span v-if="importing">{{ t('dashboard.importing') }}</span>
      <span v-else>{{ t('dashboard.add') }}</span>
    </button>
    <input
      ref="fileInput"
      type="file"
      accept="application/pdf,.pdf"
      hidden
      @change="onFileSelected"
    />

    <section v-if="comics.length" class="dashboard__grid">
      <ComicCard
        v-for="comic in comics"
        :key="comic.id"
        :comic="comic"
        :progress="progressMap[comic.id]"
        @open="onOpen"
        @delete="askDelete"
      />
    </section>

    <p v-else-if="migrating" class="dashboard__empty-hint">{{ t('dashboard.preparing') }}</p>

    <div v-else-if="!loading" class="dashboard__empty">
      <div class="dashboard__empty-icon">
        <img src="/UI-Icons/Book-Flip-Page Streamline Freehand.svg" class="icon" width="48" height="48" alt="" aria-hidden="true" />
      </div>
      <p class="dashboard__empty-text">{{ t('dashboard.emptyTitle') }}</p>
      <p class="dashboard__empty-hint">{{ t('dashboard.emptyHint') }}</p>
    </div>

    <SettingsModal v-if="showSettings" @close="showSettings = false" />

    <ConfirmModal
      v-if="comicToDelete"
      :title="t('dashboard.deleteTitle')"
      :message="t('dashboard.deleteMessage', { title: comicToDelete.title })"
      :confirm-label="t('dashboard.deleteConfirm')"
      danger
      @confirm="confirmDelete"
      @cancel="comicToDelete = null"
    />

    <ConfirmModal
      v-if="quotaError"
      :title="t('dashboard.quotaTitle')"
      :message="t('dashboard.quotaMessage')"
      :confirm-label="t('common.gotIt')"
      :show-cancel="false"
      @confirm="dismissQuota"
      @cancel="dismissQuota"
    />

    <ConfirmModal
      v-if="importError"
      :title="t('dashboard.importFailedTitle')"
      :message="t('dashboard.importFailedMessage', { error: importError.message || importError })"
      :confirm-label="t('common.gotIt')"
      :show-cancel="false"
      @confirm="importError = null"
      @cancel="importError = null"
    />
  </main>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import ComicCard from '../components/ComicCard.vue'
import SettingsModal from '../components/SettingsModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { useComicImport } from '../composables/useComicImport.js'
import { useInstallPrompt } from '../composables/useInstallPrompt.js'
import { useI18n } from '../composables/useI18n.js'
import { getAllComics, deleteComic, migrateBlobsToOpfs } from '../storage/comics.js'
import { getProgress, deleteProgress } from '../storage/progress.js'
import { consumeImportParam, takeHandoffFile } from '../storage/handoff.js'

const emit = defineEmits(['open'])
// Dasselbe Logo wie auf der Landingpage (site/public/logo.svg)
const logoSrc = `${import.meta.env.BASE_URL}img/pwa/logo.svg`

const { t } = useI18n()
const { canInstall, promptInstall } = useInstallPrompt()
const { importing, quotaError, error: importError, importFile } = useComicImport()

const comics = ref([])
const progressMap = reactive({})
const loading = ref(true)
const migrating = ref(false)
const showSettings = ref(false)
const comicToDelete = ref(null)
const fileInput = ref(null)

async function loadLibrary() {
  loading.value = true
  comics.value = await getAllComics()
  for (const comic of comics.value) {
    progressMap[comic.id] = (await getProgress(comic.id)) || null
  }
  loading.value = false
}

function triggerFilePicker() {
  fileInput.value?.click()
}

async function onFileSelected(event) {
  const file = event.target.files?.[0]
  event.target.value = '' // erlaubt erneute Auswahl derselben Datei
  if (!file) return
  const id = await importFile(file)
  if (id != null) await loadLibrary()
}

// Panels werden live im Reader erkannt → sofort öffnen.
function onOpen(comic) {
  emit('open', comic.id)
}

function dismissQuota() {
  quotaError.value = false
}

function askDelete(comic) {
  comicToDelete.value = comic
}

async function confirmDelete() {
  const id = comicToDelete.value.id
  comicToDelete.value = null
  await Promise.all([
    deleteComic(id),
    deleteProgress(id),
  ])
  await loadLibrary()
}

// Alte Comics (PDF im IndexedDB-Record) einmalig ins OPFS verschieben,
// bevor getAll() sonst alle PDFs auf einmal in den RAM lädt.
onMounted(async () => {
  migrating.value = true
  try {
    await migrateBlobsToOpfs()
  } finally {
    migrating.value = false
  }
  await loadLibrary()

  // Von der Startseite (Drop-Feld) übergebene PDF importieren und direkt öffnen
  if (consumeImportParam()) {
    const file = await takeHandoffFile()
    if (!file) return
    const id = await importFile(file)
    if (id != null) {
      await loadLibrary()
      emit('open', id)
    }
  }
})
</script>

<style lang="scss" scoped>
.dashboard {
  min-height: 100vh;
  padding: calc(1.5rem + env(safe-area-inset-top)) calc(1.25rem + env(safe-area-inset-right)) calc(2rem + env(safe-area-inset-bottom)) calc(1.25rem + env(safe-area-inset-left));

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  // Größen wie .brand auf der Landingpage (site/styles/site.scss)
  &__title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.8rem;
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--text-primary);

    @media (max-width: 400px) { font-size: 1.5rem; }
  }

  // Logo so hoch wie Name und Unterzeile zusammen
  &__logo {
    width: 1.55em;
    height: 1.55em;
    flex: none;
  }

  &__name {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }

  &__tag {
    margin-top: 0.15em;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    font-size: 0.55em;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__install {
    padding: 0.45rem 0.85rem;
    font-size: 1.1rem;
    color: var(--accent-text);
    background: var(--accent);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-btn);
    box-shadow: 2px 2px 0 var(--border);
    transition: transform 0.08s, box-shadow 0.08s;

    &:active {
      transform: translate(2px, 2px);
      box-shadow: none;
    }
  }

  &__settings {
    color: var(--text-secondary);

    .icon {
      filter: var(--icon-filter);
    }
  }

  &__add {
    width: 100%;
    padding: 0.9rem;
    margin-bottom: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1.3rem;
    color: var(--accent-text);
    background: var(--accent);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-btn);
    box-shadow: 3px 3px 0 var(--border);
    transition: transform 0.08s, box-shadow 0.08s;

    &:active {
      transform: translate(3px, 3px);
      box-shadow: none;
    }

    .icon {
      filter: var(--accent-icon-filter);
    }

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }

  &__empty {
    margin-top: 5rem;
    text-align: center;

    &-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 1rem;

      .icon {
        filter: var(--icon-filter);
        width: 64px;
        height: 64px;
      }
    }

    &-text {
      margin-top: 0.5rem;
      font-size: 1.2rem;
      color: var(--text-primary);
    }

    &-hint {
      margin-top: 0.35rem;
      font-size: 1rem;
      color: var(--text-muted);
    }
  }
}
</style>
