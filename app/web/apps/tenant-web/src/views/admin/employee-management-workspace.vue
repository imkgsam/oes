<script setup lang="ts">
import type { HrManagementApi, RoleManagementApi } from '#/api'

import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { Button, Card, Empty, Modal, Tag, message } from 'ant-design-vue'

import {
  changeManagedPrimaryEmploymentApi,
  completeManagedEmployeeAccessApi,
  createManagedEmployeeApi,
  createManagedEmploymentApi,
  endManagedEmploymentApi,
  getManagedEmployeeAccountAccessApi,
  getManagedEmployeeDetailApi,
  getManagedOrgTreeApi,
  listManagedEmployeesApi,
  listRolesApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

import {
  findManagedOrgUnitOption,
  flattenManagedOrgTree,
  formatManagedOrganizationPartyName
} from './org-read-side'

interface CreateEmployeeFormState {
  allowLogin: boolean
  effectiveFrom: string
  employeeCode: string
  loginEmail: string
  loginPhone: string
  orgUnitId: string
  partyId: string
  selectedRoleId: string
  tenantPartyId: string
}

interface ChangeEmploymentFormState {
  effectiveFrom: string
  orgUnitId: string
}

interface EmployeeAccessFormState {
  loginEmail: string
  loginPhone: string
  selectedRoleId: string
}

interface Props {
  selectedEmployeeId?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedEmployeeId: ''
})

const emit = defineEmits<{
  (event: 'update:selectedEmployeeId', value: string): void
}>()

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? ''
)
const canListEmployees = computed(() =>
  authContextStore.actionCodes.includes('hr.employee.list')
)
const canViewEmployeeDetail = computed(() =>
  authContextStore.actionCodes.includes('hr.employee.get_by_id')
)
const canCreateEmployee = computed(() =>
  authContextStore.actionCodes.includes('hr.employee.create')
)
const canCreateEmployment = computed(() =>
  authContextStore.actionCodes.includes('hr.employment.create')
)
const canChangeEmployment = computed(() =>
  authContextStore.actionCodes.includes('hr.employment.change_primary')
)
const canEndEmployment = computed(() =>
  authContextStore.actionCodes.includes('hr.employment.end')
)
const canProvisionLogin = computed(() =>
  authContextStore.actionCodes.includes('identity.account.create')
)
const canOpenAccountManagement = computed(() =>
  (authContextStore.visibleEntries ?? []).includes('admin.account-management')
)

const loading = ref(false)
const detailLoading = ref(false)
const accessLoading = ref(false)
const createSaving = ref(false)
const changeSaving = ref(false)
const accessSaving = ref(false)
const employees = ref<HrManagementApi.EmployeeDirectoryItem[]>([])
const internalSelectedEmployeeId = ref('')
const detail = ref<null | HrManagementApi.EmployeeDetailResult>(null)
const accountAccess = ref<null | HrManagementApi.EmployeeAccountAccessResult>(null)
const orgOptions = ref<ReturnType<typeof flattenManagedOrgTree>>([])
const roleOptions = ref<RoleManagementApi.Role[]>([])
const createOpen = ref(false)
const changeOpen = ref(false)
const accessOpen = ref(false)
const accessMode = ref<'CONTINUE' | 'ENABLE'>('ENABLE')
const createForm = reactive<CreateEmployeeFormState>({
  allowLogin: false,
  effectiveFrom: '',
  employeeCode: '',
  loginEmail: '',
  loginPhone: '',
  orgUnitId: '',
  partyId: '',
  selectedRoleId: '',
  tenantPartyId: ''
})
const changeForm = reactive<ChangeEmploymentFormState>({
  effectiveFrom: '',
  orgUnitId: ''
})
const accessForm = reactive<EmployeeAccessFormState>({
  loginEmail: '',
  loginPhone: '',
  selectedRoleId: ''
})

const currentActiveEmployment = computed(() => detail.value?.activeEmployment)
const employmentHistory = computed(() => detail.value?.employments ?? [])
const sortedRoleOptions = computed(() =>
  roleOptions.value.filter((role) => role.isEnabled !== false)
)
const shouldCollectAccessContacts = computed(() =>
  !accountAccess.value?.account?.accountId
)

