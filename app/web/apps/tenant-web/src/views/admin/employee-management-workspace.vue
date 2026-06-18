<script setup lang="ts">
import type { HrManagementApi, RoleManagementApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { IconifyIcon } from '@vben/icons'

import {
  Button,
  Card,
  Checkbox,
  Descriptions,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  Menu,
  message,
  Modal,
  QRCode,
  Radio,
  Select,
  Space,
  Tabs,
  Table,
  Tag,
  TreeSelect
} from 'ant-design-vue'

import {
  changeManagedPrimaryEmploymentApi,
  completeManagedEmployeeAccessApi,
  createManagedEmployeeApi,
  createManagedEmploymentApi,
  endManagedEmploymentApi,
  getManagedEmployeeAccountAccessApi,
  getManagedEmployeeDetailApi,
  getManagedNextEmployeeCodeApi,
  getManagedOrgTreeApi,
  listManagedEmployeesApi,
  listRolesApi,
  searchManagedEmployeeUserCandidatesApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

import PhoneNumberInput from '../_core/authentication/phone-number-input.vue'
import {
  findManagedOrgUnitOption,
  flattenManagedOrgTree,
  formatManagedOrganizationTenantPartyName
} from './org-read-side'

interface CreateEmployeeFormState {
  accountMode: 'EXISTING_USER' | 'NEW_USER'
  allowLogin: boolean
  displayName: string
  employeeCodePreview: string
  existingUserDisplayName: string
  existingUserId: string
  gender: string
  identityDocumentNumber: string
  identityDocumentType: string
  identityIssuerCountry: string
  joinedOn: string
  loginEmail: string
  loginPhone: string
  orgUnitId: string
  primaryPositionName: string
  selectedRoleId: string
}

interface ChangeEmploymentFormState {
  effectiveFrom: string
  orgUnitId: string
  positionName: string
}

interface EmployeeAccessFormState {
  loginEmail: string
  loginPhone: string
  selectedRoleId: string
}

interface EmployeeFilterFormState {
  keyword?: string
  lifecycleStatus?: 'ACTIVE' | 'ALL' | 'OFFBOARDED' | 'PREBOARDING'
  orgUnitIds?: string[]
}

interface DepartmentTreeOption {
  children: DepartmentTreeOption[]
  disabled?: boolean
  key: string
  title: string
  value: string
}

interface EmployeeGridRow {
  activeEmploymentId?: string
  employeeCode: string
  id: string
  joinedAt: string
  lifecycleStatus: string
  name: string
  positionName: string
  primaryDepartment: string
}

interface Props {
  selectedEmployeeId?: string
}

type EmployeeActionKey = 'account' | 'changeEmployment' | 'detail' | 'edit' | 'offboard'
type EmployeeColumnKey =
  | 'employeeCode'
  | 'joinedAt'
  | 'lifecycleStatus'
  | 'name'
  | 'operation'
  | 'positionName'
  | 'primaryDepartment'

interface TableActionMenuItem<ActionKey extends string> {
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  key: ActionKey
  label: string
  testId?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedEmployeeId: ''
})

const emit = defineEmits<{
  (event: 'update:selectedEmployeeId', value: string): void
}>()

const authContextStore = useAuthContextStore()
const operationColumnTitle = '操作'
const router = useRouter()
const employeeColumnWidths = reactive<Record<EmployeeColumnKey, number>>({
  employeeCode: 140,
  joinedAt: 150,
  lifecycleStatus: 120,
  name: 220,
  operation: 180,
  positionName: 220,
  primaryDepartment: 200
})
const employeeColumnMinWidths: Record<EmployeeColumnKey, number> = {
  employeeCode: 120,
  joinedAt: 120,
  lifecycleStatus: 96,
  name: 160,
  operation: 120,
  positionName: 140,
  primaryDepartment: 140
}
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? ''
)
const canListEmployees = computed(() => authContextStore.actionCodes.includes('hr.employee.list'))
const canViewEmployeeDetail = computed(() =>
  authContextStore.actionCodes.includes('hr.employee.get_by_id')
)
const canCreateEmployee = computed(() => authContextStore.actionCodes.includes('hr.employee.create'))
const canCreateEmployment = computed(() =>
  authContextStore.actionCodes.includes('hr.employment.create')
)
const canChangeEmployment = computed(() =>
  authContextStore.actionCodes.includes('hr.employment.change_primary')
)
const canEndEmployment = computed(() => authContextStore.actionCodes.includes('hr.employment.end'))
const canProvisionLogin = computed(() =>
  authContextStore.actionCodes.includes('identity.account.create')
)
const canOpenAccountManagement = computed(() =>
  (authContextStore.visibleEntries ?? []).includes('admin.account-management')
)

const detailLoading = ref(false)
const accessLoading = ref(false)
const createSaving = ref(false)
const changeSaving = ref(false)
const accessSaving = ref(false)
const employees = ref<HrManagementApi.EmployeeDirectoryItem[]>([])
const employeeRows = ref<EmployeeGridRow[]>([])
const employeeLoading = ref(false)
const employeeTotal = ref(0)
const internalSelectedEmployeeId = ref('')
const detail = ref<HrManagementApi.EmployeeDetailResult | null>(null)
const accountAccess = ref<HrManagementApi.EmployeeAccountAccessResult | null>(null)
const detailDrawerOpen = ref(false)
const detailDrawerTab = ref('overview')
const orgOptions = ref<ReturnType<typeof flattenManagedOrgTree>>([])
const roleOptions = ref<RoleManagementApi.Role[]>([])
const createOpen = ref(false)
const changeOpen = ref(false)
const accessOpen = ref(false)
const existingUserSearchLoading = ref(false)
const existingUserOptions = ref<Array<{ displayName?: string; label: string; userId?: string; value: string }>>([])
const accessMode = ref<'CONTINUE' | 'ENABLE'>('ENABLE')
const createForm = ref<CreateEmployeeFormState>({
  accountMode: 'NEW_USER',
  allowLogin: false,
  displayName: '',
  employeeCodePreview: '',
  existingUserDisplayName: '',
  existingUserId: '',
  gender: '',
  identityDocumentNumber: '',
  identityDocumentType: 'NATIONAL_ID',
  identityIssuerCountry: 'CN',
  joinedOn: '',
  loginEmail: '',
  loginPhone: '',
  orgUnitId: '',
  primaryPositionName: '',
  selectedRoleId: ''
})
const changeForm = ref<ChangeEmploymentFormState>({
  effectiveFrom: '',
  orgUnitId: '',
  positionName: ''
})
const accessForm = ref<EmployeeAccessFormState>({
  loginEmail: '',
  loginPhone: '',
  selectedRoleId: ''
})
const employeeFilters = reactive<EmployeeFilterFormState>({
  keyword: '',
  lifecycleStatus: 'ALL',
  orgUnitIds: []
})
let activeEmployeeColumnCleanup: null | (() => void) = null

