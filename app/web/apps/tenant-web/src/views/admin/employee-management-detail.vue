<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { Button, Card, Descriptions, Empty, message, QRCode, Skeleton, Space, Table, Tabs, Tag } from 'ant-design-vue'

import type { HrManagementApi } from '#/api'
import {
  getManagedEmployeeAccountAccessApi,
  getManagedEmployeeDetailApi,
  uploadEmployeeOfficialPhotoApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'
import EmployeeBusinessCardDisplay from './components/employee-business-card-display.vue'

const route = useRoute()
const router = useRouter()
const authContextStore = useAuthContextStore()
const detailLoading = ref(false)
const accessLoading = ref(false)
const officialPhotoUploading = ref(false)
const detail = ref<HrManagementApi.EmployeeDetailResult | null>(null)
const accountAccess = ref<HrManagementApi.EmployeeAccountAccessResult | null>(null)
const officialPhotoInput = ref<HTMLInputElement | null>(null)

const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const employeeId = computed(() =>
  typeof route.params.employeeId === 'string' ? route.params.employeeId : ''
)
const currentActiveEmployment = computed(() => detail.value?.activeEmployment)
const employeeCodeQrValue = computed(() => detail.value?.employee.employeeCode ?? '')
const businessCardEmployeeContext = computed(() => {
  if (!detail.value) return undefined
  return {
    department: formatEmploymentOrgTitle(currentActiveEmployment.value),
    displayName: formatEmployeeName(detail.value.employee),
    employeeCode: detail.value.employee.employeeCode,
    employeeId: detail.value.employee.id,
    officialPhotoAssetId: detail.value.employee.officialPhotoAssetId,
    officialPhotoUrl: detail.value.employee.officialPhotoUrl
  }
})
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

/** handleOfficialPhotoSelected updates the HR-owned public employee photo from the detail portrait action. */
async function handleOfficialPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !activeTenantId.value || !detail.value?.employee.id) return

  officialPhotoUploading.value = true
  try {
    const result = await uploadEmployeeOfficialPhotoApi(
      activeTenantId.value,
      detail.value.employee.id,
      file
    )
    const employee = result.employee
    if (!employee) {
      await loadEmployeeDetail()
      message.success('公开头像已更新')
      return
    }
    detail.value = {
      ...detail.value,
      employee: {
        ...detail.value.employee,
        ...employee
      }
    }
    message.success('公开头像已更新')
  } catch (error) {
    message.error(resolveErrorMessage(error, '公开头像上传失败'))
  } finally {
    officialPhotoUploading.value = false
  }
}

function formatEmployeeName(employee?: HrManagementApi.EmployeeSummary) {
  return employee?.displayName?.trim() || employee?.employeeCode || '未命名员工'
}