/** syncSelectedEmployeeId keeps the current employee selection aligned with the owning shell query state. */
function syncSelectedEmployeeId(employeeId: string) {
  if (employeeId === internalSelectedEmployeeId.value) {
    return
  }

  internalSelectedEmployeeId.value = employeeId
  emit('update:selectedEmployeeId', employeeId)
}

/** loadOrgOptions reuses the tenant org tree read model as the only org selector truth. */
async function loadOrgOptions() {
  if (!activeTenantId.value) {
    orgOptions.value = []
    return
  }

  const result = await getManagedOrgTreeApi(activeTenantId.value)
  orgOptions.value = flattenManagedOrgTree(result.roots ?? [])
}

/** loadRoleOptions reuses the existing role directory as the selectable role source for member login enablement. */
async function loadRoleOptions() {
  if (!activeTenantId.value || !canProvisionLogin.value) {
    roleOptions.value = []
    return
  }

  try {
    const result = await listRolesApi({
      page: 1,
      pageSize: 100,
      scopeLevel: 'TENANT',
      tenantId: activeTenantId.value
    })
    roleOptions.value = result.roles ?? []
  } catch (error) {
    roleOptions.value = []
    message.error(resolveErrorMessage(error, '角色选项加载失败'))
  }
}

/** loadEmployeeAccountAccess refreshes the bounded member-context account and access summary. */
async function loadEmployeeAccountAccess(employeeId: string) {
  if (!canViewEmployeeDetail.value || !activeTenantId.value || !employeeId) {
    accountAccess.value = null
    return
  }

  accessLoading.value = true
  try {
    accountAccess.value = await getManagedEmployeeAccountAccessApi(activeTenantId.value, employeeId)
  } catch (error) {
    accountAccess.value = null
    message.error(resolveErrorMessage(error, '账号与访问摘要加载失败'))
  } finally {
    accessLoading.value = false
  }
}

/** loadEmployeeDetail refreshes the selected employee detail workspace for one tenant-scoped employee. */
async function loadEmployeeDetail(employeeId: string) {
  if (!canViewEmployeeDetail.value || !activeTenantId.value || !employeeId) {
    detail.value = null
    accountAccess.value = null
    return
  }

  detailLoading.value = true
  try {
    detail.value = await getManagedEmployeeDetailApi(activeTenantId.value, employeeId)
    await loadEmployeeAccountAccess(employeeId)
  } catch (error) {
    detail.value = null
    accountAccess.value = null
    message.error(resolveErrorMessage(error, '员工详情加载失败'))
  } finally {
    detailLoading.value = false
  }
}

/** resolvePreferredEmployeeId keeps either the requested selection or the first available employee stable across refreshes. */
function resolvePreferredEmployeeId() {
  const requestedEmployeeId = props.selectedEmployeeId
  if (requestedEmployeeId && employees.value.some((item) => item.employee.id === requestedEmployeeId)) {
    return requestedEmployeeId
  }

  if (
    internalSelectedEmployeeId.value &&
    employees.value.some((item) => item.employee.id === internalSelectedEmployeeId.value)
  ) {
    return internalSelectedEmployeeId.value
  }

  return employees.value[0]?.employee.id ?? ''
}

/** loadEmployeeDirectory refreshes the tenant-scoped HR list and keeps one coherent selection/detail pair. */
async function loadEmployeeDirectory() {
  if (!canListEmployees.value || !activeTenantId.value) {
    employees.value = []
    internalSelectedEmployeeId.value = ''
    detail.value = null
    accountAccess.value = null
    return
  }

  loading.value = true
  try {
    const result = await listManagedEmployeesApi(activeTenantId.value, {
      keyword: undefined,
      lifecycleStatus: undefined,
      page: 1,
      pageSize: 20
    })
    employees.value = result.items ?? []

    const nextEmployeeId = resolvePreferredEmployeeId()
    if (nextEmployeeId) {
      syncSelectedEmployeeId(nextEmployeeId)
      await loadEmployeeDetail(nextEmployeeId)
    } else {
      detail.value = null
      accountAccess.value = null
    }
  } catch (error) {
    employees.value = []
    internalSelectedEmployeeId.value = ''
    detail.value = null
    accountAccess.value = null
    message.error(resolveErrorMessage(error, '员工列表加载失败'))
  } finally {
    loading.value = false
  }
}

/** selectEmployee switches the current detail workspace to the chosen employee. */
async function selectEmployee(employeeId: string) {
  syncSelectedEmployeeId(employeeId)
  await loadEmployeeDetail(employeeId)
}

