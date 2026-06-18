<script setup lang="ts">
import type { TenantManagementApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { IconifyIcon } from '@vben/icons'

import {
  Button,
  Card,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Menu,
  message,
  Modal,
  Select,
  Space,
  Tabs,
  Table,
  Tag,
  TreeSelect
} from 'ant-design-vue'

import {
  archiveManagedOrgUnitApi,
  createManagedOrgUnitApi,
  getManagedOrgTreeApi,
  getManagedOrgUnitByIdApi,
  listManagedTenantsApi,
  moveManagedOrgUnitApi,
  updateManagedOrgUnitApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

import {
  flattenManagedOrgTree,
  mapManagedOrgTreeToGridRows
} from './org-read-side'

interface OrgFormState {
  name: string
  sortOrder: string
  type: string
}

interface OrgTreeSelectOption {
  children: OrgTreeSelectOption[]
  key: string
  title: string
  value: string
}

type ManagementMode = 'SYSTEM' | 'TENANT'
type OrgActionKey = 'append' | 'edit' | 'view'
type OrgColumnKey = 'name' | 'operation' | 'status' | 'type'

interface TableActionMenuItem<ActionKey extends string> {
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  key: ActionKey
  label: string
  testId?: string
}
type OrgUnitType = 'BRANCH' | 'DEPARTMENT' | 'ROOT' | 'TEAM'

interface Props {
  managementMode: ManagementMode
  selectedOrgUnitId?: string
}

type OrgGridRow = ReturnType<typeof flattenManagedOrgTree>[number] & {
  children?: OrgGridRow[]
}

interface OrgDetailRow {
  label: string
  value: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedOrgUnitId: ''
})

const emit = defineEmits<{
  (event: 'update:selectedOrgUnitId', value: string): void
}>()

const authContextStore = useAuthContextStore()
const operationColumnTitle = '操作'
const router = useRouter()
const orgColumnWidths = reactive<Record<OrgColumnKey, number>>({
  name: 360,
  operation: 140,
  status: 180,
  type: 180
})
const orgColumnMinWidths: Record<OrgColumnKey, number> = {
  name: 240,
  operation: 96,
  status: 120,
  type: 120
}
const tenantOptions = ref<TenantManagementApi.TenantSummary[]>([])
const activeTenantId = ref('')
const activeTenantName = ref('')
const treeRows = ref<ReturnType<typeof flattenManagedOrgTree>>([])
const orgTreeData = ref<OrgGridRow[]>([])
const orgTreeLoading = ref(false)
const expandedOrgUnitIds = ref<string[]>([])
const internalSelectedOrgUnitId = ref('')
const selectedOrgUnit = ref<null | TenantManagementApi.ManagedOrgUnit>(null)
const detailLoading = ref(false)
const detailDrawerOpen = ref(false)
const detailDrawerTab = ref('overview')
const editDrawerOpen = ref(false)
const editDrawerSaving = ref(false)
const createDrawerOpen = ref(false)
const createDrawerSaving = ref(false)
const createDrawerParentName = ref('')
const createParentOrgUnitId = ref('')
const editParentOrgUnitId = ref('')
const form = reactive<OrgFormState>({
  name: '',
  sortOrder: '0',
  type: 'DEPARTMENT'
})
const orgTypeLabels: Record<Exclude<OrgUnitType, 'ROOT'>, string> = {
  BRANCH: '分支',
  DEPARTMENT: '部门',
  TEAM: '小组'
}

const isSystemEntry = computed(
  () => props.managementMode === 'SYSTEM' && authContextStore.isPlatformScope
)
const canReadTree = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.org_unit.list_tree')
)
const canReadDetail = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.org_unit.get_by_id')
)
const canCreate = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.org_unit.create')
)
const canUpdate = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.org_unit.update')
)
const canArchive = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.org_unit.archive')
)
const selectedOrgChildren = computed(() =>
  treeRows.value.filter((node) => node.parentOrgId === selectedOrgUnit.value?.id)
)
const orgDetailColumns: TableColumnsType<OrgDetailRow> = [
  { dataIndex: 'label', key: 'label', title: '字段', width: 140 },
  { dataIndex: 'value', key: 'value', title: '内容' }
]
const orgOverviewRows = computed<OrgDetailRow[]>(() => {
  if (!selectedOrgUnit.value) {
    return []
  }

  return [
    { label: '名称', value: selectedOrgUnit.value.name },
    { label: '类型', value: selectedOrgUnit.value.type },
    {
      label: '状态',
      value: selectedOrgUnit.value.status === 'ARCHIVED' ? '已停用' : '启用中'
    },
    { label: '父节点', value: selectedOrgUnit.value.parentOrgId || 'ROOT' },
    { label: '负责人', value: 'Backend gap：当前读模型尚未提供组织负责人名字' }
  ]
})
const orgTechnicalRows = computed<OrgDetailRow[]>(() => {
  if (!selectedOrgUnit.value) {
    return []
  }

  return [
    { label: '节点 ID', value: selectedOrgUnit.value.id },
    { label: '层级深度', value: `${selectedOrgUnit.value.depth}` },
    { label: '排序', value: `${selectedOrgUnit.value.sortOrder}` },
    { label: '组织路径', value: selectedOrgUnit.value.path }
  ]
})
const drawerTitle = computed(() => '组织详情')
const editDrawerTitle = computed(() => '编辑 OrgUnit')
const createDrawerTitle = computed(() => '新建 OrgUnit')
const canEditSelectedOrgUnit = computed(
  () => Boolean(selectedOrgUnit.value) && canUpdate.value && !isRootOrgUnit(selectedOrgUnit.value)
)
const detailDrawerSubtitle = computed(() =>
  isSystemEntry.value ? activeTenantName.value || selectedOrgUnit.value?.tenantId || '' : ''
)
const editDrawerSubtitle = computed(() =>
  isSystemEntry.value ? activeTenantName.value || selectedOrgUnit.value?.tenantId || '' : ''
)
const createDrawerSubtitle = computed(() =>
  isSystemEntry.value ? activeTenantName.value || createParentOrgUnitId.value || '' : ''
)
const createParentTreeOptions = computed(() => buildCreateParentTreeOptions())
const editParentTreeOptions = computed(() => buildEditParentTreeOptions())
const createOrgTypeOptions = computed(() =>
  resolveCreateChildTypeOptions(createParentOrgUnitId.value).map((type) => ({
    label: orgTypeLabels[type],
    value: type
  }))
)
const editOrgTypeOptions = computed(() => {
  if (selectedOrgUnit.value?.type === 'BRANCH') {
    return [{ label: orgTypeLabels.BRANCH, value: 'BRANCH' }]
  }

  return [
    { label: orgTypeLabels.DEPARTMENT, value: 'DEPARTMENT' },
    { label: orgTypeLabels.TEAM, value: 'TEAM' }
  ]
})
const orgTableScrollX = computed(() =>
  Object.values(orgColumnWidths).reduce((sum, width) => sum + width, 0)
)