function formatOfficialPhotoPlaceholder(employee?: HrManagementApi.EmployeeSummary) {
  const normalized = formatEmployeeName(employee).trim()
  return normalized ? normalized.slice(0, 1).toUpperCase() : '职'
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

/** formatLoginMethodLabel maps internal login method codes into readable HR-facing labels. */
function formatLoginMethodLabel(type?: string) {
  switch (type) {
    case 'EMAIL_PASSWORD': {
      return '邮箱密码'
    }
    case 'EMAIL_OTP': {
      return '邮箱验证码'
    }
    case 'PHONE_PASSWORD': {
      return '手机密码'
    }
    case 'PHONE_OTP': {
      return '手机验证码'
    }
    case 'TERMINAL_PIN': {
      return '终端 PIN'
    }
    default: {
      return type || '登录方式'
    }
  }
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
        <Card :bordered="false" class="employee-detail-page__summary-card employee-detail-page__summary-card--hero">
          <div class="employee-detail-page__summary">
            <div class="employee-detail-page__identity">
              <div
                class="employee-detail-page__avatar"
                :class="{ 'employee-detail-page__avatar--photo': detail.employee.officialPhotoUrl }"
              >
                <img
                  v-if="detail.employee.officialPhotoUrl"
                  data-testid="employee-detail-official-photo"
                  :alt="formatEmployeeName(detail.employee)"
                  :src="detail.employee.officialPhotoUrl"
                >
                <span v-else data-testid="employee-detail-official-photo-placeholder">
                  {{ formatOfficialPhotoPlaceholder(detail.employee) }}
                </span>
                <Button
                  aria-label="修改公开头像"
                  class="employee-detail-page__avatar-action"
                  data-testid="employee-detail-official-photo-action"
                  :disabled="officialPhotoUploading"
                  shape="circle"
                  size="small"
                  type="text"
                  @click="officialPhotoInput?.click()"
                >
                  <span aria-hidden="true" class="employee-detail-page__avatar-edit-mark" />
                </Button>
                <input
                  ref="officialPhotoInput"
                  class="employee-detail-page__avatar-input"
                  data-testid="employee-detail-official-photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  :disabled="officialPhotoUploading"
                  @change="handleOfficialPhotoSelected"
                >
              </div>
              <div class="employee-detail-page__summary-copy">
                <span class="employee-detail-page__eyebrow">{{ detail.employee.employeeCode }}</span>
                <h2>{{ formatEmployeeName(detail.employee) }}</h2>
                <p>{{ detail.employee.employeeCode }} · {{ formatEmploymentOrgTitle(currentActiveEmployment) }}</p>
              </div>
            </div>
            <Space class="employee-detail-page__summary-status">
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
                  <div
                    v-if="accountAccess?.loginMethods?.length"
                    class="employee-detail-page__login-method-list"
                  >
                    <span
                      v-for="method in accountAccess.loginMethods"
                      :key="method.methodId"
                      class="employee-detail-page__login-method-chip"
                      :class="{ 'employee-detail-page__login-method-chip--disabled': !method.enabled }"
                    >
                      <span class="employee-detail-page__login-method-label">
                        {{ formatLoginMethodLabel(method.type) }}
                      </span>
                      <span
                        v-if="method.maskedIdentifier"
                        class="employee-detail-page__login-method-value"
                      >
                        {{ method.maskedIdentifier }}
                      </span>
                      <span
                        v-if="!method.enabled"
                        class="employee-detail-page__login-method-state"
                      >
                        已停用
                      </span>
                    </span>
                  </div>
                  <span v-else>未配置登录方式</span>
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

          <Tabs.TabPane key="business-cards" tab="名片">
            <EmployeeBusinessCardDisplay
              v-if="businessCardEmployeeContext"
              :employee-context="businessCardEmployeeContext"
            />
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

.employee-detail-page__summary-card--hero {
  overflow: hidden;
  border: 1px solid rgb(226 232 240 / 0.96);
  background:
    linear-gradient(125deg, rgb(255 255 255 / 0.98), rgb(248 250 252 / 0.94) 58%, rgb(237 245 249 / 0.92)),
    #fff;
  box-shadow: 0 22px 46px -36px rgb(15 23 42 / 0.42);
}

.employee-detail-page__summary-card--hero :deep(.ant-card-body) {
  padding: 30px 34px;
}

.employee-detail-page__summary {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.employee-detail-page__identity {
  align-items: center;
  display: flex;
  gap: 24px;
  min-width: 0;
}

.employee-detail-page__avatar {
  align-items: center;
  background:
    linear-gradient(145deg, #f8fafc, #e2edf6),
    #f8fafc;
  border: 1px solid #cbddeb;
  border-radius: 8px;
  box-shadow:
    0 20px 42px -32px rgb(15 23 42 / 0.62),
    inset 0 1px 0 rgb(255 255 255 / 0.92);
  color: #2f5f73;
  display: flex;
  flex: 0 0 104px;
  font-size: 42px;
  font-weight: 760;
  height: 122px;
  justify-content: center;
  overflow: hidden;
  position: relative;
  width: 104px;
  transform: translateZ(0);
  transition:
    box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.employee-detail-page__avatar::after {
  position: absolute;
  inset: 0;
  border: 1px solid rgb(255 255 255 / 0.68);
  border-radius: inherit;
  pointer-events: none;
  content: '';
}

.employee-detail-page__summary-card--hero:hover .employee-detail-page__avatar {
  box-shadow:
    0 24px 48px -34px rgb(15 23 42 / 0.68),
    inset 0 1px 0 rgb(255 255 255 / 0.92);
  transform: translateY(-2px);
}

.employee-detail-page__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.employee-detail-page__avatar--photo {
  background: #f8fafc;
}

.employee-detail-page__avatar-action {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  width: 28px;
  height: 28px;
  min-width: 28px;
  border: 1px solid rgb(226 232 240 / 0.86);
  background: rgb(255 255 255 / 0.88);
  box-shadow:
    0 12px 22px -16px rgb(15 23 42 / 0.82),
    inset 0 1px 0 rgb(255 255 255 / 0.95);
  color: #334155;
  opacity: 0.88;
  transform: translateZ(0);
  transition:
    background-color 0.24s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.24s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.24s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.employee-detail-page__avatar-action:hover,
.employee-detail-page__avatar-action:focus-visible {
  border-color: rgb(148 163 184 / 0.78);
  background: rgb(255 255 255 / 0.98);
  box-shadow:
    0 16px 28px -18px rgb(15 23 42 / 0.88),
    inset 0 1px 0 rgb(255 255 255 / 0.98);
  color: #0f172a;
  opacity: 1;
  transform: translateY(-1px);
}

.employee-detail-page__avatar-action:active {
  transform: translateY(0) scale(0.96);
}

.employee-detail-page__avatar-action:disabled {
  cursor: wait;
  opacity: 0.62;
}

.employee-detail-page__avatar-action :deep(.ant-btn-icon),
.employee-detail-page__avatar-action :deep(span:not(.employee-detail-page__avatar-edit-mark)) {
  display: inline-flex;
}

.employee-detail-page__avatar-edit-mark {
  position: relative;
  display: inline-block;
  width: 13px;
  height: 13px;
}

.employee-detail-page__avatar-edit-mark::before {
  position: absolute;
  top: 2px;
  left: 6px;
  width: 3px;
  height: 10px;
  border-radius: 999px;
  background: currentcolor;
  content: '';
  transform: rotate(45deg);
}

.employee-detail-page__avatar-edit-mark::after {
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: 6px;
  height: 2px;
  border-radius: 999px;
  background: currentcolor;
  content: '';
  transform: rotate(-45deg);
}

.employee-detail-page__avatar-input {
  display: none;
}

.employee-detail-page__summary-copy {
  min-width: 0;
}

.employee-detail-page__eyebrow {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.employee-detail-page__summary h2 {
  margin: 0;
  color: #0f172a;
  font-size: 30px;
  font-weight: 760;
  line-height: 38px;
}

.employee-detail-page__summary p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 15px;
  line-height: 22px;
}

.employee-detail-page__summary-status {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.employee-detail-page__summary-status :deep(.ant-tag) {
  margin-inline-end: 0;
  border-radius: 999px;
  padding: 2px 11px;
  font-size: 13px;
}

.employee-detail-page__login-method-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 100%;
}

.employee-detail-page__login-method-chip {
  align-items: center;
  display: inline-flex;
  min-height: 30px;
  max-width: 100%;
  gap: 8px;
  border: 1px solid rgb(191 219 254 / 0.92);
  border-radius: 999px;
  background: rgb(239 246 255 / 0.9);
  color: #1e3a5f;
  padding: 4px 11px;
  line-height: 20px;
  transition:
    background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.employee-detail-page__login-method-chip:hover {
  border-color: rgb(147 197 253 / 0.98);
  background: #eff6ff;
  transform: translateY(-1px);
}

.employee-detail-page__login-method-chip--disabled {
  border-color: #e5e7eb;
  background: #f8fafc;
  color: #64748b;
}

.employee-detail-page__login-method-label {
  flex: 0 0 auto;
  font-size: 13px;
  font-weight: 700;
}

.employee-detail-page__login-method-value {
  min-width: 0;
  overflow-wrap: anywhere;
  color: #475569;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
}

.employee-detail-page__login-method-state {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 12px;
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
    align-items: flex-start;
  }

  .employee-detail-page__identity {
    align-items: flex-start;
  }

  .employee-detail-page__summary-status {
    justify-content: flex-start;
  }

  .employee-detail-page__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .employee-detail-page__summary-card--hero :deep(.ant-card-body) {
    padding: 22px;
  }

  .employee-detail-page__identity {
    gap: 16px;
  }

  .employee-detail-page__avatar {
    flex-basis: 88px;
    width: 88px;
    height: 104px;
    font-size: 34px;
  }

  .employee-detail-page__avatar-action {
    top: 7px;
    right: 7px;
    width: 26px;
    height: 26px;
    min-width: 26px;
  }

  .employee-detail-page__summary h2 {
    font-size: 24px;
    line-height: 32px;
  }
}
</style>
