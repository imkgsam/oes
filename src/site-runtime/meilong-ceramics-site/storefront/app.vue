<script setup lang="ts">
// Keeps committed exposure head ownership alive across SSR hydration and client navigation.
useSiteRouteHead()
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <GlobalBackToTop />
</template>