/** openCreateDrawer resets the create draft for one employee plus its optional login onboarding slice. */
function openCreateDrawer() {
  createForm.employeeCode = ''
  createForm.tenantPartyId = ''
  createForm.partyId = ''
  createForm.orgUnitId = orgOptions.value[0]?.id ?? ''
  createForm.effectiveFrom = ''
  createForm.allowLogin = false
  createForm.loginEmail = ''
  createForm.loginPhone = ''
  createForm.selectedRoleId = sortedRoleOptions.value[0]?.id ?? ''
  createOpen.value = true
}

/** submitCreateFlow creates the employee, establishes the first employment, and optionally starts login onboarding. */
async function submitCreateFlow() {
  if (!activeTenantId.value) {
    return
  }

  if (createForm.allowLogin) {
    if (!canProvisionLogin.value) {
      message.error('当前操作者没有开通成员登录的权限')
      return
    }

    if (!createForm.selectedRoleId) {
      message.error('请选择一个访问角色')
      return
    }

    if (!createForm.loginEmail.trim() && !createForm.loginPhone.trim()) {
      message.error('邮箱或手机号至少填写一项')
      return
    }
  }

  createSaving.value = true
  try {
    const created = (await createManagedEmployeeApi(activeTenantId.value, {
      employeeCode: createForm.employeeCode.trim(),
      partyId: createForm.partyId.trim() || undefined,
      tenantPartyId: createForm.tenantPartyId.trim()
    })) as { employee?: HrManagementApi.EmployeeSummary }

    let createdEmploymentId = ''
    if (created.employee?.id && createForm.orgUnitId && createForm.effectiveFrom && canCreateEmployment.value) {
      const createdEmployment = (await createManagedEmploymentApi(activeTenantId.value, created.employee.id, {
        effectiveFrom: normalizeDateTimeLocal(createForm.effectiveFrom),
        orgUnitId: createForm.orgUnitId
      })) as { employment?: HrManagementApi.EmploymentSummary }
      createdEmploymentId = createdEmployment.employment?.id ?? ''
    }

    let accessResult: HrManagementApi.EmployeeAccountAccessResult | undefined
    if (
      createForm.allowLogin &&
      created.employee?.id &&
      createdEmploymentId
    ) {
      accessResult = await completeManagedEmployeeAccessApi(activeTenantId.value, created.employee.id, {
        employmentId: createdEmploymentId,
        roleIds: [createForm.selectedRoleId],
        reason: 'member_create_allow_login',
        createAccount: {
          displayName: createForm.employeeCode.trim(),
          email: createForm.loginEmail.trim() || undefined,
          phone: createForm.loginPhone.trim() || undefined
        }
      })
    }

    createOpen.value = false
    message.success(
      accessResult?.status === 'PENDING'
        ? '员工已创建，登录接入待继续完成'
        : createForm.allowLogin
          ? '员工、任职与登录接入已提交'
          : '员工与任职已提交'
    )
    await loadEmployeeDirectory()
    if (created.employee?.id) {
      await selectEmployee(created.employee.id)
    }
  } catch (error) {
    message.error(resolveErrorMessage(error, '员工创建失败'))
  } finally {
    createSaving.value = false
  }
}

/** openChangeEmploymentDrawer seeds the change-primary command form from the current detail context. */
function openChangeEmploymentDrawer() {
  changeForm.orgUnitId = currentActiveEmployment.value?.orgUnitId ?? orgOptions.value[0]?.id ?? ''
  changeForm.effectiveFrom = ''
  changeOpen.value = true
}

/** submitChangeEmployment runs the backend-supported change-primary command instead of mutating org truth locally. */
async function submitChangeEmployment() {
  if (!activeTenantId.value || !internalSelectedEmployeeId.value || !currentActiveEmployment.value) {
    return
  }

  changeSaving.value = true
  try {
    await changeManagedPrimaryEmploymentApi(activeTenantId.value, internalSelectedEmployeeId.value, {
      effectiveFrom: normalizeDateTimeLocal(changeForm.effectiveFrom),
      endedReason: 'transfer',
      fromEmploymentId: currentActiveEmployment.value.id,
      toOrgUnitId: changeForm.orgUnitId
    })
    changeOpen.value = false
    message.success('调岗已提交')
    await loadEmployeeDirectory()
  } catch (error) {
    message.error(resolveErrorMessage(error, '调岗失败'))
  } finally {
    changeSaving.value = false
  }
}

