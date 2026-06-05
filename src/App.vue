<template>
  <DashboardView v-if="view === 'dashboard'" @open="openReader" />
  <ReaderView
    v-else
    :key="activeComicId"
    :comic-id="activeComicId"
    @back="view = 'dashboard'"
  />
</template>

<script setup>
import { ref } from 'vue'
import DashboardView from './views/DashboardView.vue'
import ReaderView from './views/ReaderView.vue'

const view = ref('dashboard')
const activeComicId = ref(null)

function openReader(id) {
  activeComicId.value = id
  view.value = 'reader'
}
</script>