let activeOrgColumnCleanup: null | (() => void) = null

// stopOrgColumnResize releases the global listeners used while dragging an org table header.
function stopOrgColumnResize() {
  activeOrgColumnCleanup?.()
  activeOrgColumnCleanup = null
  document.body.classList.remove('org-management--resizing-column')
}

// startOrgColumnResize wires one header drag handle to the organization table column width state.
function startOrgColumnResize(event: MouseEvent, columnKey: OrgColumnKey) {
  event.preventDefault()
  event.stopPropagation()

  stopOrgColumnResize()

  const startX = event.clientX
  const startWidth = orgColumnWidths[columnKey]

  const handleMouseMove = (moveEvent: MouseEvent) => {
    orgColumnWidths[columnKey] = Math.max(
      orgColumnMinWidths[columnKey],
      Math.round(startWidth + moveEvent.clientX - startX)
    )
  }

  const handleMouseUp = () => {
    stopOrgColumnResize()
  }

  document.body.classList.add('org-management--resizing-column')
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp, { once: true })
  activeOrgColumnCleanup = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}

// renderResizableOrgHeader exposes a compact resize handle for organization table columns.
function renderResizableOrgHeader(columnKey: OrgColumnKey, label: string) {
  return h('div', { class: 'org-management__resizable-title' }, [
    h('span', { class: 'org-management__resizable-title-text' }, label),
    h('span', {
      'aria-label': `调整${label}列宽`,
      class: 'org-management__column-resizer',
      onMousedown: (event: MouseEvent) => startOrgColumnResize(event, columnKey),
      role: 'separator'
    })
  ])
}

const orgTableColumns = computed<TableColumnsType<OrgGridRow>>(() => [
  {
    dataIndex: 'name',
    key: 'name',
    title: renderResizableOrgHeader('name', '组织名称'),
    width: orgColumnWidths.name
  },
  {
    align: 'center',
    dataIndex: 'type',
    key: 'type',
    title: renderResizableOrgHeader('type', '类型'),
    width: orgColumnWidths.type
  },
  {
    align: 'center',
    dataIndex: 'status',
    key: 'status',
    title: renderResizableOrgHeader('status', '状态'),
    width: orgColumnWidths.status
  },
  {
    key: 'operation',
    align: 'center',
    fixed: 'right',
    title: renderResizableOrgHeader('operation', operationColumnTitle),
    width: orgColumnWidths.operation
  }
])

/** getOrgActionItems exposes organization row operations for the native Ant Design dropdown. */
function getOrgActionItems(orgUnitRecord: Record<string, any>): TableActionMenuItem<OrgActionKey>[] {
  const orgUnit = orgUnitRecord as OrgGridRow

  return [
    {
      hidden: !canReadDetail.value,
      key: 'view',
      label: '查看',
      testId: `org-view-${orgUnit.id}`
    },
    {
      hidden: !canCreate.value || !canCreateChildOrgUnit(orgUnit),
      key: 'append',
      label: '新增下级',
      testId: `org-append-${orgUnit.id}`
    },
    {
      hidden: !canUpdate.value || isRootOrgUnit(orgUnit),
      key: 'edit',
      label: '编辑',
      testId: `org-edit-${orgUnit.id}`
    }
  ]
}

/** getVisibleTableActionItems filters hidden table actions before handing them to Ant Design Menu. */
function getVisibleTableActionItems<ActionKey extends string>(items: TableActionMenuItem<ActionKey>[]) {
  return items.filter((item) => !item.hidden)
}