const currentActiveEmployment = computed(() => detail.value?.activeEmployment)
const employeeCodeQrValue = computed(() => detail.value?.employee.employeeCode ?? '')
const employmentHistory = computed(() => detail.value?.employments ?? [])
const sortedRoleOptions = computed(() =>
  roleOptions.value.filter((role) => role.isEnabled !== false)
)
const shouldCollectAccessContacts = computed(() => !accountAccess.value?.account?.accountId)
const orgSelectOptions = computed(() =>
  orgOptions.value.map((orgUnit) => ({
    label: orgUnit.label,
    value: orgUnit.id
  }))
)
const departmentTreeOptions = computed(() => buildDepartmentTreeOptions())
const placementTreeOptions = computed(() => buildDepartmentTreeOptions({ disableRoot: true }))
const roleSelectOptions = computed(() =>
  sortedRoleOptions.value.map((role) => ({
    label: role.name || role.code,
    value: role.id
  }))
)
const departmentDropdownWidth = 320
const departmentDropdownStyle = {
  maxHeight: '360px',
  overflow: 'auto'
} as const
const drawerChildModalZIndex = 1200
const employeeTableScrollX = computed(() =>
  Object.values(employeeColumnWidths).reduce((sum, width) => sum + width, 0)
)

// compareEmployeeColumnText keeps employee table sorting locale-aware and numeric-friendly.
function compareEmployeeColumnText(left?: string, right?: string) {
  return (left || '').localeCompare(right || '', 'zh-Hans-CN', {
    numeric: true,
    sensitivity: 'base'
  })
}

// stopEmployeeColumnResize releases active listeners after resizing an employee table column.
function stopEmployeeColumnResize() {
  activeEmployeeColumnCleanup?.()
  activeEmployeeColumnCleanup = null
  document.body.classList.remove('employee-management--resizing-column')
}

// startEmployeeColumnResize updates one employee table column width from pointer movement.
function startEmployeeColumnResize(event: MouseEvent, columnKey: EmployeeColumnKey) {
  event.preventDefault()
  event.stopPropagation()

  stopEmployeeColumnResize()

  const startX = event.clientX
  const startWidth = employeeColumnWidths[columnKey]

  const handleMouseMove = (moveEvent: MouseEvent) => {
    employeeColumnWidths[columnKey] = Math.max(
      employeeColumnMinWidths[columnKey],
      Math.round(startWidth + moveEvent.clientX - startX)
    )
  }

  const handleMouseUp = () => {
    stopEmployeeColumnResize()
  }

  document.body.classList.add('employee-management--resizing-column')
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp, { once: true })
  activeEmployeeColumnCleanup = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}

// renderResizableEmployeeHeader exposes a compact resize handle for employee table columns.
function renderResizableEmployeeHeader(columnKey: EmployeeColumnKey, label: string) {
  return h('div', { class: 'employee-management__resizable-title' }, [
    h('span', { class: 'employee-management__resizable-title-text' }, label),
    h('span', {
      'aria-label': `调整${label}列宽`,
      class: 'employee-management__column-resizer',
      onMousedown: (event: MouseEvent) => startEmployeeColumnResize(event, columnKey),
      role: 'separator'
    })
  ])
}

const employeeColumns = computed<TableColumnsType<EmployeeGridRow>>(() => [
  {
    dataIndex: 'name',
    key: 'name',
    title: renderResizableEmployeeHeader('name', '员工姓名'),
    width: employeeColumnWidths.name
  },
  {
    dataIndex: 'employeeCode',
    key: 'employeeCode',
    sorter: (left, right) => compareEmployeeColumnText(left.employeeCode, right.employeeCode),
    title: renderResizableEmployeeHeader('employeeCode', '工号'),
    width: employeeColumnWidths.employeeCode
  },
  {
    dataIndex: 'primaryDepartment',
    key: 'primaryDepartment',
    sorter: (left, right) =>
      compareEmployeeColumnText(left.primaryDepartment, right.primaryDepartment),
    title: renderResizableEmployeeHeader('primaryDepartment', '所属部门'),
    width: employeeColumnWidths.primaryDepartment
  },
  {
    dataIndex: 'positionName',
    key: 'positionName',
    title: renderResizableEmployeeHeader('positionName', '职位'),
    width: employeeColumnWidths.positionName
  },
  {
    dataIndex: 'joinedAt',
    key: 'joinedAt',
    title: renderResizableEmployeeHeader('joinedAt', '入职日期'),
    width: employeeColumnWidths.joinedAt
  },
  {
    dataIndex: 'lifecycleStatus',
    key: 'lifecycleStatus',
    title: renderResizableEmployeeHeader('lifecycleStatus', '状态'),
    width: employeeColumnWidths.lifecycleStatus
  },
  {
    align: 'center',
    fixed: 'right',
    key: 'operation',
    title: renderResizableEmployeeHeader('operation', operationColumnTitle),
    width: employeeColumnWidths.operation
  }
])

/** getEmployeeActionItems exposes employee row operations for the native Ant Design dropdown. */
function getEmployeeActionItems(employee: Record<string, any>): TableActionMenuItem<EmployeeActionKey>[] {
  const employeeId = `${employee.id ?? ''}`

  return [
    {
      hidden: !canViewEmployeeDetail.value,
      key: 'detail',
      label: '查看详情',
      testId: `employee-open-detail-${employeeId}`
    },
    {
      hidden: !canViewEmployeeDetail.value,
      key: 'edit',
      label: '编辑',
      testId: `employee-edit-${employeeId}`
    },
    {
      hidden: !canChangeEmployment.value || !employee.activeEmploymentId,
      key: 'changeEmployment',
      label: '调岗位',
      testId: `employee-change-employment-${employeeId}`
    },
    {
      danger: true,
      hidden: !canEndEmployment.value || !employee.activeEmploymentId,
      key: 'offboard',
      label: '离岗',
      testId: `employee-offboard-${employeeId}`
    },
    {
      hidden: !canOpenAccountManagement.value,
      key: 'account',
      label: '前往账号',
      testId: `employee-account-link-${employeeId}`
    }
  ]
}

/** getVisibleTableActionItems filters hidden table actions before handing them to Ant Design Menu. */
function getVisibleTableActionItems<ActionKey extends string>(items: TableActionMenuItem<ActionKey>[]) {
  return items.filter((item) => !item.hidden)
}

/** syncSelectedEmployeeId keeps the current selection aligned with the owning page shell when one exists. */
function syncSelectedEmployeeId(employeeId: string) {
  if (employeeId === internalSelectedEmployeeId.value) {
    return
  }

  internalSelectedEmployeeId.value = employeeId
  emit('update:selectedEmployeeId', employeeId)
}

/** loadOrgOptions reuses the tenant org tree read model as the only department selector truth. */
async function loadOrgOptions() {
  if (!activeTenantId.value) {
    orgOptions.value = []
    return
  }

  const result = await getManagedOrgTreeApi(activeTenantId.value)
  orgOptions.value = flattenManagedOrgTree(result.roots ?? [])
}

/** loadRoleOptions reuses the role directory for employee access onboarding actions. */
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

/** loadEmployeeDetail refreshes the selected employee drawer data from the bounded HR entry. */
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

