<script lang="ts" setup>
import TaskWorkbenchSection from './components/collaboration-task/task-workbench-section.vue';
</script>

<template>
  <main class="tenant-workbench-home">
    <TaskWorkbenchSection />
  </main>
</template>

<style scoped>
.tenant-workbench-home {
  margin: 0 auto;
  max-width: 1320px;
  min-width: 0;
  padding: 18px;
}

@media (max-width: 640px) {
  .tenant-workbench-home {
    padding: 12px;
  }
}
</style>
