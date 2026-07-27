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
  box-sizing: border-box;
  margin: 0 auto;
  min-width: 0;
  padding: 18px;
  width: 100%;
}

@media (max-width: 640px) {
  .tenant-workbench-home {
    padding: 12px;
  }
}
</style>