/** resolvePreferredEmployeeId keeps either the requested selection or the first visible employee stable across refreshes. */
function resolvePreferredEmployeeId(items: HrManagementApi.EmployeeDirectoryItem[]) {
  const requestedEmployeeId = props.selectedEmployeeId
  if (requestedEmployeeId && items.some((item) => item.employee.id === requestedEmployeeId)) {
    return requestedEmployeeId
  }

  if (
    internalSelectedEmployeeId.value &&
    items.some((item) => item.employee.id === internalSelectedEmployeeId.value)
  ) {
    return internalSelectedEmployeeId.value
  }

  return items[0]?.employee.id ?? ''
}

/** queryEmployeeGrid loads and filters the employee directory for the shared workbench grid. */
async function queryEmployeeGrid(formValues: EmployeeFilterFormState = {}) {
  if (!canListEmployees.value || !activeTenantId.value) {
    employees.value = []
    employeeRows.value = []
    employeeTotal.value = 0
    syncSelectedEmployeeId('')
    detail.value = null
    accountAccess.value = null
    detailDrawerOpen.value = false
    return { items: [] as EmployeeGridRow[], total: 0 }
  }

  employeeLoading.value = true
  try {
    const result = await listManagedEmployeesApi(activeTenantId.value, {
      keyword: formValues.keyword?.trim() || undefined,
      lifecycleStatus:
        formValues.lifecycleStatus && formValues.lifecycleStatus !== 'ALL'
          ? formValues.lifecycleStatus
          : undefined,
      page: 1,
      pageSize: 20
    })
    employees.value = result.items ?? []

    const filteredItems = employees.value.filter((item) => matchesEmployeeFilters(item, formValues))
    const rows = filteredItems.map((item) => buildEmployeeGridRow(item))
    const nextEmployeeId = resolvePreferredEmployeeId(filteredItems)
    employeeRows.value = rows
    employeeTotal.value = rows.length
    syncSelectedEmployeeId(nextEmployeeId)

    if (!nextEmployeeId) {
      detail.value = null
      accountAccess.value = null
      detailDrawerOpen.value = false
    } else if (detailDrawerOpen.value) {
      await loadEmployeeDetail(nextEmployeeId)
    }

    return {
      items: rows,
      total: rows.length
    }
  } finally {
    employeeLoading.value = false
  }
}

/** selectEmployee opens the member drawer and loads the latest detail for the chosen employee. */
async function selectEmployee(employeeId: string) {
  syncSelectedEmployeeId(employeeId)
  detailDrawerTab.value = 'overview'
  detailDrawerOpen.value = true
  await loadEmployeeDetail(employeeId)
}

/** handleEmployeeAction dispatches one dropdown menu action for an employee row. */
async function handleEmployeeAction(actionKey: EmployeeActionKey, employee: Record<string, any>) {
  const employeeId = `${employee.id ?? ''}`

  if (actionKey === 'detail') {
    await openEmployeeDetailPage(employeeId)
    return
  }

  if (actionKey === 'changeEmployment') {
    await prepareEmploymentRowAction(employeeId)
    openChangeEmploymentModal()
    return
  }

  if (actionKey === 'offboard') {
    await prepareEmploymentRowAction(employeeId)
    confirmEndEmployment()
    return
  }

  if (actionKey === 'account') {
    syncSelectedEmployeeId(employeeId)
    openAccountManagementLink()
    return
  }

  await selectEmployee(employeeId)
}

/** prepareEmploymentRowAction loads the current employment context without making the drawer the action owner. */
async function prepareEmploymentRowAction(employeeId: string) {
  syncSelectedEmployeeId(employeeId)
  await loadEmployeeDetail(employeeId)
}

/** openEmployeeDetailPage routes member reads to the independent employee detail page. */
async function openEmployeeDetailPage(employeeId: string) {
  syncSelectedEmployeeId(employeeId)
  await router.push({
    name: 'TenantEmployeeDetail',
    params: {
      employeeId
    }
  })
}

/** openCreateModal resets the employee creation draft for HR and optional access onboarding. */
function openCreateModal() {
  if (!canCreateEmployee.value) {
    return
  }

  createForm.value = {
    accountMode: 'NEW_USER',
    allowLogin: false,
    displayName: '',
    employeeCodePreview: '生成中',
    existingUserDisplayName: '',
    existingUserId: '',
    gender: '',
    identityDocumentNumber: '',
    identityDocumentType: 'NATIONAL_ID',
    identityIssuerCountry: 'CN',
    joinedOn: '',
    loginEmail: '',
    loginPhone: '',
    orgUnitId: orgOptions.value.find((orgUnit) => orgUnit.type !== 'ROOT')?.id ?? '',
    primaryPositionName: '',
    selectedRoleId: sortedRoleOptions.value[0]?.id ?? ''
  }
  existingUserOptions.value = []
  createOpen.value = true
  void loadEmployeeCodePreview()
}

/** loadEmployeeCodePreview shows the system-owned employee code before submission without making it user-editable. */
async function loadEmployeeCodePreview() {
  if (!activeTenantId.value) {
    createForm.value.employeeCodePreview = '提交时生成'
    return
  }

  try {
    const result = await getManagedNextEmployeeCodeApi(activeTenantId.value)
    createForm.value.employeeCodePreview = result.employeeCode || '提交时生成'
  } catch (error) {
    createForm.value.employeeCodePreview = '提交时生成'
    message.error(resolveErrorMessage(error, '员工码预览加载失败'))
  }
}

