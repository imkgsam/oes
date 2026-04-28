<script setup lang="ts">
import { computed } from 'vue'

import { Page } from '@vben/common-ui'

import { Card, Tag } from 'ant-design-vue'

import { useAuthContextStore } from '#/store/auth-context'

import EmployeeManagementWorkspace from './employee-management-workspace.vue'

const authContextStore = useAuthContextStore()
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const pageDescription = computed(
  () =>
    '这里管理 Employee / Employment。不是租户账号管理，也不是组织成员万能页；正式人 -> org 真相始终来自 Employment -> OrgUnit。'
)
</script>

<template>
  <Page>
    <div class="employee-management-page">
      <Card :bordered="false" class="employee-management__hero">
        <div class="employee-management__hero-top">
          <div>
            <h1 class="employee-management__title">员工与任职管理</h1>
            <p class="employee-management__description">{{ pageDescription }}</p>
          </div>
          <Tag color="blue">{{ activeTenantName }}</Tag>
        </div>
        <div class="employee-management__hint-grid">
          <div class="employee-management__hint-card">
            <div class="employee-management__hint-title">边界提示</div>
            <div>这里管理 Employee / Employment。</div>
            <div>不是租户账号管理。</div>
            <div>不是组织成员万能页。</div>
          </div>
          <div class="employee-management__hint-card">
            <div class="employee-management__hint-title">Org 引用方式</div>
            <div>复用现有 org tree / org unit 读模型。</div>
            <div>HR 只表达 Employment -> OrgUnit。</div>
          </div>
        </div>
      </Card>

      <EmployeeManagementWorkspace />
    </div>
  </Page>
</template>

<style scoped>
.employee-management-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.employee-management__hero-top {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.employee-management__title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.employee-management__description {
  color: #5b6472;
  margin: 8px 0 0;
}

.employee-management__hint-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.employee-management__hero {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.employee-management__hint-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
}

.employee-management__hint-title {
  font-size: 16px;
  font-weight: 700;
}

@media (max-width: 960px) {
  .employee-management__hero-top {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