/** isRootOrgUnit identifies immutable tenant root nodes that anchor the org tree. */
function isRootOrgUnit(orgUnit?: null | Partial<Pick<TenantManagementApi.ManagedOrgUnit, 'depth' | 'type'>>) {
  return orgUnit?.depth === 0 || orgUnit?.type === 'ROOT'
}

/** resolveCreateChildTypeOptions enforces the tenant org hierarchy for ordinary child creation. */
function resolveCreateChildTypeOptions(parentOrgUnitId: string): Array<Exclude<OrgUnitType, 'ROOT'>> {
  const parentOrgUnit = treeRows.value.find((row) => row.id === parentOrgUnitId)

  switch (parentOrgUnit?.type) {
    case 'ROOT': {
      return ['DEPARTMENT', 'TEAM']
    }
    case 'BRANCH': {
      return ['DEPARTMENT']
    }
    case 'DEPARTMENT': {
      return ['DEPARTMENT', 'TEAM']
    }
    case 'TEAM': {
      return ['TEAM']
    }
    default: {
      return []
    }
  }
}

/** canCreateChildOrgUnit hides unsupported append actions such as root child creation until the branch flow exists. */
function canCreateChildOrgUnit(parentOrgUnit?: null | { id?: string }) {
  return Boolean(parentOrgUnit?.id && resolveCreateChildTypeOptions(parentOrgUnit.id).length > 0)
}