/** confirmEndEmployment ends the current active employment only through the backend command that already exists. */
function confirmEndEmployment() {
  if (!activeTenantId.value || !internalSelectedEmployeeId.value || !currentActiveEmployment.value) {
    return
  }

  const activeEmployment = currentActiveEmployment.value

  Modal.confirm({
    title: '结束任职',
    content: '此操作只结束当前 active employment，不会把账号管理并入 HR 页面。',
    okText: '确认结束',
    cancelText: '取消',
    onOk: async () => {
      try {
        await endManagedEmploymentApi(
          activeTenantId.value,
          internalSelectedEmployeeId.value,
          activeEmployment.id,
          {
            effectiveTo: new Date().toISOString(),
            endedReason: 'manual_end'
          }
        )
        message.success('任职已结束')
        await loadEmployeeDirectory()
      } catch (error) {
        message.error(resolveErrorMessage(error, '结束任职失败'))
      }
    }
  })
}

/** openEmployeeAccessDrawer prepares either the enable-login flow or the continue-pending flow in member context. */
function openEmployeeAccessDrawer(mode: 'CONTINUE' | 'ENABLE') {
  accessMode.value = mode
  accessForm.loginEmail = ''
  accessForm.loginPhone = ''
  accessForm.selectedRoleId =
    accountAccess.value?.roles[0]?.id ?? sortedRoleOptions.value[0]?.id ?? ''
  accessOpen.value = true
}

/** submitEmployeeAccess triggers the bounded HR-owned access onboarding command for existing members. */
async function submitEmployeeAccess() {
  if (!activeTenantId.value || !internalSelectedEmployeeId.value || !currentActiveEmployment.value) {
    return
  }

  if (!accessForm.selectedRoleId) {
    message.error('请选择一个访问角色')
    return
  }

  const existingAccountId = accountAccess.value?.account?.accountId
  if (!existingAccountId && !accessForm.loginEmail.trim() && !accessForm.loginPhone.trim()) {
    message.error('邮箱或手机号至少填写一项')
    return
  }

  accessSaving.value = true
  try {
    const result = await completeManagedEmployeeAccessApi(
      activeTenantId.value,
      internalSelectedEmployeeId.value,
      existingAccountId
        ? {
            employmentId: currentActiveEmployment.value.id,
            existingAccountId,
            reason: 'member_access_continue',
            roleIds: [accessForm.selectedRoleId]
          }
        : {
            employmentId: currentActiveEmployment.value.id,
            reason:
              accessMode.value === 'CONTINUE'
                ? 'member_access_continue'
                : 'member_access_enable',
            roleIds: [accessForm.selectedRoleId],
            createAccount: {
              displayName: detail.value?.employee.employeeCode || internalSelectedEmployeeId.value,
              email: accessForm.loginEmail.trim() || undefined,
              phone: accessForm.loginPhone.trim() || undefined
            }
          }
    )
    accessOpen.value = false
    message.success(result.status === 'PENDING' ? '登录接入仍待继续完成' : '成员登录接入已提交')
    await loadEmployeeAccountAccess(internalSelectedEmployeeId.value)
  } catch (error) {
    message.error(resolveErrorMessage(error, '成员登录接入失败'))
  } finally {
    accessSaving.value = false
  }
}

/** openAccountManagementLink jumps to the independent account owner entry instead of mutating account state inside HR. */
function openAccountManagementLink() {
  void router.push('/admin/account-management')
}

function formatOrgName(orgUnitId?: string) {
  if (!orgUnitId) {
    return '未建立任职'
  }

  return findManagedOrgUnitOption(orgOptions.value, orgUnitId)?.name ?? orgUnitId
}

function resolveEmploymentOrgUnit(employment?: HrManagementApi.EmploymentSummary) {
  return employment?.orgUnit ?? findManagedOrgUnitOption(orgOptions.value, employment?.orgUnitId)
}

function formatEmploymentOrgTitle(employment?: HrManagementApi.EmploymentSummary) {
  const orgUnit = resolveEmploymentOrgUnit(employment)
  return orgUnit?.name || formatOrgName(employment?.orgUnitId)
}

