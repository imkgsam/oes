<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import { Button, Card, Tag } from 'ant-design-vue'

import { useAuthContextStore } from '#/store/auth-context'

import EmployeeManagementWorkspace from './employee-management-workspace.vue'
import OrgManagementWorkspace from './org-management-workspace.vue'

const ORGANIZATION_PEOPLE_ROUTE_NAME = 'TenantOrganizationPeople'
const ORGANIZATION_PEOPLE_PAGE_KEY = 'tenant-settings.organization-people'

const authContextStore = useAuthContextStore()
const route = useRoute()
const router = useRouter()
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const activeTab = computed(() =>
  route.query?.tab === 'departments' ? 'departments' : 'members'
)
const selectedEmployeeId = computed(() =>
  typeof route.query?.employeeId === 'string' ? route.query.employeeId : ''
)
const selectedOrgUnitId = computed(() =>
  typeof route.query?.orgUnitId === 'string' ? route.query.orgUnitId : ''
)

/** buildWorkbenchQuery preserves the workbench selection state while forcing one stable tab identity for the unified page. */
function buildWorkbenchQuery(overrides: Record<string, string | undefined>) {
  return {
    ...(route.query ?? {}),
    ...overrides,
    pageKey: ORGANIZATION_PEOPLE_PAGE_KEY,
  }
}

/** switchTab keeps tab navigation on the unified workbench while preserving query-based selection state. */
function switchTab(tab: 'departments' | 'members') {
  void router.replace({
    name: ORGANIZATION_PEOPLE_ROUTE_NAME,
    query: buildWorkbenchQuery({
      tab,
    }),
  })
}

/** syncSelectedEmployeeId persists the selected member into the shared workbench query state. */
function syncSelectedEmployeeId(employeeId: string) {
  void router.replace({
    name: ORGANIZATION_PEOPLE_ROUTE_NAME,
    query: buildWorkbenchQuery({
      employeeId: employeeId || undefined,
    }),
  })
}

/** syncSelectedOrgUnitId persists the selected department into the shared workbench query state. */
function syncSelectedOrgUnitId(orgUnitId: string) {
  void router.replace({
    name: ORGANIZATION_PEOPLE_ROUTE_NAME,
    query: buildWorkbenchQuery({
      orgUnitId: orgUnitId || undefined,
    }),
  })
}
</script>

<template>
  <Page>
    <div class="organization-people-page">
      <Card :bordered="false" class="organization-people__hero">
        <div class="organization-people__hero-top">
          <div>
            <h1 class="organization-people__title">组织与人员</h1>
            <p class="organization-people__description">
              统一承接租户侧成员与部门入口；成员默认进入 HR truth，部门继续复用 tenant-org truth。
            </p>
          </div>
          <Tag color="blue">{{ activeTenantName }}</Tag>
        </div>
        <div class="organization-people__hint-grid">
          <div class="organization-people__hint-card">
            <div class="organization-people__hint-title">边界提示</div>
            <div>成员页只管理 Employee / Employment。</div>
            <div>部门页只管理 org tree / org node。</div>
            <div>不把 account owner 并入 HR 工作台。</div>
          </div>
          <div class="organization-people__hint-card">
            <div class="organization-people__hint-title">统一入口</div>
            <div>默认进入“成员” Tab。</div>
            <div>旧 `/settings/employee-employment` 与 `/settings/org-structure` 只保留兼容跳转。</div>
          </div>
        </div>
      </Card>

      <Card :bordered="false" class="organization-people__panel">
        <div class="organization-people__tabs">
          <Button
            data-testid="organization-people-tab-members"
            :type="activeTab === 'members' ? 'primary' : 'default'"
            @click="switchTab('members')"
          >
            成员
          </Button>
          <Button
            data-testid="organization-people-tab-departments"
            :type="activeTab === 'departments' ? 'primary' : 'default'"
            @click="switchTab('departments')"
          >
            部门
          </Button>
        </div>
      </Card>

      <EmployeeManagementWorkspace
        v-if="activeTab === 'members'"
        :selected-employee-id="selectedEmployeeId"
        @update:selected-employee-id="syncSelectedEmployeeId"
      />
      <OrgManagementWorkspace
        v-else
        management-mode="TENANT"
        :selected-org-unit-id="selectedOrgUnitId"
        @update:selected-org-unit-id="syncSelectedOrgUnitId"
      />
    </div>
  </Page>
</template>

<style scoped>
.organization-people-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.organization-people__hero-top,
.organization-people__tabs {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.organization-people__title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.organization-people__description {
  color: #5b6472;
  margin: 8px 0 0;
}

.organization-people__hint-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.organization-people__hero,
.organization-people__panel {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.organization-people__hint-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
}

.organization-people__hint-title {
  font-size: 16px;
  font-weight: 700;
}

@media (max-width: 960px) {
  .organization-people__hero-top,
  .organization-people__tabs {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