/** buildCreateParentTreeOptions exposes the org tree as a single-select parent picker for ordinary org creation. */
function buildCreateParentTreeOptions() {
  const nodeMap = new Map<string, OrgTreeSelectOption>()
  const roots: OrgTreeSelectOption[] = []

  for (const orgUnit of treeRows.value) {
    if (!canCreateChildOrgUnit(orgUnit)) {
      continue
    }

    nodeMap.set(orgUnit.id, {
      children: [],
      key: orgUnit.id,
      title: orgUnit.name,
      value: orgUnit.id
    })
  }

  for (const orgUnit of treeRows.value) {
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

/** buildEditParentTreeOptions exposes valid non-cyclic move targets for the selected org node. */
function buildEditParentTreeOptions() {
  const selected = selectedOrgUnit.value
  if (!selected || isRootOrgUnit(selected)) {
    return []
  }

  const selectedPathPrefix = `${selected.path}/`
  const nodeMap = new Map<string, OrgTreeSelectOption>()
  const roots: OrgTreeSelectOption[] = []

  for (const orgUnit of treeRows.value) {
    if (
      orgUnit.id === selected.id ||
      orgUnit.path.startsWith(selectedPathPrefix) ||
      !resolveCreateChildTypeOptions(orgUnit.id).includes(form.type as Exclude<OrgUnitType, 'ROOT'>)
    ) {
      continue
    }

    nodeMap.set(orgUnit.id, {
      children: [],
      key: orgUnit.id,
      title: orgUnit.name,
      value: orgUnit.id
    })
  }

  for (const orgUnit of treeRows.value) {
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

/** syncCreateFormTypeWithParent keeps the type selector valid when a drawer parent changes. */
function syncCreateFormTypeWithParent() {
  const allowedTypes = resolveCreateChildTypeOptions(createParentOrgUnitId.value)
  if (!allowedTypes.includes(form.type as Exclude<OrgUnitType, 'ROOT'>)) {
    form.type = allowedTypes[0] ?? 'DEPARTMENT'
  }
  const parentOrgUnit = treeRows.value.find((row) => row.id === createParentOrgUnitId.value)
  createDrawerParentName.value = parentOrgUnit?.name || createParentOrgUnitId.value
}

/** syncSelectedOrgUnitId keeps the selected org node aligned with the owning page shell when one exists. */
function syncSelectedOrgUnitId(orgUnitId: string) {
  if (orgUnitId === internalSelectedOrgUnitId.value) {
    return
  }

  internalSelectedOrgUnitId.value = orgUnitId
  emit('update:selectedOrgUnitId', orgUnitId)
}

/** syncActiveTenant initializes the workspace with either the current tenant or the first selectable system tenant. */
function syncActiveTenant() {
  if (isSystemEntry.value) {
    const preferredTenantId =
      authContextStore.sessionContext?.tenant?.tenantId ||
      tenantOptions.value[0]?.id ||
      ''
    activeTenantId.value = preferredTenantId
    activeTenantName.value =
      tenantOptions.value.find((item) => item.id === preferredTenantId)?.name ||
      authContextStore.sessionContext?.tenant?.name ||
      ''
    return
  }

  activeTenantId.value = authContextStore.sessionContext?.tenant?.tenantId || ''
  activeTenantName.value =
    authContextStore.sessionContext?.tenant?.name || authContextStore.tenantName || ''
}

/** loadTenantOptions fetches the tenant selector choices used only by the system-admin org entry. */
async function loadTenantOptions() {
  if (!isSystemEntry.value) {
    return
  }

  const result = await listManagedTenantsApi({
    page: 1,
    pageSize: 50,
    status: 'ACTIVE'
  })
  tenantOptions.value = result.items ?? []
}

/** loadOrgUnitDetail refreshes the selected org node drawer data from the bounded org entry. */
async function loadOrgUnitDetail(orgUnitId: string) {
  if (!canReadDetail.value || !activeTenantId.value || !orgUnitId) {
    selectedOrgUnit.value = null
    return
  }

  detailLoading.value = true
  try {
    const result = await getManagedOrgUnitByIdApi(activeTenantId.value, orgUnitId)
    selectedOrgUnit.value = result.orgUnit
  } catch (error) {
    selectedOrgUnit.value = null
    message.error(resolveErrorMessage(error, '组织节点详情加载失败'))
  } finally {
    detailLoading.value = false
  }
}

/** resolvePreferredOrgUnitId keeps either the requested selection or the first visible org node stable across refreshes. */
function resolvePreferredOrgUnitId() {
  const requestedOrgUnitId = props.selectedOrgUnitId
  if (requestedOrgUnitId && treeRows.value.some((row) => row.id === requestedOrgUnitId)) {
    return requestedOrgUnitId
  }

  if (
    internalSelectedOrgUnitId.value &&
    treeRows.value.some((row) => row.id === internalSelectedOrgUnitId.value)
  ) {
    return internalSelectedOrgUnitId.value
  }

  return treeRows.value[0]?.id ?? ''
}

/** queryOrgGrid refreshes the tenant org tree for the dept-style management workbench. */
async function queryOrgGrid() {
  if (!canReadTree.value || !activeTenantId.value) {
    treeRows.value = []
    orgTreeData.value = []
    expandedOrgUnitIds.value = []
    syncSelectedOrgUnitId('')
    selectedOrgUnit.value = null
    detailDrawerOpen.value = false
    editDrawerOpen.value = false
    createDrawerOpen.value = false
    return
  }

  orgTreeLoading.value = true
  try {
    const result = await getManagedOrgTreeApi(activeTenantId.value)
    treeRows.value = flattenManagedOrgTree(result.roots ?? [])
    orgTreeData.value = mapManagedOrgTreeToGridRows(result.roots ?? []).map((row) => decorateGridRow(row))
    expandedOrgUnitIds.value = collectExpandableOrgUnitIds(orgTreeData.value)
    if (isSystemEntry.value && result.tenant?.name) {
      activeTenantName.value = result.tenant.name
    }

    const nextOrgUnitId = resolvePreferredOrgUnitId()
    syncSelectedOrgUnitId(nextOrgUnitId)
  } finally {
    orgTreeLoading.value = false
  }
}

/** decorateGridRow adds presentation-only fields without breaking the nested org tree structure. */
function decorateGridRow(row: ReturnType<typeof mapManagedOrgTreeToGridRows>[number]): OrgGridRow {
  const children = row.children?.map((child) => decorateGridRow(child)).filter(Boolean) ?? []
  const { children: _children, ...baseRow } = row
  const decoratedRow: OrgGridRow = {
    ...baseRow
  }

  if (children.length > 0) {
    decoratedRow.children = children
  }

  return decoratedRow
}

/** collectExpandableOrgUnitIds returns every org node that has children so tree tables load fully expanded. */
function collectExpandableOrgUnitIds(rows: OrgGridRow[]): string[] {
  const ids: string[] = []

  for (const row of rows) {
    if (row.children?.length) {
      ids.push(row.id)
      ids.push(...collectExpandableOrgUnitIds(row.children))
    }
  }

  return ids
}

/** resetOrgForm prepares the org create/edit fields for the drawer form area. */
function resetOrgForm(orgUnit?: null | TenantManagementApi.ManagedOrgUnit) {
  form.name = orgUnit?.name ?? ''
  form.sortOrder = String(orgUnit?.sortOrder ?? 0)
  form.type = orgUnit?.type === 'ROOT' ? 'DEPARTMENT' : (orgUnit?.type ?? 'DEPARTMENT')
  editParentOrgUnitId.value = orgUnit?.parentOrgId ?? ''
}

/** openDetailDrawer enters the read-first org drawer mode used by grid view actions. */
async function openDetailDrawer(orgUnitId: string) {
  createDrawerOpen.value = false
  editDrawerOpen.value = false
  syncSelectedOrgUnitId(orgUnitId)
  detailDrawerTab.value = 'overview'
  await loadOrgUnitDetail(orgUnitId)
  detailDrawerOpen.value = true
}

/** openOrgUnitDetail routes tenant org reads to the independent department detail page while preserving system mode drawers. */
async function openOrgUnitDetail(orgUnitId: string) {
  if (isSystemEntry.value) {
    await openDetailDrawer(orgUnitId)
    return
  }

  syncSelectedOrgUnitId(orgUnitId)
  await router.push({
    name: 'TenantOrgUnitDetail',
    params: {
      orgUnitId
    }
  })
}

/** openEditDrawer enters the dedicated edit drawer for non-root org nodes only. */
async function openEditDrawer(orgUnitId: string) {
  if (!canUpdate.value) {
    return
  }

  const gridRow = treeRows.value.find((row) => row.id === orgUnitId)
  if (gridRow && isRootOrgUnit(gridRow)) {
    return
  }

  detailDrawerOpen.value = false
  createDrawerOpen.value = false
  syncSelectedOrgUnitId(orgUnitId)
  await loadOrgUnitDetail(orgUnitId)
  if (!selectedOrgUnit.value || isRootOrgUnit(selectedOrgUnit.value)) {
    return
  }

  resetOrgForm(selectedOrgUnit.value)
  editDrawerOpen.value = true
}

/** handleOrgAction dispatches one dropdown menu action for an organization row. */
async function handleOrgAction(actionKey: OrgActionKey, orgUnitRecord: Record<string, any>) {
  const orgUnit = orgUnitRecord as OrgGridRow

  switch (actionKey) {
    case 'view': {
      await openOrgUnitDetail(orgUnit.id)
      return
    }
    case 'append': {
      await openCreateChildDrawer(orgUnit.id)
      return
    }
    case 'edit': {
      await openEditDrawer(orgUnit.id)
    }
  }
}

/** openCreateChildDrawer opens the dedicated create drawer under the given parent node. */
async function openCreateChildDrawer(parentOrgUnitId: string) {
  if (!canCreate.value) {
    return
  }

  const parentOrgUnit = treeRows.value.find((row) => row.id === parentOrgUnitId)
  const allowedTypes = resolveCreateChildTypeOptions(parentOrgUnitId)
  if (allowedTypes.length === 0) {
    message.warning('当前节点不能通过普通流程新建下级')
    return
  }

  createParentOrgUnitId.value = parentOrgUnitId
  createDrawerParentName.value = parentOrgUnit?.name || parentOrgUnitId
  detailDrawerOpen.value = false
  editDrawerOpen.value = false
  resetOrgForm(null)
  form.type = allowedTypes[0] ?? 'DEPARTMENT'
  createDrawerOpen.value = true
}

/** openOrdinaryCreateDrawer opens the shared org create drawer from the table toolbar with a selectable parent. */
function openOrdinaryCreateDrawer() {
  if (!canCreate.value) {
    return
  }

  const defaultParentOrgUnitId =
    createParentOrgUnitId.value && canCreateChildOrgUnit({ id: createParentOrgUnitId.value })
      ? createParentOrgUnitId.value
      : treeRows.value.find((row) => canCreateChildOrgUnit(row))?.id ?? ''

  if (!defaultParentOrgUnitId) {
    message.warning('当前租户还没有可挂载的组织父节点')
    return
  }

  detailDrawerOpen.value = false
  editDrawerOpen.value = false
  resetOrgForm(null)
  createParentOrgUnitId.value = defaultParentOrgUnitId
  syncCreateFormTypeWithParent()
  createDrawerOpen.value = true
}

/** handleCreateDropdownClick routes table-level create actions while leaving branch creation disabled for a later flow. */
function handleCreateDropdownClick({ key }: { key: number | string }) {
  if (key === 'ordinary') {
    openOrdinaryCreateDrawer()
  }
}

/** submitEditDrawerForm persists a non-root org edit through the dedicated edit drawer. */
async function submitEditDrawerForm() {
  if (
    !activeTenantId.value ||
    !internalSelectedOrgUnitId.value ||
    !canUpdate.value ||
    !selectedOrgUnit.value ||
    isRootOrgUnit(selectedOrgUnit.value)
  ) {
    return
  }

  editDrawerSaving.value = true
  try {
    if (!editParentOrgUnitId.value) {
      message.error('请选择挂载父节点')
      return
    }

    const selectedOrgUnitId = internalSelectedOrgUnitId.value
    const previousParentOrgUnitId = selectedOrgUnit.value.parentOrgId ?? ''
    const payload = {
      name: form.name.trim(),
      sortOrder: Number.parseInt(form.sortOrder || '0', 10) || 0,
      type: form.type
    }

    await updateManagedOrgUnitApi(activeTenantId.value, selectedOrgUnitId, payload)
    if (editParentOrgUnitId.value !== previousParentOrgUnitId) {
      await moveManagedOrgUnitApi(activeTenantId.value, selectedOrgUnitId, {
        newParentOrgId: editParentOrgUnitId.value
      })
    }
    message.success('组织节点已更新')

    editDrawerOpen.value = false
    await refreshOrgGrid()
    await loadOrgUnitDetail(selectedOrgUnitId)
  } catch (error) {
    message.error(resolveErrorMessage(error, '组织节点更新失败'))
  } finally {
    editDrawerSaving.value = false
  }
}

/** submitCreateDrawerForm persists one create request through the dedicated new-org drawer. */
async function submitCreateDrawerForm() {
  if (!activeTenantId.value || !createParentOrgUnitId.value || !canCreate.value) {
    return
  }

  createDrawerSaving.value = true
  try {
    const allowedTypes = resolveCreateChildTypeOptions(createParentOrgUnitId.value)
    if (!allowedTypes.includes(form.type as Exclude<OrgUnitType, 'ROOT'>)) {
      message.error('当前父节点不允许创建该组织类型')
      return
    }

    await createManagedOrgUnitApi(activeTenantId.value, {
      name: form.name.trim(),
      parentOrgId: createParentOrgUnitId.value,
      sortOrder: Number.parseInt(form.sortOrder || '0', 10) || 0,
      type: form.type
    })
    message.success('组织节点已创建')
    createDrawerOpen.value = false
    await refreshOrgGrid()
  } catch (error) {
    message.error(resolveErrorMessage(error, '组织节点创建失败'))
  } finally {
    createDrawerSaving.value = false
  }
}

/** confirmArchive requests confirmation before archiving the currently opened org node from the drawer. */
function confirmArchive() {
  if (!activeTenantId.value || !internalSelectedOrgUnitId.value || !canArchive.value) {
    return
  }

  Modal.confirm({
    title: '停用组织节点',
    content: '当前范围只支持 ArchiveOrgUnit，不提供启用/恢复。',
    okText: '确认停用',
    cancelText: '取消',
    onOk: async () => {
      try {
        await archiveManagedOrgUnitApi(activeTenantId.value, internalSelectedOrgUnitId.value)
        message.success('组织节点已停用')
        detailDrawerOpen.value = false
        await refreshOrgGrid()
      } catch (error) {
        message.error(resolveErrorMessage(error, '组织节点停用失败'))
      }
    }
  })
}

/** refreshOrgGrid re-queries the dept-style org tree grid after mutations. */
async function refreshOrgGrid() {
  await queryOrgGrid()
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

function resolveErrorMessage(error: unknown, fallback: string) {
  const responseMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  return typeof responseMessage === 'string' && responseMessage.trim() ? responseMessage : fallback
}

watch(activeTenantId, async (tenantId, previousTenantId) => {
  if (!tenantId || tenantId === previousTenantId) {
    return
  }

  syncSelectedOrgUnitId('')
  selectedOrgUnit.value = null
  detailDrawerOpen.value = false
  editDrawerOpen.value = false
  createDrawerOpen.value = false
  activeTenantName.value =
    tenantOptions.value.find((item) => item.id === tenantId)?.name || activeTenantName.value
  await refreshOrgGrid()
})

watch(createParentOrgUnitId, () => {
  if (createDrawerOpen.value) {
    syncCreateFormTypeWithParent()
  }
})

watch(
  () => ({
    canReadTree: canReadTree.value,
    tenantId: authContextStore.sessionContext?.tenant?.tenantId || '',
    tenantName:
      authContextStore.sessionContext?.tenant?.name || authContextStore.tenantName || ''
  }),
  async (nextState, previousState) => {
    const previousActiveTenantId = activeTenantId.value
    syncActiveTenant()

    if (!nextState.canReadTree) {
      return
    }

    const permissionBecameReadable = nextState.canReadTree && !previousState?.canReadTree
    const sessionTenantChanged = nextState.tenantId !== previousState?.tenantId
    const workspaceTenantChanged = activeTenantId.value !== previousActiveTenantId

    if (permissionBecameReadable || sessionTenantChanged || workspaceTenantChanged) {
      await refreshOrgGrid()
    }
  }
)

watch(
  () => props.selectedOrgUnitId,
  async (orgUnitId) => {
    if (!orgUnitId || orgUnitId === internalSelectedOrgUnitId.value) {
      return
    }

    if (treeRows.value.some((row) => row.id === orgUnitId)) {
      await openDetailDrawer(orgUnitId)
    }
  }
)

onMounted(async () => {
  try {
    await loadTenantOptions()
    syncActiveTenant()
    await refreshOrgGrid()
  } catch (error) {
    message.error(resolveErrorMessage(error, '组织架构入口初始化失败'))
  }
})

onBeforeUnmount(() => {
  stopOrgColumnResize()
})
</script>

<template>
  <div class="org-management-workspace">
    <Card :bordered="false" class="org-management__panel">
      <div data-testid="org-tree-panel" class="org-management__tree-panel">
        <div class="org-management__table-head">
          <div>
            <h2>组织列表</h2>
            <p>按层级维护组织结构</p>
          </div>
          <Space wrap>
            <Select
              v-if="isSystemEntry"
              v-model:value="activeTenantId"
              class="org-management__tenant-select"
              data-testid="tenant-selector"
              :options="tenantOptions.map((tenant) => ({ label: tenant.name, value: tenant.id }))"
              option-filter-prop="label"
              placeholder="请选择租户"
              show-search
            />
            <Dropdown
              v-if="canCreate"
              trigger="click"
            >
              <Button data-testid="org-create-dropdown" type="primary">
                新建
              </Button>
              <template #overlay>
                <Menu @click="handleCreateDropdownClick">
                  <Menu.Item
                    key="branch"
                    aria-disabled="true"
                    data-testid="org-create-branch-disabled"
                    disabled
                  >
                    创建 Branch
                  </Menu.Item>
                  <Menu.Item
                    key="ordinary"
                    data-testid="org-create-ordinary"
                  >
                    创建普通 Org
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </Space>
        </div>

        <Table
          v-model:expanded-row-keys="expandedOrgUnitIds"
          class="org-management__ant-table"
          data-testid="org-ant-tree-table"
          :columns="orgTableColumns"
          :data-source="orgTreeData"
          :loading="orgTreeLoading"
          :pagination="false"
          :row-key="(record: OrgGridRow) => record.id"
          :scroll="{ x: orgTableScrollX }"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div :data-testid="`org-row-${record.id}`" class="org-management__name-cell">
                <span class="org-management__name">{{ record.name }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'type'">
              {{ formatOrgType(record.type) }}
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="record.status === 'ARCHIVED' ? 'default' : 'green'">
                {{ formatOrgStatus(record.status) }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'operation'">
              <Dropdown
                v-if="getVisibleTableActionItems(getOrgActionItems(record)).length > 0"
                :trigger="['click']"
              >
                <Button aria-label="组织操作" shape="circle" size="small" type="text">
                  <IconifyIcon icon="ant-design:more-outlined" />
                </Button>
                <template #overlay>
                  <Menu @click="(info) => handleOrgAction(String(info.key) as OrgActionKey, record)">
                    <Menu.Item
                      v-for="item in getVisibleTableActionItems(getOrgActionItems(record))"
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
            <Empty description="暂无组织数据" />
          </template>
        </Table>
      </div>
    </Card>

    <Drawer
      v-model:open="detailDrawerOpen"
      :width="680"
      destroy-on-close
      placement="right"
      :title="drawerTitle"
    >
      <div data-testid="org-detail-drawer">
        <div v-if="!selectedOrgUnit" class="org-management__empty-shell">
          <Empty description="选择组织节点后查看详情" />
        </div>
        <div v-else class="org-management__drawer-shell" v-loading="detailLoading">
          <div class="org-management__drawer-head">
            <div>
              <div class="org-management__drawer-title">
                {{ selectedOrgUnit?.name }}
              </div>
              <div v-if="detailDrawerSubtitle" class="org-management__drawer-subtitle">
                {{ detailDrawerSubtitle }}
              </div>
            </div>
            <Space v-if="selectedOrgUnit" wrap>
              <Button
                v-access:code="'tenant_org.org_unit.update'"
                v-if="canEditSelectedOrgUnit"
                data-testid="org-edit-open"
                @click="openEditDrawer(selectedOrgUnit.id)"
              >
                编辑
              </Button>
              <Button
                v-access:code="'tenant_org.org_unit.archive'"
                v-if="selectedOrgUnit.parentOrgId"
                danger
                data-testid="org-archive"
                @click="confirmArchive"
              >
                停用
              </Button>
            </Space>
          </div>

            <Tabs v-model:active-key="detailDrawerTab">
              <Tabs.TabPane key="overview" tab="概览">
                <Table
                  v-if="selectedOrgUnit"
                  :columns="orgDetailColumns"
                  :data-source="orgOverviewRows"
                  :pagination="false"
                  row-key="label"
                  size="small"
                />
            </Tabs.TabPane>

            <Tabs.TabPane key="members" tab="成员">
              <div class="org-management__section-stack">
                <ul class="org-management__plain-list">
                  <li>
                    <span class="org-management__backend-gap">Backend gap</span>
                    <span> 当前读模型尚未提供部门成员摘要</span>
                  </li>
                </ul>
                <div>
                  <div class="org-management__section-title">子部门</div>
                  <ul
                    v-if="selectedOrgChildren.length > 0"
                    class="org-management__plain-list"
                  >
                    <li
                      v-for="child in selectedOrgChildren"
                      :key="child.id"
                    >
                      {{ child.name }} · {{ child.type }} · {{ child.status }}
                    </li>
                  </ul>
                  <div v-else>当前没有子部门</div>
                </div>
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane key="tech" tab="技术信息">
              <Table
                v-if="selectedOrgUnit"
                :columns="orgDetailColumns"
                :data-source="orgTechnicalRows"
                :pagination="false"
                row-key="label"
                size="small"
              />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </Drawer>

    <Drawer
      v-model:open="editDrawerOpen"
      :confirm-loading="editDrawerSaving"
      :width="560"
      destroy-on-close
      placement="right"
      :title="editDrawerTitle"
    >
      <div data-testid="org-edit-drawer" class="org-management__drawer-shell">
        <div class="org-management__drawer-head">
          <div>
            <div class="org-management__drawer-title">编辑组织节点</div>
            <div v-if="editDrawerSubtitle" class="org-management__drawer-subtitle">
              {{ editDrawerSubtitle }}
            </div>
          </div>
        </div>

        <Form
          layout="vertical"
          class="org-management__drawer-form"
        >
          <Form.Item label="名称">
            <Input
              v-model:value="form.name"
              placeholder="输入组织节点名称"
            />
          </Form.Item>
          <Form.Item label="类型">
            <Select
              v-model:value="form.type"
              data-testid="org-form-type"
              :options="editOrgTypeOptions"
            />
          </Form.Item>
          <Form.Item label="排序">
            <InputNumber
              v-model:value="form.sortOrder"
              class="org-management__number-input"
              :min="0"
              :precision="0"
            />
          </Form.Item>
          <Form.Item label="挂载父节点">
            <TreeSelect
              v-model:value="editParentOrgUnitId"
              data-testid="org-edit-parent-tree"
              placeholder="选择父节点"
              show-search
              tree-default-expand-all
              tree-node-filter-prop="title"
              :tree-data="editParentTreeOptions"
            />
          </Form.Item>
        </Form>
        <div class="org-management__form-actions">
          <Button @click="editDrawerOpen = false; resetOrgForm(selectedOrgUnit)">
            取消
          </Button>
          <Button
            v-access:code="'tenant_org.org_unit.update'"
            v-if="canUpdate"
            data-testid="org-edit-save"
            :loading="editDrawerSaving"
            type="primary"
            @click="submitEditDrawerForm"
          >
            保存
          </Button>
        </div>
      </div>
    </Drawer>

    <Drawer
      v-model:open="createDrawerOpen"
      :confirm-loading="createDrawerSaving"
      :width="560"
      destroy-on-close
      placement="right"
      :title="createDrawerTitle"
    >
      <div data-testid="org-create-drawer" class="org-management__drawer-shell">
        <div class="org-management__drawer-head">
          <div>
            <div class="org-management__drawer-title">新建组织节点</div>
            <div v-if="createDrawerSubtitle" class="org-management__drawer-subtitle">
              {{ createDrawerSubtitle }}
            </div>
          </div>
        </div>

        <Form
          layout="vertical"
          class="org-management__drawer-form"
        >
          <Form.Item label="名称">
            <Input
              v-model:value="form.name"
              placeholder="输入组织节点名称"
            />
          </Form.Item>
          <Form.Item label="类型">
            <Select
              v-model:value="form.type"
              data-testid="org-create-form-type"
              :options="createOrgTypeOptions"
            />
          </Form.Item>
          <Form.Item label="排序">
            <InputNumber
              v-model:value="form.sortOrder"
              class="org-management__number-input"
              :min="0"
              :precision="0"
            />
          </Form.Item>
          <Form.Item label="挂载父节点">
            <TreeSelect
              v-model:value="createParentOrgUnitId"
              data-testid="org-create-parent-tree"
              placeholder="选择父节点"
              show-search
              tree-default-expand-all
              tree-node-filter-prop="title"
              :tree-data="createParentTreeOptions"
            />
          </Form.Item>
        </Form>
        <div class="org-management__form-actions">
          <Button
            data-testid="org-create-cancel"
            @click="createDrawerOpen = false; resetOrgForm(null)"
          >
            取消
          </Button>
          <Button
            v-access:code="'tenant_org.org_unit.create'"
            v-if="canCreate"
            :loading="createDrawerSaving"
            type="primary"
            @click="submitCreateDrawerForm"
          >
            创建
          </Button>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.org-management-workspace {
  --org-card-bg: hsl(var(--card));
  --org-card-bg-soft: hsl(var(--muted) / 0.34);
  --org-border: hsl(var(--border));
  --org-muted: hsl(var(--muted-foreground));
  --org-resizer: hsl(var(--muted-foreground) / 0.3);
  --org-table-header-bg: hsl(var(--muted) / 0.54);
  --org-table-row-hover-bg: hsl(var(--muted) / 0.42);
  --org-text: hsl(var(--foreground) / 0.92);
  --org-title: hsl(var(--foreground));
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.org-management__panel {
  background: var(--org-card-bg);
  border: 1px solid var(--org-border);
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.org-management__panel :deep(.ant-card-body) {
  background: var(--org-card-bg);
}

.org-management__tree-panel {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.org-management__table-head {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
}

.org-management__table-head h2 {
  color: var(--org-title);
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  margin: 0;
}

.org-management__table-head p {
  color: var(--org-muted);
  font-size: 13px;
  margin: 2px 0 0;
}

.org-management__tenant-select {
  min-width: 280px;
}

.org-management__ant-table {
  min-width: 0;
}

:deep(.org-management__ant-table .ant-table),
:deep(.org-management__ant-table .ant-table-container) {
  background: transparent;
}

:deep(.org-management__ant-table .ant-table-thead > tr > th) {
  background: var(--org-table-header-bg);
  color: var(--org-text);
  position: relative;
  user-select: none;
}

:deep(.org-management__ant-table .ant-table-tbody > tr > td) {
  background: transparent;
  color: var(--org-text);
}

:deep(.org-management__ant-table .ant-table-tbody > tr:hover > td) {
  background: var(--org-table-row-hover-bg);
}

:deep(.org-management__ant-table .ant-table-cell-fix-right),
:deep(.org-management__ant-table .ant-table-cell-fix-left) {
  background: var(--org-card-bg);
}

.org-management__resizable-title {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 24px;
  padding-right: 12px;
}

:deep(
  .org-management__ant-table
    .ant-table-thead
    > tr
    > th:not(:first-child)
    .org-management__resizable-title
) {
  justify-content: center;
}

.org-management__resizable-title-text {
  min-width: 0;
}

.org-management__column-resizer {
  position: absolute;
  top: -12px;
  right: -10px;
  bottom: -12px;
  z-index: 2;
  width: 14px;
  cursor: col-resize;
}

.org-management__column-resizer::after {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 6px;
  width: 1px;
  content: '';
  background: var(--org-resizer);
  transition: background 0.16s ease;
}

.org-management__column-resizer:hover::after {
  background: hsl(var(--primary));
}

.org-management__name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.org-management__name {
  color: var(--org-title);
  font-weight: 500;
}

.org-management__drawer-shell,
.org-management__section-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.org-management__drawer-head {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.org-management__drawer-title {
  font-size: 18px;
  font-weight: 700;
}

.org-management__drawer-subtitle,
.org-management__section-title {
  color: var(--org-muted);
}

.org-management__backend-gap {
  color: #d46b08;
  font-weight: 600;
}

.org-management__plain-list {
  margin: 0;
  padding-left: 18px;
}

.org-management__plain-list li {
  line-height: 1.8;
}

.org-management__drawer-form {
  max-width: 100%;
}

.org-management__number-input {
  width: 100%;
}

.org-management__operation-cell {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.org-management__form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

.org-management__empty-shell {
  padding: 24px 0;
}

:global(body.org-management--resizing-column) {
  cursor: col-resize;
  user-select: none;
}

@media (max-width: 960px) {
  .org-management__tenant-select {
    min-width: min(100%, 260px);
    width: 100%;
  }

  .org-management__drawer-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
