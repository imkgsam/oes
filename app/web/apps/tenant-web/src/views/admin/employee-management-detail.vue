<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { Button, Card, Descriptions, Empty, message, QRCode, Skeleton, Space, Table, Tabs, Tag } from 'ant-design-vue'

import type { HrManagementApi } from '#/api'
import { getManagedEmployeeAccountAccessApi, getManagedEmployeeDetailApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const route = useRoute()
const router = useRouter()
const authContextStore = useAuthContextStore()
const detailLoading = ref(false)
const accessLoading = ref(false)
const detail = ref<HrManagementApi.EmployeeDetailResult | null>(null)
const accountAccess = ref<HrManagementApi.EmployeeAccountAccessResult | null>(null)

const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const employeeId = computed(() =>
  typeof route.params.employeeId === 'string' ? route.params.employeeId : ''
)
const currentActiveEmployment = computed(() => detail.value?.activeEmployment)
const employeeCodeQrValue = computed(() => detail.value?.employee.employeeCode ?? '')
const employmentRows = computed(() => detail.value?.employments ?? [])
const employmentColumns: TableColumnsType<HrManagementApi.EmploymentSummary> = [
  {
    key: 'org',
    title: '任职组织'
  },
  {
    dataIndex: 'status',
    key: 'status',
    title: '状态',
    width: 140
  },
  {
    dataIndex: 'effectiveFrom',
    key: 'effectiveFrom',
    title: '生效时间',
    width: 180
  },
  {
    dataIndex: 'effectiveTo',
    key: 'effectiveTo',
    title: '结束时间',
    width: 180
  }
]

/** loadEmployeeDetail hydrates the independent employee detail page from HR and bounded access summaries. */
async function loadEmployeeDetail() {
  if (!activeTenantId.value || !employeeId.value) {
    detail.value = null
    accountAccess.value = null
    return
  }

  detailLoading.value = true
  try {
    detail.value = await getManagedEmployeeDetailApi(activeTenantId.value, employeeId.value)
    await loadEmployeeAccess()
  } catch (error) {
    detail.value = null
    accountAccess.value = null
    message.error(resolveErrorMessage(error, '员工详情加载失败'))
  } finally {
    detailLoading.value = false
  }
}

/** loadEmployeeAccess keeps account/login/role summaries behind the HR member-context API. */
async function loadEmployeeAccess() {
  if (!activeTenantId.value || !employeeId.value) {
    accountAccess.value = null
    return
  }

  accessLoading.value = true
  try {
    accountAccess.value = await getManagedEmployeeAccountAccessApi(activeTenantId.value, employeeId.value)
  } catch (error) {
    accountAccess.value = null
    message.error(resolveErrorMessage(error, '账号与访问摘要加载失败'))
  } finally {
    accessLoading.value = false
  }
}

/** goBackToEmployeeList returns to the split employee directory without changing the app shell. */
async function goBackToEmployeeList() {
  await router.push({ name: 'TenantEmployeeEmploymentManagement' })
}

function formatEmployeeName(employee?: HrManagementApi.EmployeeSummary) {
  return employee?.displayName?.trim() || employee?.employeeCode || '未命名员工'
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

function formatEmploymentStatus(status?: string) {
  switch (status) {
    case 'ACTIVE': {
      return '任职中'
    }
    case 'ENDED': {
      return '已结束'
    }
    default: {
      return status || '未知'
    }
  }
}

function formatAccountAccessStatus(status?: string) {
  switch (status) {
    case 'ACTIVE': {
      return '已开通登录'
    }
    case 'NOT_ENABLED': {
      return '未开通登录'
    }
    case 'PENDING': {
      return '待继续完成接入'
    }
    default: {
      return status || '未提供'
    }
  }
}

function formatEmploymentOrgTitle(employment?: Partial<HrManagementApi.EmploymentSummary>) {
  return employment?.orgUnit?.name || employment?.orgUnitId || '未建立任职'
}

function formatLoginMethodSummary(loginMethods: HrManagementApi.EmployeeAccessLoginMethodSummary[]) {
  if (loginMethods.length === 0) {
    return '未配置登录方式'
  }

  return loginMethods
    .map((method) => [method.type, method.maskedIdentifier].filter(Boolean).join(' · '))
    .join(' / ')
}

function formatRoleSummary(roles: HrManagementApi.EmployeeAccessRoleSummary[]) {
  if (roles.length === 0) {
    return '未配置访问角色'
  }

  return roles.map((role) => role.name || role.code).join(' / ')
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '未提供'
}

function resolveErrorMessage(error: unknown, fallback: string) {
  const responseMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  return typeof responseMessage === 'string' && responseMessage.trim() ? responseMessage : fallback
}

watch([activeTenantId, employeeId], () => {
  void loadEmployeeDetail()
})

onMounted(() => {
  void loadEmployeeDetail()
})
</script>

<template>
  <Page title="员工详情">
    <div class="employee-detail-page">
      <div class="employee-detail-page__toolbar">
        <Button @click="goBackToEmployeeList">返回列表</Button>
      </div>

      <Skeleton v-if="detailLoading && !detail" active />
      <Empty v-else-if="!detail" description="未找到员工详情" />
      <div v-else class="employee-detail-page__content">
        <Card :bordered="false" class="employee-detail-page__summary-card">
          <div class="employee-detail-page__summary">
            <div class="employee-detail-page__identity">
              <div class="employee-detail-page__avatar">
                {{ formatEmployeeName(detail.employee).slice(0, 1).toUpperCase() }}
              </div>
              <div>
                <h2>{{ formatEmployeeName(detail.employee) }}</h2>
                <p>{{ detail.employee.employeeCode }} · {{ formatEmploymentOrgTitle(currentActiveEmployment) }}</p>
              </div>
            </div>
            <Space>
              <Tag :color="detail.employee.lifecycleStatus === 'ACTIVE' ? 'green' : detail.employee.lifecycleStatus === 'PREBOARDING' ? 'blue' : 'default'">
                {{ formatLifecycleStatus(detail.employee.lifecycleStatus) }}
              </Tag>
              <Tag :color="accountAccess?.status === 'ACTIVE' ? 'blue' : accountAccess?.status === 'PENDING' ? 'gold' : 'default'">
                {{ formatAccountAccessStatus(accountAccess?.status) }}
              </Tag>
            </Space>
          </div>
        </Card>

        <Tabs>
          <Tabs.TabPane key="basic" tab="基本信息">
            <div class="employee-detail-page__grid">
              <Card :bordered="false" title="员工信息">
                <Descriptions :column="1" bordered size="small">
                  <Descriptions.Item label="姓名">
                    {{ formatEmployeeName(detail.employee) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="工号">
                    {{ detail.employee.employeeCode }}
                  </Descriptions.Item>
                  <Descriptions.Item label="生命周期">
                    {{ formatLifecycleStatus(detail.employee.lifecycleStatus) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="当前部门">
                    {{ formatEmploymentOrgTitle(currentActiveEmployment) }}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card :bordered="false" title="当前任职">
                <Descriptions :column="1" bordered size="small">
                  <Descriptions.Item label="所属组织">
                    {{ formatEmploymentOrgTitle(currentActiveEmployment) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="任职状态">
                    {{ formatEmploymentStatus(currentActiveEmployment?.status) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="入职日期">
                    {{ formatDate(currentActiveEmployment?.effectiveFrom) }}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card :bordered="false" title="员工码二维码">
                <div class="employee-detail-page__qr-panel">
                  <div
                    class="employee-detail-page__qr-code"
                    data-testid="employee-code-qr"
                    :data-value="employeeCodeQrValue"
                  >
                    <QRCode :value="employeeCodeQrValue" />
                  </div>
                  <div class="employee-detail-page__qr-copy">
                    <span>工号</span>
                    <strong>{{ detail.employee.employeeCode }}</strong>
                    <p>PDA 扫描后只填入员工码，Terminal PIN 仍由员工本人输入。</p>
                  </div>
                </div>
              </Card>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="employment" tab="任职记录">
            <Card :bordered="false">
              <Table
                :columns="employmentColumns"
                :data-source="employmentRows"
                :pagination="false"
                :row-key="(record: HrManagementApi.EmploymentSummary) => record.id"
                size="middle"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'org'">
                    {{ formatEmploymentOrgTitle(record) }}
                  </template>
                  <template v-else-if="column.key === 'status'">
                    <Tag :color="record.status === 'ACTIVE' ? 'green' : 'default'">
                      {{ formatEmploymentStatus(record.status) }}
                    </Tag>
                  </template>
                  <template v-else-if="column.key === 'effectiveFrom'">
                    {{ formatDate(record.effectiveFrom) }}
                  </template>
                  <template v-else-if="column.key === 'effectiveTo'">
                    {{ formatDate(record.effectiveTo) }}
                  </template>
                </template>
                <template #emptyText>
                  <Empty description="暂无任职记录" />
                </template>
              </Table>
            </Card>
          </Tabs.TabPane>

          <Tabs.TabPane key="access" tab="账号与访问">
            <Card :bordered="false" v-loading="accessLoading">
              <Descriptions :column="1" bordered size="small">
                <Descriptions.Item label="账号">
                  {{ accountAccess?.account?.displayName || accountAccess?.account?.accountId || '未开通账号' }}
                </Descriptions.Item>
                <Descriptions.Item label="账号状态">
                  {{ accountAccess?.account ? (accountAccess.account.isEnabled ? '已启用' : '未启用') : '未提供' }}
                </Descriptions.Item>
                <Descriptions.Item label="登录方式">
                  {{ formatLoginMethodSummary(accountAccess?.loginMethods ?? []) }}
                </Descriptions.Item>
                <Descriptions.Item label="访问角色">
                  {{ formatRoleSummary(accountAccess?.roles ?? []) }}
                </Descriptions.Item>
                <Descriptions.Item label="密码设置">
                  {{ accountAccess?.passwordSetupRequired ? '首次登录需设置密码' : '无待处理要求' }}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.employee-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.employee-detail-page__toolbar {
  display: flex;
  justify-content: flex-start;
}

.employee-detail-page__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.employee-detail-page__summary-card,
.employee-detail-page :deep(.ant-card) {
  border-radius: 8px;
}

.employee-detail-page__summary {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.employee-detail-page__identity {
  align-items: center;
  display: flex;
  gap: 14px;
  min-width: 0;
}

.employee-detail-page__avatar {
  align-items: center;
  background: #e8f4ff;
  border: 1px solid #cfe8ff;
  border-radius: 8px;
  color: #0960bd;
  display: flex;
  flex: 0 0 44px;
  font-size: 18px;
  font-weight: 600;
  height: 44px;
  justify-content: center;
  width: 44px;
}

.employee-detail-page__summary h2 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}

.employee-detail-page__summary p {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.employee-detail-page__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.employee-detail-page__qr-panel {
  align-items: center;
  display: flex;
  gap: 16px;
}

.employee-detail-page__qr-copy {
  min-width: 0;
}

.employee-detail-page__qr-code {
  flex: 0 0 auto;
}

.employee-detail-page__qr-copy span {
  color: #6b7280;
  display: block;
  font-size: 12px;
  line-height: 18px;
}

.employee-detail-page__qr-copy strong {
  color: #111827;
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  overflow-wrap: anywhere;
}

.employee-detail-page__qr-copy p {
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
  margin: 6px 0 0;
}

@media (max-width: 960px) {
  .employee-detail-page__summary {
    flex-direction: column;
  }

  .employee-detail-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