/** submitCreateFlow creates the employee, establishes the first employment, and optionally starts login onboarding. */
async function submitCreateFlow() {
  if (!activeTenantId.value || !canCreateEmployee.value) {
    return
  }

  if (!createForm.value.displayName.trim()) {
    message.error('请填写员工姓名')
    return
  }

  if (!createForm.value.identityDocumentNumber.trim()) {
    message.error('请填写证件号码')
    return
  }

  if (!createForm.value.orgUnitId) {
    message.error('请选择主任职部门')
    return
  }

  if (!createForm.value.primaryPositionName.trim()) {
    message.error('请填写主任职职务')
    return
  }

  if (!createForm.value.joinedOn) {
    message.error('请选择入职日期')
    return
  }

  if (createForm.value.allowLogin) {
    if (!canProvisionLogin.value) {
      message.error('当前操作者没有开通成员登录的权限')
      return
    }

    if (createForm.value.accountMode === 'EXISTING_USER') {
      if (!createForm.value.existingUserId.trim()) {
        message.error('请选择要绑定的已有用户')
        return
      }
    } else if (!createForm.value.loginEmail.trim() && !createForm.value.loginPhone.trim()) {
      message.error('邮箱或手机号至少填写一项')
      return
    }
  }

  createSaving.value = true
  try {
    const created = (await createManagedEmployeeApi(activeTenantId.value, {
      account: createForm.value.allowLogin
        ? {
            displayName: createForm.value.displayName.trim(),
            email:
              createForm.value.accountMode === 'NEW_USER'
                ? createForm.value.loginEmail.trim() || undefined
                : undefined,
            existingUserId:
              createForm.value.accountMode === 'EXISTING_USER'
                ? createForm.value.existingUserId.trim()
                : undefined,
            phone:
              createForm.value.accountMode === 'NEW_USER'
                ? createForm.value.loginPhone.trim() || undefined
                : undefined
          }
        : undefined,
      person: {
        gender: createForm.value.gender || undefined,
        identifiers: [
          {
            identifierType: createForm.value.identityDocumentType,
            issuerCountryOrRegion: createForm.value.identityIssuerCountry,
            normalizedValue: normalizePartyIdentifier(createForm.value.identityDocumentNumber),
            rawValue: createForm.value.identityDocumentNumber.trim()
          }
        ],
        legalName: createForm.value.displayName.trim()
      },
      primaryEmployment: {
        effectiveFrom: normalizeDateInput(createForm.value.joinedOn),
        orgUnitId: createForm.value.orgUnitId,
        positionName: createForm.value.primaryPositionName.trim()
      }
    })) as {
      access?: { status?: string }
      employee?: HrManagementApi.EmployeeSummary
      employment?: HrManagementApi.EmploymentSummary
    }

    let createdEmploymentId = created.employment?.id ?? ''
    if (
      created.employee?.id &&
      createForm.value.orgUnitId &&
      createForm.value.joinedOn &&
      !createdEmploymentId &&
      canCreateEmployment.value
    ) {
      const createdEmployment = (await createManagedEmploymentApi(
        activeTenantId.value,
        created.employee.id,
        {
          effectiveFrom: normalizeDateInput(createForm.value.joinedOn),
          orgUnitId: createForm.value.orgUnitId,
          positionName: createForm.value.primaryPositionName.trim()
        }
      )) as { employment?: HrManagementApi.EmploymentSummary }
      createdEmploymentId = createdEmployment.employment?.id ?? ''
    }

    const accessResult = created.access

    createOpen.value = false
    message.success(
      accessResult?.status && accessResult.status !== 'COMPLETED'
        ? '员工已创建，登录接入待继续完成'
        : (createForm.value.allowLogin
          ? '员工、任职与登录接入已提交'
          : '员工与任职已提交')
    )
    await refreshEmployeeGrid()
    if (created.employee?.id) {
      await selectEmployee(created.employee.id)
    }
  } catch (error) {
    message.error(resolveErrorMessage(error, '员工创建失败'))
  } finally {
    createSaving.value = false
  }
}

/** searchExistingEmployeeUsers resolves exact email/phone matches for HR account binding. */
async function searchExistingEmployeeUsers(keyword: string) {
  const normalizedKeyword = keyword.trim()
  createForm.value.existingUserId = ''
  createForm.value.existingUserDisplayName = ''
  if (!activeTenantId.value || !isExistingUserSearchKeyword(normalizedKeyword)) {
    existingUserOptions.value = []
    return
  }

  existingUserSearchLoading.value = true
  try {
    const result = await searchManagedEmployeeUserCandidatesApi(
      activeTenantId.value,
      normalizedKeyword,
      createForm.value.identityIssuerCountry || undefined
    )
    existingUserOptions.value = (result.items ?? [])
      .filter((candidate) => candidate.isActive)
      .map((candidate) => ({
        displayName: candidate.displayName,
        label: formatExistingUserCandidate(candidate),
        userId: candidate.userId,
        value: candidate.userId
      }))
  } catch (error) {
    existingUserOptions.value = []
    message.error(resolveErrorMessage(error, '已有用户查询失败'))
  } finally {
    existingUserSearchLoading.value = false
  }
}

/** handleExistingEmployeeUserChange stores the selected user id while keeping the visible label stable. */
function handleExistingEmployeeUserChange(value: unknown) {
  const userId = typeof value === 'string' ? value : ''
  const option = existingUserOptions.value.find((item) => item.value === userId)
  createForm.value.existingUserId = userId
  createForm.value.existingUserDisplayName = option?.displayName || option?.label || ''
}

/** openChangeEmploymentModal seeds the transfer draft from the current active employment context. */
function openChangeEmploymentModal() {
  if (!canChangeEmployment.value) {
    return
  }

  changeForm.value = {
    effectiveFrom: formatDateTimeLocalInputValue(new Date()),
    orgUnitId: currentActiveEmployment.value?.orgUnitId ?? orgOptions.value[0]?.id ?? '',
    positionName: currentActiveEmployment.value?.positionName ?? ''
  }
  changeOpen.value = true
}

/** submitChangeEmployment runs the backend-supported change-primary command instead of mutating org truth locally. */
async function submitChangeEmployment() {
  if (
    !activeTenantId.value ||
    !internalSelectedEmployeeId.value ||
    !currentActiveEmployment.value ||
    !canChangeEmployment.value
  ) {
    return
  }

  if (!changeForm.value.orgUnitId) {
    message.error('请选择目标部门')
    return
  }
  if (!changeForm.value.effectiveFrom.trim()) {
    message.error('请选择调岗生效时间')
    return
  }

  changeSaving.value = true
  try {
    await changeManagedPrimaryEmploymentApi(activeTenantId.value, internalSelectedEmployeeId.value, {
      effectiveFrom: normalizeDateTimeLocal(changeForm.value.effectiveFrom),
      endedReason: 'transfer',
      fromEmploymentId: currentActiveEmployment.value.id,
      positionName: changeForm.value.positionName.trim() || undefined,
      toOrgUnitId: changeForm.value.orgUnitId
    })
    changeOpen.value = false
    message.success('调岗已提交')
    await refreshEmployeeGrid()
    if (detailDrawerOpen.value) {
      await loadEmployeeDetail(internalSelectedEmployeeId.value)
    }
  } catch (error) {
    message.error(resolveErrorMessage(error, '调岗失败'))
  } finally {
    changeSaving.value = false
  }
}

/** confirmEndEmployment ends the current active employment only through the backend command that already exists. */
function confirmEndEmployment() {
  if (
    !activeTenantId.value ||
    !internalSelectedEmployeeId.value ||
    !currentActiveEmployment.value ||
    !canEndEmployment.value
  ) {
    return
  }

  const activeEmployment = currentActiveEmployment.value
  Modal.confirm({
    title: '离岗',
    content: '此操作会结束当前 active employment，并在没有其他 active employment 时将员工置为离职。',
    okText: '确认离岗',
    cancelText: '取消',
    zIndex: drawerChildModalZIndex,
    onOk: async () => {
      try {
        await endManagedEmploymentApi(activeTenantId.value, internalSelectedEmployeeId.value, activeEmployment.id, {
          effectiveTo: new Date().toISOString(),
          endedReason: 'manual_end'
        })
        message.success('离岗已提交')
        await refreshEmployeeGrid()
        if (detailDrawerOpen.value) {
          await loadEmployeeDetail(internalSelectedEmployeeId.value)
        }
      } catch (error) {
        message.error(resolveErrorMessage(error, '离岗失败'))
      }
    }
  })
}

/** openEmployeeAccessModal prepares either the enable-login flow or the continue-pending flow in member context. */
function openEmployeeAccessModal(mode: 'CONTINUE' | 'ENABLE') {
  if (!canProvisionLogin.value) {
    return
  }

  accessMode.value = mode
  accessForm.value = {
    loginEmail: '',
    loginPhone: '',
    selectedRoleId: accountAccess.value?.roles[0]?.id ?? sortedRoleOptions.value[0]?.id ?? ''
  }
  accessOpen.value = true
}

