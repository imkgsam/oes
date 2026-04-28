<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { useAccessStore } from '@vben/stores'

import { Card, Tabs } from 'ant-design-vue'

import { getSessionAccessSummaryApi, getSessionContextApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

import EmployeeManagementWorkspace from './employee-management-workspace.vue'
import OrgManagementWorkspace from './org-management-workspace.vue'

const ORGANIZATION_PEOPLE_ROUTE_NAME = 'TenantOrganizationPeople'

const accessStore = useAccessStore()
const authContextStore = useAuthContextStore()
const route = useRoute()
const router = useRouter()
const activeTab = computed(() =>
  route.query?.tab === 'departments' ? 'departments' : 'members'
)

/** buildWorkbenchQuery keeps only page-level tab state in the URL and strips internal selection ids. */
function buildWorkbenchQuery(tab: 'departments' | 'members') {
  return tab === 'departments' ? { tab: 'departments' } : {}
}

/** switchTab keeps tab navigation on the unified workbench while preserving only page-level tab state. */
function switchTab(tab: 'departments' | 'members') {
  void router.replace({
    name: ORGANIZATION_PEOPLE_ROUTE_NAME,
    query: buildWorkbenchQuery(tab),
  })
}

/** normalizeWorkbenchUrl removes legacy query parameters so the workbench URL only carries page-level state. */
function normalizeWorkbenchUrl() {
  const shouldNormalize =
    typeof route.query?.employeeId === 'string' ||
    typeof route.query?.orgUnitId === 'string' ||
    typeof route.query?.pageKey === 'string' ||
    route.query?.tab === 'members'

  if (!shouldNormalize) {
    return
  }

  void router.replace({
    name: ORGANIZATION_PEOPLE_ROUTE_NAME,
    query: buildWorkbenchQuery(activeTab.value),
  })
}

/** refreshWorkbenchAuthContext reloads the current session context so stale local permission snapshots do not hide org data after reseed. */
async function refreshWorkbenchAuthContext() {
  try {
    const [sessionContext, accessSummary] = await Promise.all([
      getSessionContextApi(),
      getSessionAccessSummaryApi()
    ])

    accessStore.setAccessCodes(accessSummary.actionCodes ?? [])
    authContextStore.setAuthContext(sessionContext, accessSummary)
  } catch {
    // Keep the page usable even when background context refresh is temporarily unavailable.
  }
}

onMounted(() => {
  normalizeWorkbenchUrl()
  void refreshWorkbenchAuthContext()
})
</script>

<template>
  <Page>
    <div class="organization-people">
      <Card
        :bordered="false"
        class="organization-people__card"
      >
        <Tabs
          :active-key="activeTab"
          class="organization-people__tabs"
          @change="(key) => switchTab(key as 'departments' | 'members')"
        >
          <Tabs.TabPane
            key="members"
            tab="员工"
          >
            <EmployeeManagementWorkspace data-testid="members-workspace" />
          </Tabs.TabPane>
          <Tabs.TabPane
            key="departments"
            tab="组织"
          >
            <OrgManagementWorkspace
              data-testid="departments-workspace"
              management-mode="TENANT"
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.organization-people {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.organization-people__card {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.organization-people__tabs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.organization-people__card :deep(.ant-card-body),
.organization-people__tabs :deep(.ant-tabs-content-holder),
.organization-people__tabs :deep(.ant-tabs-content),
.organization-people__tabs :deep(.ant-tabs-tabpane-active) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
</style>
