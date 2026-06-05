<template>
  <main class="dashboard">
    <header class="dashboard__header">
      <h1 class="dashboard__title">Comic Reader</h1>
      <div class="dashboard__actions">
        <button v-if="canInstall" class="dashboard__install" @click="promptInstall">
          Installieren
        </button>
        <button class="dashboard__settings" aria-label="Einstellungen" @click="showSettings = true">
          <img src="/UI-Icons/Settings-Cog-Double-1 Streamline Freehand.svg" class="icon" width="24" height="24" alt="" aria-hidden="true" />
        </button>
      </div>
    </header>

    <button class="dashboard__add" :disabled="importing" @click="triggerFilePicker">
      <img src="/UI-Icons/Add-Sign-Bold Streamline Freehand.svg" class="icon" width="20" height="20" alt="" aria-hidden="true" />
      <span v-if="importing">Importiere…</span>
      <span v-else>Neuen Comic hinzufügen</span>
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

    <div v-else-if="!loading" class="dashboard__empty">
      <div class="dashboard__empty-icon">
        <img src="/UI-Icons/Book-Flip-Page Streamline Freehand.svg" class="icon" width="48" height="48" alt="" aria-hidden="true" />
      </div>
      <p class="dashboard__empty-text">Noch keine Comics.</p>
      <p class="dashboard__empty-hint">Füge dein erstes hinzu.</p>
    </div>

    <SettingsModal v-if="showSettings" @close="showSettings = false" />

    <ConfirmModal
      v-if="comicToDelete"
      title="Comic löschen?"
      :message="`„${comicToDelete.title}“ wird mit Lesestand und allen Panel-Daten unwiderruflich gelöscht.`"
      confirm-label="Löschen"
      danger
      @confirm="confirmDelete"
      @cancel="comicToDelete = null"
    />

    <ConfirmModal
      v-if="quotaError || preprocQuota"
      title="Speicher voll"
      message="Nicht genügend Speicherplatz im Browser verfügbar. Bitte lösche alte Comics vom Dashboard, um Platz zu schaffen."
      confirm-label="Verstanden"
      :show-cancel="false"
      @confirm="dismissQuota"
      @cancel="dismissQuota"
    />

    <ProcessingOverlay v-if="running" :current="current" :total="total" />

    <ProcessingSuccessModal
      v-if="successInfo"
      :pages="successInfo.pages"
      :panels="successInfo.panels"
      @close="onSuccessClose"
    />
  </main>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import ComicCard from '../components/ComicCard.vue'
import SettingsModal from '../components/SettingsModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import ProcessingOverlay from '../components/ProcessingOverlay.vue'
import ProcessingSuccessModal from '../components/ProcessingSuccessModal.vue'
import { useComicImport } from '../composables/useComicImport.js'
import { usePreprocessor } from '../composables/usePreprocessor.js'
import { useInstallPrompt } from '../composables/useInstallPrompt.js'
import { getAllComics, deleteComic } from '../storage/comics.js'
import { getProgress, deleteProgress } from '../storage/progress.js'
import { deletePanelsForComic, getAllPanelsForComic } from '../storage/panels.js'

const emit = defineEmits(['open'])

const { canInstall, promptInstall } = useInstallPrompt()
const { importing, quotaError, importFile } = useComicImport()
const {
  current,
  total,
  totalPanels,
  running,
  quotaError: preprocQuota,
  process: preprocess,
} = usePreprocessor()

const comics = ref([])
const progressMap = reactive({})
const loading = ref(true)
const showSettings = ref(false)
const comicToDelete = ref(null)
const fileInput = ref(null)
const successInfo = ref(null)

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

async function onOpen(comic) {
  // Bereits analysiert? → direkt zum Reader (Phase 5; vorerst Konsolenausgabe).
  const existing = await getAllPanelsForComic(comic.id)
  if (existing.length > 0) {
    openReader(comic)
    return
  }

  // Erstes Öffnen → einmalige Panel-Analyse, danach Erfolgsmeldung.
  const ok = await preprocess(comic)
  if (ok) {
    successInfo.value = { comic, pages: total.value, panels: totalPanels.value }
  }
}

function openReader(comic) {
  emit('open', comic.id)
}

function onSuccessClose() {
  const comic = successInfo.value?.comic
  successInfo.value = null
  if (comic) openReader(comic)
}

function dismissQuota() {
  quotaError.value = false
  preprocQuota.value = false
}

function askDelete(comic) {
  comicToDelete.value = comic
}

async function confirmDelete() {
  const id = comicToDelete.value.id
  comicToDelete.value = null
  await Promise.all([
    deleteComic(id),
    deletePanelsForComic(id),
    deleteProgress(id),
  ])
  await loadLibrary()
}

onMounted(loadLibrary)
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

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__install {
    padding: 0.45rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: #fff;
    background: var(--accent);
    border-radius: var(--radius-btn);
    transition: opacity 0.15s;

    &:active {
      opacity: 0.8;
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
    font-size: 0.95rem;
    font-weight: 700;
    color: #fff;
    background: var(--accent);
    border-radius: var(--radius-btn);
    transition: opacity 0.15s;

    &:active {
      opacity: 0.8;
    }

    .icon {
      filter: invert(1);
    }

    &:disabled {
      opacity: 0.6;
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
      margin-bottom: 0.5rem;

      .icon {
        filter: var(--icon-filter);
      }
    }

    &-text {
      margin-top: 1rem;
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    &-hint {
      margin-top: 0.35rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
  }
}
</style>