/** submitEmployeeAccess triggers the bounded HR-owned access onboarding command for the selected member. */
async function submitEmployeeAccess() {
  if (
    !activeTenantId.value ||
    !internalSelectedEmployeeId.value ||
    !currentActiveEmployment.value ||
    !canProvisionLogin.value
  ) {
    return
  }

  if (!accessForm.value.selectedRoleId) {
    message.error('请选择一个访问角色')
    return
  }

  const existingAccountId = accountAccess.value?.account?.accountId
  if (!existingAccountId && !accessForm.value.loginEmail.trim() && !accessForm.value.loginPhone.trim()) {
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
            roleIds: [accessForm.value.selectedRoleId]
          }
        : {
            employmentId: currentActiveEmployment.value.id,
            reason: accessMode.value === 'CONTINUE' ? 'member_access_continue' : 'member_access_enable',
            roleIds: [accessForm.value.selectedRoleId],
            createAccount: {
              displayName:
                detail.value?.employee.displayName ||
                detail.value?.employee.employeeCode ||
                internalSelectedEmployeeId.value,
              email: accessForm.value.loginEmail.trim() || undefined,
              phone: accessForm.value.loginPhone.trim() || undefined
            }
          }
    )
    accessOpen.value = false
    message.success(result.status === 'PENDING' ? '登录接入仍待继续完成' : '成员登录接入已提交')
    await loadEmployeeAccountAccess(internalSelectedEmployeeId.value)
    await refreshEmployeeGrid()
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

function buildEmployeeGridRow(item: HrManagementApi.EmployeeDirectoryItem): EmployeeGridRow {
  return {
    activeEmploymentId: item.activeEmployment?.id,
    employeeCode: item.employee.employeeCode,
    id: item.employee.id,
    joinedAt: formatDate(item.activeEmployment?.effectiveFrom),
    lifecycleStatus: item.employee.lifecycleStatus,
    name: formatEmployeeName(item.employee),
    positionName: item.activeEmployment?.positionName?.trim() || '未提供',
    primaryDepartment: formatOrgName(item.activeEmployment?.orgUnitId)
  }
}

