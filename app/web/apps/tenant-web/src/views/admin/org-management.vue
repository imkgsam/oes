<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import { Card, Tag } from 'ant-design-vue'

import { useAuthContextStore } from '#/store/auth-context'

import OrgManagementWorkspace from './org-management-workspace.vue'

const authContextStore = useAuthContextStore()
const route = useRoute()
const router = useRouter()
const pageMode = computed(() =>
  route.meta.orgManagementMode === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
)
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const pageTitle = computed(() =>
  pageMode.value === 'SYSTEM' && authContextStore.isPlatformScope
    ? '平台级组织架构管理'
    : '本租户组织架构管理'
)
const pageDescription = computed(() =>
  pageMode.value === 'SYSTEM' && authContextStore.isPlatformScope
    ? '平台管理员先选择 tenant，再进入该 tenant 的 org tree / org node 管理。'
    : '租户管理员在当前租户上下文内维护 org tree / org node，不跨租户操作。'
)
const selectedOrgUnitId = computed(() =>
  typeof route.query?.orgUnitId === 'string' ? route.query.orgUnitId : ''
)

/** syncSelectedOrgUnitId persists the selected org node into the current route query for both system and tenant entries. */
function syncSelectedOrgUnitId(orgUnitId: string) {
  void router.replace({
    query: {
      ...(route.query ?? {}),
      orgUnitId: orgUnitId || undefined,
    },
  })
}
</script>

<template>
  <Page>
    <div class="org-management-page">
      <Card :bordered="false" class="org-management__hero">
        <div class="org-management__hero-top">
          <div>
            <h1 class="org-management__title">{{ pageTitle }}</h1>
            <p class="org-management__description">{{ pageDescription }}</p>
          </div>
          <Tag color="blue">
            {{ pageMode === 'SYSTEM' && authContextStore.isPlatformScope ? 'System Entry' : activeTenantName }}
          </Tag>
        </div>
        <div class="org-management__hint-grid">
          <div class="org-management__hint-card">
            <div class="org-management__hint-title">边界提示</div>
            <div>这里只管理 org tree / org node。</div>
            <div>不处理 employee。</div>
            <div>不处理 account。</div>
          </div>
          <div class="org-management__hint-card">
            <div class="org-management__hint-title">
              {{ pageMode === 'SYSTEM' && authContextStore.isPlatformScope ? '指定 Tenant' : '当前 Tenant' }}
            </div>
            <div>{{ activeTenantName || '未选择租户' }}</div>
            <div>部门页继续只消费 tenant-org truth。</div>
          </div>
        </div>
      </Card>

      <OrgManagementWorkspace
        :management-mode="pageMode"
        :selected-org-unit-id="selectedOrgUnitId"
        @update:selected-org-unit-id="syncSelectedOrgUnitId"
      />
    </div>
  </Page>
</template>

<style scoped>
.org-management-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.org-management__hero-top {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.org-management__title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.org-management__description {
  color: #5b6472;
  margin: 8px 0 0;
}

.org-management__hint-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.org-management__hero {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.org-management__hint-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
}

.org-management__hint-title {
  font-size: 16px;
  font-weight: 700;
}

@media (max-width: 960px) {
  .org-management__hero-top {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