function formatEmploymentOrgSummary(employment?: HrManagementApi.EmploymentSummary) {
  const orgUnit = resolveEmploymentOrgUnit(employment)
  if (!orgUnit) {
    return ''
  }

  const organizationPartyName = formatManagedOrganizationPartyName(orgUnit)
  return [orgUnit.type, organizationPartyName].filter(Boolean).join(' · ')
}

function formatEmploymentStatus(status?: string) {
  if (status === 'ENDED') {
    return '已结束'
  }

  if (status === 'ACTIVE') {
    return '任职中'
  }

  return status || '未知'
}

function formatLifecycleStatus(status?: string) {
  switch (status) {
    case 'PREBOARDING':
      return '待入职'
    case 'ACTIVE':
      return '在职'
    case 'OFFBOARDED':
      return '已离职'
    default:
      return status || '未知'
  }
}

function formatAccountAccessStatus(status?: string) {
  switch (status) {
    case 'ACTIVE':
      return '已开通登录'
    case 'PENDING':
      return '待继续完成接入'
    case 'NOT_ENABLED':
      return '未开通登录'
    default:
      return status || '未知'
  }
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

function formatEmploymentTimeline(employment: HrManagementApi.EmploymentSummary) {
  const timeRange = employment.effectiveTo
    ? `${employment.effectiveFrom} -> ${employment.effectiveTo}`
    : employment.effectiveFrom
  return [formatEmploymentOrgSummary(employment), timeRange, employment.endedReason].filter(Boolean).join(' · ')
}

function normalizeDateTimeLocal(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return normalized
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00.000Z`
  }

  return new Date(normalized).toISOString()
}

function resolveErrorMessage(error: unknown, fallback: string) {
  const responseMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  return typeof responseMessage === 'string' && responseMessage.trim() ? responseMessage : fallback
}

watch(
  () => props.selectedEmployeeId,
  async (employeeId) => {
    if (!employeeId || employeeId === internalSelectedEmployeeId.value) {
      return
    }

    if (employees.value.some((item) => item.employee.id === employeeId)) {
      internalSelectedEmployeeId.value = employeeId
      await loadEmployeeDetail(employeeId)
    }
  }
)

onMounted(async () => {
  try {
    await Promise.all([loadOrgOptions(), loadRoleOptions()])
    await loadEmployeeDirectory()
  } catch (error) {
    message.error(resolveErrorMessage(error, '员工与任职入口初始化失败'))
  }
})
</script>

<template>
  <div class="employee-management-workspace">
    <div class="employee-management__grid">
      <Card :bordered="false" class="employee-management__panel">
        <template #title>成员列表</template>
        <template #extra>
          <Button
            v-if="canCreateEmployee"
            data-testid="employee-create-open"
            type="primary"
            @click="openCreateDrawer"
          >
            创建员工
          </Button>
        </template>
        <div v-if="employees.length === 0" class="employee-management__empty-shell">
          <Empty description="当前租户暂无成员" />
        </div>
        <div v-else class="employee-management__list" v-loading="loading">
          <button
            v-for="item in employees"
            :key="item.employee.id"
            class="employee-management__row"
            :class="{ 'employee-management__row--active': item.employee.id === internalSelectedEmployeeId }"
            type="button"
            @click="selectEmployee(item.employee.id)"
          >
            <div class="employee-management__row-main">
              <div class="employee-management__row-title">{{ item.employee.employeeCode }}</div>
              <div class="employee-management__row-meta">
                {{ formatEmploymentOrgTitle(item.activeEmployment) }}
              </div>
              <div
                v-if="formatEmploymentOrgSummary(item.activeEmployment)"
                class="employee-management__row-meta"
              >
                {{ formatEmploymentOrgSummary(item.activeEmployment) }}
              </div>
            </div>
            <Tag :color="item.employee.lifecycleStatus === 'OFFBOARDED' ? 'default' : 'green'">
              {{ formatLifecycleStatus(item.employee.lifecycleStatus) }}
            </Tag>
          </button>
        </div>
      </Card>

      <Card :bordered="false" class="employee-management__panel">
        <template #title>成员详情</template>
        <div v-if="!detail" class="employee-management__empty-shell">
          <Empty description="从左侧选择成员查看详情" />
        </div>
        <div v-else class="employee-management__detail" v-loading="detailLoading">
          <div class="employee-management__detail-head">
            <div>
              <div class="employee-management__detail-title">
                {{ detail.employee.employeeCode }}
              </div>
              <div class="employee-management__detail-subtitle">
                {{ activeTenantName || detail.employee.tenantId }}
              </div>
            </div>
            <div class="employee-management__detail-actions">
              <Button
                v-if="canChangeEmployment && currentActiveEmployment"
                data-testid="change-employment-open"
                @click="openChangeEmploymentDrawer"
              >
                调岗
              </Button>
              <Button
                v-if="canEndEmployment && currentActiveEmployment"
                danger
                data-testid="employment-end-button"
                @click="confirmEndEmployment"
              >
                结束任职
              </Button>
            </div>
          </div>

          <div class="employee-management__section-grid">
            <section class="employee-management__section-card">
              <div class="employee-management__section-head">
                <div class="employee-management__section-title">员工信息</div>
                <div class="employee-management__section-hint">只展示 HR 主档字段，不混入账号 owner。</div>
              </div>
              <div class="employee-management__detail-grid">
                <div class="employee-management__detail-item">
                  <span>员工编码</span>
                  <strong>{{ detail.employee.employeeCode }}</strong>
                </div>
                <div class="employee-management__detail-item">
                  <span>员工 ID</span>
                  <strong>{{ detail.employee.id }}</strong>
                </div>
                <div class="employee-management__detail-item">
                  <span>生命周期</span>
                  <strong>{{ formatLifecycleStatus(detail.employee.lifecycleStatus) }}</strong>
                </div>
              </div>
            </section>

            <section class="employee-management__section-card">
              <div class="employee-management__section-head">
                <div class="employee-management__section-title">当前任职</div>
                <div class="employee-management__section-hint">当前第一阶段只显示唯一 active employment。</div>
              </div>
              <div v-if="currentActiveEmployment" class="employee-management__detail-grid">
                <div class="employee-management__detail-item">
                  <span>当前 OrgUnit</span>
                  <strong>{{ formatEmploymentOrgTitle(currentActiveEmployment) }}</strong>
                </div>
                <div class="employee-management__detail-item">
                  <span>组织摘要</span>
                  <strong>{{ formatEmploymentOrgSummary(currentActiveEmployment) || '未补充组织摘要' }}</strong>
                </div>
                <div class="employee-management__detail-item">
                  <span>任职状态</span>
                  <strong>{{ formatEmploymentStatus(currentActiveEmployment.status) }}</strong>
                </div>
                <div class="employee-management__detail-item">
                  <span>生效时间</span>
                  <strong>{{ currentActiveEmployment.effectiveFrom }}</strong>
                </div>
              </div>
              <Empty v-else description="当前未建立 active employment" />
            </section>

            <section class="employee-management__section-card">
              <div class="employee-management__section-head">
                <div class="employee-management__section-title">其他任职</div>
                <div class="employee-management__section-hint">第一阶段不开放兼任管理。</div>
              </div>
              <Empty description="第一阶段暂不开放兼任管理" />
            </section>

            <section class="employee-management__section-card">
              <div class="employee-management__section-head">
                <div class="employee-management__section-title">任职记录</div>
                <div class="employee-management__section-hint">展示 current + ended employments。</div>
              </div>
              <div v-if="employmentHistory.length > 0" class="employee-management__history">
                <div
                  v-for="employment in employmentHistory"
                  :key="employment.id"
                  class="employee-management__history-item"
                >
                  <div>
                    <strong>{{ formatEmploymentOrgTitle(employment) }}</strong>
                    <div class="employee-management__history-meta">
                      {{ formatEmploymentTimeline(employment) }}
                    </div>
                  </div>
                  <Tag :color="employment.status === 'ENDED' ? 'default' : 'green'">
                    {{ formatEmploymentStatus(employment.status) }}
                  </Tag>
                </div>
              </div>
              <Empty v-else description="暂无任职记录" />
            </section>

            <section class="employee-management__section-card">
              <div class="employee-management__section-head">
                <div class="employee-management__section-title">账号与访问</div>
                <div class="employee-management__section-hint">
                  第一阶段只显示登录接入状态、账号摘要、脱敏登录方式与角色摘要。
                </div>
              </div>
              <div class="employee-management__detail-grid" v-loading="accessLoading">
                <div class="employee-management__detail-item">
                  <span>登录接入状态</span>
                  <strong>{{ formatAccountAccessStatus(accountAccess?.status) }}</strong>
                </div>
                <div class="employee-management__detail-item">
                  <span>账号摘要</span>
                  <strong>
                    {{
                      accountAccess?.account
                        ? `${accountAccess.account.displayName || '未命名账号'} · ${accountAccess.account.accountId}`
                        : '尚未建立账号'
                    }}
                  </strong>
                </div>
                <div class="employee-management__detail-item">
                  <span>登录方式摘要</span>
                  <strong>{{ formatLoginMethodSummary(accountAccess?.loginMethods ?? []) }}</strong>
                </div>
                <div class="employee-management__detail-item">
                  <span>角色摘要</span>
                  <strong>{{ formatRoleSummary(accountAccess?.roles ?? []) }}</strong>
                </div>
                <div v-if="accountAccess?.failureReason" class="employee-management__detail-item">
                  <span>待处理原因</span>
                  <strong>{{ accountAccess.failureReason }}</strong>
                </div>
              </div>
              <div class="employee-management__link-actions">
                <Button
                  v-if="canProvisionLogin && currentActiveEmployment && accountAccess?.status === 'NOT_ENABLED'"
                  data-testid="employee-enable-access-open"
                  @click="openEmployeeAccessDrawer('ENABLE')"
                >
                  开通登录
                </Button>
                <Button
                  v-if="canProvisionLogin && currentActiveEmployment && accountAccess?.status === 'PENDING'"
                  data-testid="employee-continue-access-open"
                  @click="openEmployeeAccessDrawer('CONTINUE')"
                >
                  继续完成接入
                </Button>
                <Button
                  v-if="canOpenAccountManagement"
                  data-testid="employee-account-management-link"
                  @click="openAccountManagementLink"
                >
                  前往账号管理
                </Button>
              </div>
            </section>
          </div>
        </div>
      </Card>
    </div>

    <Card v-if="createOpen" :bordered="false" class="employee-management__panel">
      <template #title>创建员工与任职</template>
      <div class="employee-management__form-grid">
        <label class="employee-management__field">
          <span>员工编码</span>
          <input
            v-model="createForm.employeeCode"
            data-testid="employee-code-input"
            type="text"
          >
        </label>
        <label class="employee-management__field">
          <span>TenantPartyId</span>
          <input
            v-model="createForm.tenantPartyId"
            data-testid="employee-tenant-party-input"
            type="text"
          >
        </label>
        <label class="employee-management__field">
          <span>PartyId</span>
          <input
            v-model="createForm.partyId"
            data-testid="employee-party-input"
            type="text"
          >
        </label>
        <label class="employee-management__field">
          <span>OrgUnit</span>
          <select
            v-model="createForm.orgUnitId"
            data-testid="employee-org-select"
          >
            <option v-for="option in orgOptions" :key="option.id" :value="option.id">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="employee-management__field">
          <span>生效时间</span>
          <input
            v-model="createForm.effectiveFrom"
            data-testid="employee-effective-from-input"
            type="datetime-local"
          >
        </label>
        <label class="employee-management__field employee-management__field--checkbox">
          <span>允许登录</span>
          <input
            v-model="createForm.allowLogin"
            data-testid="employee-allow-login-toggle"
            type="checkbox"
            :disabled="!canProvisionLogin"
          >
        </label>
        <template v-if="createForm.allowLogin">
          <label class="employee-management__field">
            <span>登录邮箱</span>
            <input
              v-model="createForm.loginEmail"
              data-testid="employee-login-email-input"
              type="email"
            >
          </label>
          <label class="employee-management__field">
            <span>登录手机号</span>
            <input
              v-model="createForm.loginPhone"
              type="text"
            >
          </label>
          <label class="employee-management__field">
            <span>访问角色</span>
            <select
              v-model="createForm.selectedRoleId"
              data-testid="employee-login-role-select"
            >
              <option value="">请选择角色</option>
              <option v-for="role in sortedRoleOptions" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </label>
        </template>
      </div>
      <div class="employee-management__form-actions">
        <Button @click="createOpen = false">取消</Button>
        <Button
          type="primary"
          data-testid="employee-create-submit"
          :loading="createSaving"
          @click="submitCreateFlow"
        >
          提交
        </Button>
      </div>
    </Card>

    <Card v-if="changeOpen" :bordered="false" class="employee-management__panel">
      <template #title>调岗</template>
      <div class="employee-management__form-grid">
        <label class="employee-management__field">
          <span>目标 OrgUnit</span>
          <select
            v-model="changeForm.orgUnitId"
            data-testid="change-employment-org-select"
          >
            <option v-for="option in orgOptions" :key="option.id" :value="option.id">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="employee-management__field">
          <span>生效时间</span>
          <input
            v-model="changeForm.effectiveFrom"
            data-testid="change-employment-effective-from-input"
            type="datetime-local"
          >
        </label>
      </div>
      <div class="employee-management__form-actions">
        <Button @click="changeOpen = false">取消</Button>
        <Button
          type="primary"
          data-testid="change-employment-submit"
          :loading="changeSaving"
          @click="submitChangeEmployment"
        >
          提交
        </Button>
      </div>
    </Card>

    <Card v-if="accessOpen" :bordered="false" class="employee-management__panel">
      <template #title>
        {{ accessMode === 'CONTINUE' ? '继续完成成员登录接入' : '开通成员登录' }}
      </template>
      <div class="employee-management__form-grid">
        <div class="employee-management__field">
          <span>当前成员</span>
          <strong>{{ detail?.employee.employeeCode || '-' }}</strong>
        </div>
        <div class="employee-management__field">
          <span>访问角色</span>
          <select
            v-model="accessForm.selectedRoleId"
            data-testid="employee-login-role-select"
          >
            <option value="">请选择角色</option>
            <option v-for="role in sortedRoleOptions" :key="role.id" :value="role.id">
              {{ role.name }}
            </option>
          </select>
        </div>
        <template v-if="shouldCollectAccessContacts">
          <label class="employee-management__field">
            <span>登录邮箱</span>
            <input
              v-model="accessForm.loginEmail"
              data-testid="employee-login-email-input"
              type="email"
            >
          </label>
          <label class="employee-management__field">
            <span>登录手机号</span>
            <input
              v-model="accessForm.loginPhone"
              type="text"
            >
          </label>
        </template>
        <div v-else class="employee-management__field">
          <span>复用账号</span>
          <strong>{{ accountAccess?.account?.displayName || accountAccess?.account?.accountId || '-' }}</strong>
        </div>
      </div>
      <div class="employee-management__form-actions">
        <Button @click="accessOpen = false">取消</Button>
        <Button
          type="primary"
          data-testid="employee-access-submit"
          :loading="accessSaving"
          @click="submitEmployeeAccess"
        >
          提交
        </Button>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.employee-management-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.employee-management__detail-head,
.employee-management__form-actions,
.employee-management__section-head,
.employee-management__link-actions {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.employee-management__grid,
.employee-management__detail-grid,
.employee-management__form-grid,
.employee-management__section-grid {
  display: grid;
  gap: 16px;
}

.employee-management__detail-grid,
.employee-management__form-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.employee-management__grid {
  grid-template-columns: minmax(280px, 0.95fr) minmax(420px, 1.05fr);
}

.employee-management__panel {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.employee-management__section-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.employee-management__section-card,
.employee-management__detail-item,
.employee-management__field,
.employee-management__history-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
}

.employee-management__section-card {
  gap: 14px;
}

.employee-management__section-title,
.employee-management__detail-title {
  font-size: 16px;
  font-weight: 700;
}

.employee-management__section-hint,
.employee-management__detail-subtitle,
.employee-management__detail-item span,
.employee-management__history-meta,
.employee-management__field span,
.employee-management__row-meta {
  color: #64748b;
  font-size: 12px;
}

.employee-management__list,
.employee-management__detail,
.employee-management__history {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.employee-management__row {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  text-align: left;
  width: 100%;
}

.employee-management__row--active {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.08);
}

.employee-management__row-title {
  font-size: 15px;
  font-weight: 700;
}

.employee-management__detail-actions {
  display: flex;
  gap: 8px;
}

.employee-management__empty-shell {
  padding: 24px 0;
}

.employee-management__field input,
.employee-management__field select {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  min-height: 40px;
  padding: 0 12px;
}

.employee-management__field--checkbox input {
  min-height: auto;
  width: 18px;
}

@media (max-width: 960px) {
  .employee-management__grid {
    grid-template-columns: 1fr;
  }

  .employee-management__detail-head,
  .employee-management__form-actions,
  .employee-management__section-head,
  .employee-management__link-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