/** buildDepartmentTreeOptions preserves tenant-org hierarchy for employee filters and placement selectors. */
function buildDepartmentTreeOptions(options: { disableRoot?: boolean } = {}) {
  const nodeMap = new Map<string, DepartmentTreeOption>()
  const roots: DepartmentTreeOption[] = []

  for (const orgUnit of orgOptions.value) {
    nodeMap.set(orgUnit.id, {
      children: [],
      disabled: options.disableRoot && orgUnit.type === 'ROOT',
      key: orgUnit.id,
      title: orgUnit.name,
      value: orgUnit.id
    })
  }

  for (const orgUnit of orgOptions.value) {
    const node = nodeMap.get(orgUnit.id)
    if (!node) {
      continue
    }

    const parent = orgUnit.parentOrgId ? nodeMap.get(orgUnit.parentOrgId) : undefined
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

/** searchEmployeeDirectory applies the compact toolbar filters from the Stitch employee list. */
async function searchEmployeeDirectory() {
  await queryEmployeeGrid(employeeFilters)
}

/** resetEmployeeDirectoryFilters returns the toolbar to the broad employee directory view. */
async function resetEmployeeDirectoryFilters() {
  employeeFilters.keyword = ''
  employeeFilters.lifecycleStatus = 'ALL'
  employeeFilters.orgUnitIds = []
  await queryEmployeeGrid(employeeFilters)
}

/** refreshEmployeeGrid re-queries the Ant Design employee table after HR mutations. */
async function refreshEmployeeGrid() {
  await queryEmployeeGrid(employeeFilters)
}

function formatEmployeeName(employee: HrManagementApi.EmployeeSummary) {
  return employee.displayName?.trim() || employee.employeeCode
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

/** formatEmploymentDepartmentName displays only org-unit truth for department fields. */
function formatEmploymentDepartmentName(employment?: HrManagementApi.EmploymentSummary) {
  const orgUnit = resolveEmploymentOrgUnit(employment)
  return orgUnit?.name || formatOrgName(employment?.orgUnitId)
}

/** formatEmploymentPositionName displays only employment-owned position truth. */
function formatEmploymentPositionName(employment?: HrManagementApi.EmploymentSummary) {
  return employment?.positionName?.trim() || '未提供'
}

function formatEmploymentOrgTitle(employment?: HrManagementApi.EmploymentSummary) {
  const orgName = formatEmploymentDepartmentName(employment)
  return [orgName, employment?.positionName].filter(Boolean).join(' / ')
}

function formatEmploymentOrgSummary(employment?: HrManagementApi.EmploymentSummary) {
  const orgUnit = resolveEmploymentOrgUnit(employment)
  if (!orgUnit) {
    return ''
  }

  const organizationTenantPartyName = formatManagedOrganizationTenantPartyName(orgUnit)
  return [orgUnit.type, organizationTenantPartyName].filter(Boolean).join(' · ')
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
  return [formatEmploymentOrgTitle(employment), timeRange, employment.endedReason].filter(Boolean).join(' · ')
}

function formatDate(value?: string) {
  if (!value) {
    return '未提供'
  }

  return value.slice(0, 10)
}

function matchesEmployeeFilters(
  item: HrManagementApi.EmployeeDirectoryItem,
  state: EmployeeFilterFormState
) {
  const keyword = (state.keyword ?? '').trim().toLowerCase()
  const searchCorpus = [
    item.employee.displayName,
    item.employee.employeeCode,
    formatEmploymentOrgTitle(item.activeEmployment)
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (keyword && !searchCorpus.includes(keyword)) {
    return false
  }

  const selectedOrgUnitIds = state.orgUnitIds ?? []
  if (selectedOrgUnitIds.length > 0) {
    const orgPath = resolveEmploymentOrgUnit(item.activeEmployment)?.path
    const pathIds = orgPath?.split('/').filter(Boolean) ?? []
    if (!selectedOrgUnitIds.some((orgUnitId) => pathIds.includes(orgUnitId))) {
      return false
    }
  }

  if (state.lifecycleStatus && state.lifecycleStatus !== 'ALL' && item.employee.lifecycleStatus !== state.lifecycleStatus) {
    return false
  }

  return true
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

/** formatDateTimeLocalInputValue seeds datetime-local controls with the API's minute precision. */
function formatDateTimeLocalInputValue(value: Date) {
  return value.toISOString().slice(0, 16)
}

/** normalizeDateInput converts date-only HR form values to the backend timestamp contract. */
function normalizeDateInput(value: string) {
  const normalized = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized}T00:00:00.000Z`
  }

  return normalizeDateTimeLocal(normalized)
}

/** normalizePartyIdentifier removes spacing noise before passing identifiers to party-service matching. */
function normalizePartyIdentifier(value: string) {
  return value.trim().replaceAll(/\s+/g, '').toUpperCase()
}

/** isExistingUserSearchKeyword allows email or phone-like input without exposing a general user list. */
function isExistingUserSearchKeyword(keyword: string) {
  return (
    isCompleteEmailSearchKeyword(keyword) ||
    buildPhoneSearchCandidates(keyword, createForm.value.identityIssuerCountry).length > 0
  )
}

/** isCompleteEmailSearchKeyword keeps lookup from firing on intermediate input like "name@". */
function isCompleteEmailSearchKeyword(keyword: string) {
  return /^[^\s@]+@(?:[^\s@.]+\.)+[A-Za-z]{2,}$/.test(keyword)
}

/** buildPhoneSearchCandidates mirrors backend phone lookup thresholds before firing remote search. */
function buildPhoneSearchCandidates(keyword: string, countryOrRegion?: string) {
  const compact = keyword.trim().replace(/[\s().-]/g, '')
  const digits = compact.replace(/\D/g, '')
  if (!digits) return []

  const country = countryOrRegion?.trim().toUpperCase()
  if (compact.startsWith('+') || compact.startsWith('00')) {
    return digits.length >= 6 ? [digits] : []
  }
  if ((country === 'US' || country === 'CA') && (digits.length === 10 || digits.length === 11)) {
    return [digits]
  }
  if (country === 'CN' && digits.length === 11 && digits.startsWith('1')) {
    return [digits]
  }
  if (country === 'SG' && digits.length === 8) {
    return [digits]
  }
  return []
}

/** formatExistingUserCandidate builds the selector label without exposing full contact data. */
function formatExistingUserCandidate(candidate: HrManagementApi.EmployeeUserCandidate) {
  return [
    candidate.displayName || candidate.userId,
    candidate.maskedEmail,
    candidate.maskedPhone
  ].filter(Boolean).join(' · ')
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
      await selectEmployee(employeeId)
    }
  }
)

watch(activeTenantId, async (tenantId, previousTenantId) => {
  if (!tenantId || tenantId === previousTenantId) {
    return
  }

  syncSelectedEmployeeId('')
  detail.value = null
  accountAccess.value = null
  detailDrawerOpen.value = false
  await Promise.all([loadOrgOptions(), loadRoleOptions()])
  await refreshEmployeeGrid()
})

onMounted(async () => {
  try {
    await Promise.all([loadOrgOptions(), loadRoleOptions()])
    await refreshEmployeeGrid()
  } catch (error) {
    message.error(resolveErrorMessage(error, '员工与任职入口初始化失败'))
  }
})

onBeforeUnmount(() => {
  stopEmployeeColumnResize()
})
</script>

<template>
  <div class="employee-management-workspace">
    <Card :bordered="false" class="employee-management__table-card" data-testid="employee-grid-panel">
      <div class="employee-management__list-head">
        <div>
          <h2>员工管理</h2>
          <p>{{ activeTenantName || '当前租户' }}</p>
        </div>
        <Button
          v-access:code="'hr.employee.create'"
          v-if="canCreateEmployee"
          class="employee-management__create-button"
          data-testid="employee-create-open"
          type="primary"
          @click="openCreateModal"
        >
          + 新增员工
        </Button>
      </div>

      <div class="employee-management__toolbar">
        <TreeSelect
          v-model:value="employeeFilters.orgUnitIds"
          allow-clear
          class="employee-management__filter-select employee-management__department-filter"
          :dropdown-match-select-width="departmentDropdownWidth"
          :dropdown-style="departmentDropdownStyle"
          max-tag-count="responsive"
          placeholder="部门"
          show-search
          tree-checkable
          tree-default-expand-all
          tree-node-filter-prop="title"
          :tree-data="departmentTreeOptions"
          @change="searchEmployeeDirectory"
        />
        <Select
          v-model:value="employeeFilters.lifecycleStatus"
          class="employee-management__filter-select"
          :options="[
            { label: '状态', value: 'ALL' },
            { label: '在职', value: 'ACTIVE' },
            { label: '待入职', value: 'PREBOARDING' },
            { label: '已离职', value: 'OFFBOARDED' },
          ]"
          @change="searchEmployeeDirectory"
        />
        <Divider type="vertical" />
        <Input.Search
          v-model:value="employeeFilters.keyword"
          allow-clear
          class="employee-management__search"
          placeholder="搜索姓名、工号、部门"
          @search="searchEmployeeDirectory"
        />
        <Button type="link" @click="resetEmployeeDirectoryFilters">高级筛选</Button>
      </div>

      <Table
        :columns="employeeColumns"
        :data-source="employeeRows"
        :loading="employeeLoading"
        :pagination="{ pageSize: 20, showSizeChanger: false, total: employeeTotal }"
        :row-key="(record: EmployeeGridRow) => record.id"
        :scroll="{ x: employeeTableScrollX }"
        class="employee-management__employee-table"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="employee-management__employee-cell">
              <div class="employee-management__avatar">{{ record.name.slice(0, 1).toUpperCase() }}</div>
              <div>
                <div class="employee-management__employee-name">{{ record.name }}</div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'lifecycleStatus'">
            <Tag :color="record.lifecycleStatus === 'ACTIVE' ? 'green' : record.lifecycleStatus === 'PREBOARDING' ? 'blue' : 'red'">
              {{ formatLifecycleStatus(record.lifecycleStatus) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'operation'">
            <Dropdown
              v-if="getVisibleTableActionItems(getEmployeeActionItems(record)).length > 0"
              :trigger="['click']"
            >
              <Button aria-label="员工操作" shape="circle" size="small" type="text">
                <IconifyIcon icon="ant-design:more-outlined" />
              </Button>
              <template #overlay>
                <Menu @click="(info) => handleEmployeeAction(String(info.key) as EmployeeActionKey, record)">
                  <Menu.Item
                    v-for="item in getVisibleTableActionItems(getEmployeeActionItems(record))"
                    :key="item.key"
                    :danger="item.danger"
                    :data-testid="item.testId"
                    :disabled="item.disabled"
                  >
                    {{ item.label }}
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
            <span v-else class="tenant-table-action-empty">无可用操作</span>
          </template>
        </template>
        <template #emptyText>
          <Empty description="暂无员工数据" />
        </template>
      </Table>
    </Card>

    <Drawer
      v-model:open="detailDrawerOpen"
      :width="720"
      data-testid="employee-detail-drawer"
      destroy-on-close
      placement="right"
      title="员工详情"
    >
      <div data-testid="employee-detail-drawer">
        <div v-if="!detail" class="employee-management__empty-shell">
          <Empty description="选择成员后查看详情" />
        </div>
        <div v-else class="employee-management__drawer-shell" v-loading="detailLoading">
          <div class="employee-management__drawer-head">
            <div>
              <div class="employee-management__drawer-title">
                {{ formatEmployeeName(detail.employee) }}
              </div>
              <div class="employee-management__drawer-subtitle">
                {{ detail.employee.employeeCode }} · {{ activeTenantName || detail.employee.tenantId }}
              </div>
            </div>
            <Space wrap>
              <Button
                v-access:code="'identity.account.create'"
                v-if="accountAccess?.status === 'PENDING' && canProvisionLogin && currentActiveEmployment"
                data-testid="employee-continue-access-open"
                @click="openEmployeeAccessModal('CONTINUE')"
              >
                继续完成接入
              </Button>
              <Button
                v-access:code="'identity.account.create'"
                v-else-if="accountAccess?.status !== 'ACTIVE' && canProvisionLogin && currentActiveEmployment"
                @click="openEmployeeAccessModal('ENABLE')"
              >
                开通登录
              </Button>
            </Space>
          </div>

          <Tabs v-model:active-key="detailDrawerTab">
            <Tabs.TabPane key="overview" tab="概览">
              <div class="employee-management__section-stack">
                <Descriptions :column="1" bordered size="small">
                  <Descriptions.Item label="姓名">
                    {{ formatEmployeeName(detail.employee) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="员工编码">
                    {{ detail.employee.employeeCode }}
                  </Descriptions.Item>
                  <Descriptions.Item label="主部门">
                    {{ formatEmploymentDepartmentName(currentActiveEmployment) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="职位">
                    {{ formatEmploymentPositionName(currentActiveEmployment) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="生命周期">
                    <Tag color="blue">
                      {{ formatLifecycleStatus(detail.employee.lifecycleStatus) }}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="当前任职摘要">
                    {{ formatEmploymentOrgSummary(currentActiveEmployment) || '未提供' }}
                  </Descriptions.Item>
                </Descriptions>

                <section class="employee-management__code-qr-card">
                  <div
                    class="employee-management__code-qr"
                    data-testid="employee-management-code-qr"
                    :data-value="employeeCodeQrValue"
                  >
                    <QRCode :value="employeeCodeQrValue" />
                  </div>
                  <div class="employee-management__code-copy">
                    <span>员工码二维码</span>
                    <strong>{{ detail.employee.employeeCode }}</strong>
                    <p>PDA 扫码后只带入员工码，PIN 由员工本人在终端弹窗输入。</p>
                  </div>
                </section>
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane key="employment" tab="任职">
              <div class="employee-management__section-stack">
                <Descriptions :column="1" bordered size="small" title="当前任职">
                  <Descriptions.Item label="所属部门">
                    {{ formatEmploymentDepartmentName(currentActiveEmployment) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="职位">
                    {{ formatEmploymentPositionName(currentActiveEmployment) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="任职状态">
                    {{ formatEmploymentStatus(currentActiveEmployment?.status) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="生效时间">
                    {{ currentActiveEmployment?.effectiveFrom || '未建立任职' }}
                  </Descriptions.Item>
                </Descriptions>

                <div>
                  <div class="employee-management__section-title">任职记录</div>
                  <ul class="employee-management__timeline-list">
                    <li
                      v-for="employment in employmentHistory"
                      :key="employment.id"
                    >
                      {{ formatEmploymentTimeline(employment) }}
                    </li>
                  </ul>
                </div>
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane key="access" tab="账号与访问">
              <div class="employee-management__section-stack" v-loading="accessLoading">
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
                  <Descriptions.Item label="待处理原因">
                    {{ accountAccess?.failureReason || '无' }}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane key="profile" tab="档案">
              <Descriptions :column="1" bordered size="small">
                <Descriptions.Item label="Employee ID">
                  {{ detail.employee.id }}
                </Descriptions.Item>
                <Descriptions.Item label="TenantPartyId">
                  {{ detail.employee.tenantPartyId }}
                </Descriptions.Item>
                <Descriptions.Item label="PartyId">
                  {{ detail.employee.tenantPartyId || '未关联' }}
                </Descriptions.Item>
                <Descriptions.Item label="Tenant">
                  {{ detail.employee.tenantId }}
                </Descriptions.Item>
              </Descriptions>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </Drawer>

    <Modal
      v-if="createOpen"
      v-model:open="createOpen"
      :confirm-loading="createSaving"
      :get-container="false"
      title="创建员工"
      @ok="submitCreateFlow"
    >
      <Form class="employee-management__form-grid" layout="vertical">
        <div class="employee-management__form-note">
          员工编号由系统生成；人员 Party 会按证件标识匹配，未命中时自动创建。
        </div>
        <Form.Item label="员工码">
          <Input
            :value="createForm.employeeCodePreview"
            data-testid="employee-code-preview-input"
            disabled
          />
        </Form.Item>
        <Form.Item label="姓名" required>
          <Input
            v-model:value="createForm.displayName"
            data-testid="employee-display-name-input"
            placeholder="例如 林予安"
          />
        </Form.Item>
        <Form.Item label="性别">
          <Select
            v-model:value="createForm.gender"
            data-testid="employee-gender-select"
            :options="[
              { label: '未提供', value: '' },
              { label: '女', value: 'FEMALE' },
              { label: '男', value: 'MALE' },
              { label: '其他', value: 'OTHER' },
            ]"
            placeholder="选择性别"
          />
        </Form.Item>
        <Form.Item label="证件类型" required>
          <Select
            v-model:value="createForm.identityDocumentType"
            data-testid="employee-identity-type-select"
            :options="[
              { label: '居民身份证', value: 'NATIONAL_ID' },
              { label: '护照', value: 'PASSPORT' },
              { label: '港澳台通行证', value: 'TRAVEL_DOCUMENT' },
              { label: '其他证件', value: 'OTHER_PERSON_ID' },
            ]"
          />
        </Form.Item>
        <Form.Item label="证件号码" required>
          <Input
            v-model:value="createForm.identityDocumentNumber"
            data-testid="employee-identity-number-input"
            placeholder="用于匹配或创建人员 Party"
          />
        </Form.Item>
        <Form.Item label="主任职部门" required>
          <TreeSelect
            v-model:value="createForm.orgUnitId"
            data-testid="employee-org-select"
            placeholder="选择主任职部门"
            show-search
            tree-default-expand-all
            tree-node-filter-prop="title"
            :tree-data="placementTreeOptions"
          />
        </Form.Item>
        <Form.Item label="主任职职务" required>
          <Input
            v-model:value="createForm.primaryPositionName"
            data-testid="employee-primary-position-input"
            placeholder="例如 生产主管"
          />
        </Form.Item>
        <Form.Item label="入职日期" required>
          <Input
            v-model:value="createForm.joinedOn"
            data-testid="employee-joined-on-input"
            type="date"
          />
        </Form.Item>
        <Form.Item class="employee-management__checkbox-row">
          <Checkbox
            v-model:checked="createForm.allowLogin"
            data-testid="employee-allow-login-toggle"
          >
            同时创建登录账号
          </Checkbox>
        </Form.Item>
        <template v-if="createForm.allowLogin">
          <Form.Item label="账号方式">
            <Radio.Group v-model:value="createForm.accountMode">
              <Radio.Button value="NEW_USER">创建新用户</Radio.Button>
              <Radio.Button value="EXISTING_USER">绑定已有用户</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <template v-if="createForm.accountMode === 'NEW_USER'">
            <Form.Item label="邮箱">
              <Input
                v-model:value="createForm.loginEmail"
                data-testid="employee-login-email-input"
                placeholder="user@example.com"
                type="email"
              />
            </Form.Item>
            <Form.Item label="手机号">
              <PhoneNumberInput
                v-model="createForm.loginPhone"
                data-testid="employee-login-phone-input"
              />
            </Form.Item>
          </template>
          <Form.Item v-else label="已有用户" required>
            <Select
              v-model:value="createForm.existingUserId"
              data-testid="employee-existing-user-select"
              show-search
              :filter-option="false"
              :loading="existingUserSearchLoading"
              :options="existingUserOptions"
              placeholder="输入完整邮箱或手机号搜索"
              @change="handleExistingEmployeeUserChange"
              @search="searchExistingEmployeeUsers"
            />
          </Form.Item>
        </template>
      </Form>
      <template #footer>
        <Space>
          <Button @click="createOpen = false">取消</Button>
          <Button
            data-testid="employee-create-submit"
            type="primary"
            :loading="createSaving"
            @click="submitCreateFlow"
          >
            创建
          </Button>
        </Space>
      </template>
    </Modal>

    <Modal
      v-if="changeOpen"
      v-model:open="changeOpen"
      :confirm-loading="changeSaving"
      :z-index="drawerChildModalZIndex"
      title="调岗"
      @ok="submitChangeEmployment"
    >
      <Form class="employee-management__form-grid" layout="vertical">
        <Form.Item label="目标部门">
          <Select
            v-model:value="changeForm.orgUnitId"
            data-testid="change-employment-org-select"
            :options="orgSelectOptions"
            placeholder="选择目标部门"
          />
        </Form.Item>
        <Form.Item label="目标职位">
          <Input
            v-model:value="changeForm.positionName"
            data-testid="change-employment-position-input"
            placeholder="例如 生产经理"
          />
        </Form.Item>
        <Form.Item label="生效时间">
          <Input
            v-model:value="changeForm.effectiveFrom"
            data-testid="change-employment-effective-from-input"
            type="datetime-local"
          />
        </Form.Item>
      </Form>
      <template #footer>
        <Space>
          <Button @click="changeOpen = false">取消</Button>
          <Button
            data-testid="change-employment-submit"
            type="primary"
            :loading="changeSaving"
            @click="submitChangeEmployment"
          >
            提交调岗
          </Button>
        </Space>
      </template>
    </Modal>

    <Modal
      v-if="accessOpen"
      v-model:open="accessOpen"
      :confirm-loading="accessSaving"
      :z-index="drawerChildModalZIndex"
      :title="accessMode === 'CONTINUE' ? '继续完成登录接入' : '开通成员登录'"
      @ok="submitEmployeeAccess"
    >
      <Form class="employee-management__form-grid" layout="vertical">
        <Form.Item label="访问角色">
          <Select
            v-model:value="accessForm.selectedRoleId"
            data-testid="employee-login-role-select"
            :options="roleSelectOptions"
            placeholder="选择访问角色"
          />
        </Form.Item>
        <template v-if="shouldCollectAccessContacts">
          <Form.Item label="邮箱">
            <Input
              v-model:value="accessForm.loginEmail"
              data-testid="employee-login-email-input"
              placeholder="user@example.com"
              type="email"
            />
          </Form.Item>
          <Form.Item label="手机号">
            <Input
              v-model:value="accessForm.loginPhone"
              data-testid="employee-login-phone-input"
              placeholder="+86 13800000000"
            />
          </Form.Item>
        </template>
      </Form>
      <template #footer>
        <Space>
          <Button @click="accessOpen = false">取消</Button>
          <Button
            data-testid="employee-access-submit"
            type="primary"
            :loading="accessSaving"
            @click="submitEmployeeAccess"
          >
            {{ accessMode === 'CONTINUE' ? '继续完成' : '提交开通' }}
          </Button>
        </Space>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.employee-management-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.employee-management__table-card {
  border: 1px solid #eef1f5;
  border-radius: 8px;
  box-shadow: 0 10px 28px rgb(15 23 42 / 4%);
}

.employee-management__list-head {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 18px;
}

.employee-management__list-head h2 {
  color: #1f2937;
  font-size: 22px;
  font-weight: 650;
  line-height: 1.3;
  margin: 0;
}

.employee-management__list-head p {
  color: #667085;
  font-size: 13px;
  margin: 4px 0 0;
}

.employee-management__create-button {
  flex: 0 0 auto;
  min-width: 128px;
}

.employee-management__toolbar {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  margin-bottom: 16px;
  max-width: 760px;
}

.employee-management__filter-select {
  flex: 0 0 132px;
  width: 132px;
}

.employee-management__department-filter {
  flex-basis: 180px;
  width: 180px;
}

.employee-management__search {
  flex: 0 1 280px;
  width: 280px;
}

:deep(.employee-management__employee-table .ant-table-cell) {
  white-space: nowrap;
}

:deep(.employee-management__employee-table .ant-table-thead > tr > th) {
  position: relative;
  user-select: none;
}

.employee-management__resizable-title {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 24px;
  padding-right: 12px;
}

.employee-management__resizable-title-text {
  min-width: 0;
}

.employee-management__column-resizer {
  position: absolute;
  top: -12px;
  right: -10px;
  bottom: -12px;
  z-index: 2;
  width: 14px;
  cursor: col-resize;
}

.employee-management__column-resizer::after {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 6px;
  width: 1px;
  content: '';
  background: rgb(15 23 42 / 14%);
  transition: background 0.16s ease;
}

.employee-management__column-resizer:hover::after {
  background: hsl(var(--primary));
}

.employee-management__employee-cell {
  align-items: center;
  display: flex;
  gap: 10px;
  min-width: 0;
}

.employee-management__avatar {
  align-items: center;
  background: #f1f5f9;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  color: #475569;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 13px;
  font-weight: 650;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.employee-management__employee-name {
  color: #111827;
  font-weight: 600;
  line-height: 1.35;
}

.employee-management__tenant-caption,
.employee-management__drawer-subtitle,
.employee-management__section-title {
  color: #64748b;
}

.employee-management__drawer-shell,
.employee-management__section-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.employee-management__drawer-head {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.employee-management__drawer-title {
  font-size: 18px;
  font-weight: 700;
}

.employee-management__code-qr-card {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  gap: 16px;
  padding: 14px;
}

.employee-management__code-qr {
  background: #fff;
  border: 1px solid #eef1f5;
  border-radius: 8px;
  flex: 0 0 auto;
  padding: 8px;
}

.employee-management__code-copy {
  min-width: 0;
}

.employee-management__code-copy span {
  color: #64748b;
  display: block;
  font-size: 12px;
  line-height: 18px;
}

.employee-management__code-copy strong {
  color: #111827;
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  overflow-wrap: anywhere;
}

.employee-management__code-copy p {
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
  margin: 6px 0 0;
}

.employee-management__timeline-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0 0;
  padding-left: 20px;
}

.employee-management__form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.employee-management__form-note {
  grid-column: 1 / -1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  color: #4b5563;
  font-size: 13px;
  line-height: 20px;
  padding: 10px 12px;
}

.employee-management__form-grid :deep(.ant-form-item) {
  margin-bottom: 0;
}

.employee-management__checkbox-row {
  align-self: end;
}

.employee-management__empty-shell {
  padding: 24px 0;
}

:global(body.employee-management--resizing-column) {
  cursor: col-resize;
  user-select: none;
}

@media (max-width: 640px) {
  .employee-management__drawer-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .employee-management__list-head {
    align-items: stretch;
    flex-direction: column;
  }

  .employee-management__filter-select,
  .employee-management__search {
    flex: 1 1 100%;
    min-width: 100%;
    width: 100%;
  }
}
</style>
