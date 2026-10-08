<template>
  <DashboardView v-if="view === 'dashboard'" @open="openReader" />
  <ReaderView
    v-else
    :key="activeComicId"
    :comic-id="activeComicId"
    @back="closeReader"
  />
</template>

<script setup>
import { ref } from 'vue'
import DashboardView from './views/DashboardView.vue'
import ReaderView from './views/ReaderView.vue'

// Offenen Comic merken, damit ein automatischer Update-Reload
// direkt wieder im Reader landet (Lesestand liegt in der IndexedDB).
const OPEN_KEY = 'cr-open-comic'

function readOpenComic() {
  try {
    const id = parseInt(sessionStorage.getItem(OPEN_KEY), 10)
    return Number.isNaN(id) ? null : id
  } catch { return null }
}

function writeOpenComic(id) {
  try {
    id == null ? sessionStorage.removeItem(OPEN_KEY) : sessionStorage.setItem(OPEN_KEY, String(id))
  } catch {}
}

const activeComicId = ref(readOpenComic())
// ?import=1: Übergabe vom Drop-Feld der Startseite, das importiert die Bibliothek (DashboardView)
const importRequested = new URLSearchParams(location.search).has('import')
const view = ref(activeComicId.value != null && !importRequested ? 'reader' : 'dashboard')

function openReader(id) {
  activeComicId.value = id
  view.value = 'reader'
  writeOpenComic(id)
}

function closeReader() {
  view.value = 'dashboard'
  writeOpenComic(null)
}
</script>
