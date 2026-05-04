<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { Button, Card, Descriptions, Empty, message, Skeleton, Space, Table, Tag } from 'ant-design-vue'

import type { HrManagementApi, TenantManagementApi } from '#/api'
import { getManagedOrgTreeApi, getManagedOrgUnitByIdApi, listManagedEmployeesApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

import { flattenManagedOrgTree } from './org-read-side'

type OrgTreeRow = ReturnType<typeof flattenManagedOrgTree>[number]

const route = useRoute()
const router = useRouter()
const authContextStore = useAuthContextStore()
const loading = ref(false)
const membersLoading = ref(false)
const orgUnit = ref<TenantManagementApi.ManagedOrgUnit | null>(null)
const treeRows = ref<OrgTreeRow[]>([])
const departmentMembers = ref<HrManagementApi.EmployeeDirectoryItem[]>([])

const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const orgUnitId = computed(() =>
  typeof route.params.orgUnitId === 'string' ? route.params.orgUnitId : ''
)
const childRows = computed(() =>
  treeRows.value.filter((row) => row.parentOrgId === orgUnit.value?.id)
)
const childColumns: TableColumnsType<OrgTreeRow> = [
  {
    dataIndex: 'name',
    key: 'name',
    title: '名称'
  },
  {
    dataIndex: 'type',
    key: 'type',
    title: '类型',
    width: 140
  },
  {
    dataIndex: 'status',
    key: 'status',
    title: '状态',
    width: 140
  }
]
const memberColumns: TableColumnsType<HrManagementApi.EmployeeDirectoryItem> = [
  {
    key: 'name',
    title: '姓名',
    width: 180
  },
  {
    key: 'employeeCode',
    title: '员工编号',
    width: 160
  },
  {
    key: 'joinedAt',
    title: '入职日期',
    width: 140
  },
  {
    key: 'status',
    title: '状态',
    width: 120
  }
]

/** loadOrgUnitDetail hydrates the independent department detail page through tenant-org APIs only. */
async function loadOrgUnitDetail() {
  if (!activeTenantId.value || !orgUnitId.value) {
    orgUnit.value = null
    treeRows.value = []
    departmentMembers.value = []
    return
  }

  loading.value = true
  try {
    const [detailResult, treeResult] = await Promise.all([
      getManagedOrgUnitByIdApi(activeTenantId.value, orgUnitId.value),
      getManagedOrgTreeApi(activeTenantId.value)
    ])
    orgUnit.value = detailResult.orgUnit
    treeRows.value = flattenManagedOrgTree(treeResult.roots ?? [])
    await loadDepartmentMembers()
  } catch (error) {
    orgUnit.value = null
    treeRows.value = []
    departmentMembers.value = []
    message.error(resolveErrorMessage(error, '部门详情加载失败'))
  } finally {
    loading.value = false
  }
}

/** loadDepartmentMembers derives direct members from HR read models while keeping org structure owned by tenant-org. */
async function loadDepartmentMembers() {
  if (!activeTenantId.value || !orgUnitId.value) {
    departmentMembers.value = []
    return
  }

  membersLoading.value = true
  try {
    const result = await listManagedEmployeesApi(activeTenantId.value, {
      lifecycleStatus: 'ACTIVE',
      page: 1,
      pageSize: 100
    })
    departmentMembers.value = (result.items ?? []).filter(
      (item) => item.activeEmployment?.orgUnitId === orgUnitId.value
    )
  } catch (error) {
    departmentMembers.value = []
    message.error(resolveErrorMessage(error, '直属成员加载失败'))
  } finally {
    membersLoading.value = false
  }
}

/** goBackToOrgList returns to the split organization structure list without changing the app shell. */
async function goBackToOrgList() {
  await router.push({ name: 'TenantOrgStructureManagement' })
}

function formatOrgType(type?: string) {
  switch (type) {
    case 'BRANCH': {
      return '分支'
    }
    case 'DEPARTMENT': {
      return '部门'
    }
    case 'ROOT': {
      return '根组织'
    }
    case 'TEAM': {
      return '小组'
    }
    default: {
      return type || '未知'
    }
  }
}

function formatOrgStatus(status?: string) {
  return status === 'ARCHIVED' ? '已停用' : '启用中'
}

function formatEmployeeName(employee: HrManagementApi.EmployeeSummary) {
  return employee.displayName?.trim() || employee.employeeCode
}

function formatLifecycleStatus(status?: string) {
  switch (status) {
    case 'ACTIVE': {
      return '在职'
    }
    case 'OFFBOARDED': {
      return '已离职'
    }
    case 'PREBOARDING': {
      return '待入职'
    }
    default: {
      return status || '未知'
    }
  }
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '未提供'
}

function resolveErrorMessage(error: unknown, fallback: string) {
  const responseMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  return typeof responseMessage === 'string' && responseMessage.trim() ? responseMessage : fallback
}

watch([activeTenantId, orgUnitId], () => {
  void loadOrgUnitDetail()
})

onMounted(() => {
  void loadOrgUnitDetail()
})
</script>

<template>
  <Page title="部门详情">
    <div class="org-detail-page">
      <div class="org-detail-page__toolbar">
        <Button @click="goBackToOrgList">返回列表</Button>
      </div>

      <Skeleton v-if="loading && !orgUnit" active />
      <Empty v-else-if="!orgUnit" description="未找到部门详情" />
      <div v-else class="org-detail-page__content">
        <Card :bordered="false" class="org-detail-page__summary-card">
          <div class="org-detail-page__summary">
            <div>
              <div class="org-detail-page__eyebrow">{{ formatOrgType(orgUnit.type) }}</div>
              <h2>{{ orgUnit.name }}</h2>
              <p>{{ orgUnit.path }}</p>
            </div>
            <Space>
              <Tag :color="orgUnit.status === 'ARCHIVED' ? 'default' : 'green'">
                {{ formatOrgStatus(orgUnit.status) }}
              </Tag>
            </Space>
          </div>
        </Card>

        <div class="org-detail-page__grid">
          <Card :bordered="false" title="基本信息">
            <Descriptions :column="1" bordered size="small">
              <Descriptions.Item label="部门名称">
                {{ orgUnit.name }}
              </Descriptions.Item>
              <Descriptions.Item label="组织类型">
                {{ formatOrgType(orgUnit.type) }}
              </Descriptions.Item>
              <Descriptions.Item label="父级组织">
                {{ orgUnit.parentOrgId || 'ROOT' }}
              </Descriptions.Item>
              <Descriptions.Item label="层级深度">
                {{ orgUnit.depth }}
              </Descriptions.Item>
              <Descriptions.Item label="排序">
                {{ orgUnit.sortOrder }}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card :bordered="false" title="成员与下级">
            <Descriptions :column="1" bordered size="small">
              <Descriptions.Item label="成员数量">
                {{ departmentMembers.length }}
              </Descriptions.Item>
              <Descriptions.Item label="下级数量">
                {{ childRows.length }}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        <Card :bordered="false" title="直属成员">
          <Table
            :columns="memberColumns"
            :data-source="departmentMembers"
            :loading="membersLoading"
            :pagination="false"
            :row-key="(record: HrManagementApi.EmployeeDirectoryItem) => record.employee.id"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                {{ formatEmployeeName(record.employee) }}
              </template>
              <template v-else-if="column.key === 'employeeCode'">
                {{ record.employee.employeeCode }}
              </template>
              <template v-else-if="column.key === 'joinedAt'">
                {{ formatDate(record.activeEmployment?.effectiveFrom) }}
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="record.employee.lifecycleStatus === 'ACTIVE' ? 'green' : 'default'">
                  {{ formatLifecycleStatus(record.employee.lifecycleStatus) }}
                </Tag>
              </template>
            </template>
            <template #emptyText>
              <Empty description="暂无直属成员" />
            </template>
          </Table>
        </Card>

        <Card :bordered="false" title="下级组织">
          <Table
            :columns="childColumns"
            :data-source="childRows"
            :pagination="false"
            :row-key="(record: OrgTreeRow) => record.id"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'type'">
                {{ formatOrgType(record.type) }}
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="record.status === 'ARCHIVED' ? 'default' : 'green'">
                  {{ formatOrgStatus(record.status) }}
                </Tag>
              </template>
            </template>
            <template #emptyText>
              <Empty description="暂无下级组织" />
            </template>
          </Table>
        </Card>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.org-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.org-detail-page__toolbar {
  display: flex;
  justify-content: flex-start;
}

.org-detail-page__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.org-detail-page__summary-card,
.org-detail-page :deep(.ant-card) {
  border-radius: 8px;
}

.org-detail-page__summary {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.org-detail-page__summary h2 {
  margin: 4px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}

.org-detail-page__summary p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.org-detail-page__eyebrow {
  color: #0960bd;
  font-size: 12px;
  font-weight: 600;
}

.org-detail-page__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 16px;
}

@media (max-width: 960px) {
  .org-detail-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
