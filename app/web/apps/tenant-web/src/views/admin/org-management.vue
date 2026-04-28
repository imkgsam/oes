<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { Page } from '@vben/common-ui'

import { useAuthContextStore } from '#/store/auth-context'

import OrgManagementWorkspace from './org-management-workspace.vue'

const authContextStore = useAuthContextStore()
const route = useRoute()
const pageMode = computed(() =>
  route.meta.orgManagementMode === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
)
const pageTitle = computed(() =>
  pageMode.value === 'SYSTEM' && authContextStore.isPlatformScope
    ? '平台级组织架构管理'
    : '本租户组织架构管理'
)
</script>

<template>
  <Page :title="pageTitle">
    <div class="org-management-page">
      <OrgManagementWorkspace :management-mode="pageMode" />
    </div>
  </Page>
</template>

<style scoped>
.org-management-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
