<script setup lang="ts">
definePageMeta({
  pageTransition: {
    name: 'inspiration-category',
    mode: 'out-in'
  }
})
</script>

<template>
  <div class="inspiration-category-page">
    <InspirationArchivePage category="all" />
  </div>
</template>
