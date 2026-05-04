<script setup lang="ts">
import { Page } from '@vben/common-ui'

import EmployeeManagementWorkspace from './employee-management-workspace.vue'
</script>

<template>
  <Page title="员工管理">
    <div class="employee-management-page">
      <EmployeeManagementWorkspace />
    </div>
  </Page>
</template>

<style scoped>
.employee-management-page {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>
