<script setup lang="ts">
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table'
import type { TenantManagementApi } from '#/api'

import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'

import { Plus } from '@vben/icons'

import {
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tabs,
  Tag,
  message
} from 'ant-design-vue'

import { useVbenVxeGrid } from '#/adapter/vxe-table'
import {
  archiveManagedOrgUnitApi,
  createManagedOrgUnitApi,
  getManagedOrgTreeApi,
  getManagedOrgUnitByIdApi,
  listManagedTenantsApi,
  updateManagedOrgUnitApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

import {
  flattenManagedOrgTree,
  formatManagedOrganizationPartyName,
  mapManagedOrgTreeToGridRows
} from './org-read-side'

interface OrgFormState {
  name: string
  sortOrder: string
  type: string
}

type DrawerMode = 'detail' | 'edit'
type ManagementMode = 'SYSTEM' | 'TENANT'

interface Props {
  managementMode: ManagementMode
  selectedOrgUnitId?: string
}

type OrgGridRow = ReturnType<typeof flattenManagedOrgTree>[number] & {
  children?: OrgGridRow[]
  organizationPartyName: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedOrgUnitId: ''
})

const emit = defineEmits<{
  (event: 'update:selectedOrgUnitId', value: string): void
}>()

const authContextStore = useAuthContextStore()
const tenantOptions = ref<TenantManagementApi.TenantSummary[]>([])
const activeTenantId = ref('')
const activeTenantName = ref('')
const treeRows = ref<ReturnType<typeof flattenManagedOrgTree>>([])
const internalSelectedOrgUnitId = ref('')
const selectedOrgUnit = ref<null | TenantManagementApi.ManagedOrgUnit>(null)
const detailLoading = ref(false)
const detailDrawerOpen = ref(false)
const detailDrawerTab = ref('overview')
const detailDrawerMode = ref<DrawerMode>('detail')
const detailDrawerSaving = ref(false)
const createDrawerOpen = ref(false)
const createDrawerSaving = ref(false)
const createDrawerParentName = ref('')
const createParentOrgUnitId = ref('')
const form = reactive<OrgFormState>({
  name: '',
  sortOrder: '0',
  type: 'DEPARTMENT'
})
const workspaceElement = ref<HTMLElement | null>(null)
const gridHeight = ref(640)

const orgTypeOptions = ['ROOT', 'DEPARTMENT', 'TEAM', 'BRANCH', 'OTHER'] as const

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
const drawerTitle = computed(() => {
  if (detailDrawerMode.value === 'edit') {
    return '编辑 OrgUnit'
  }

  return '组织详情'
})
const createDrawerTitle = computed(() => '新建 OrgUnit')
const isDetailMode = computed(() => detailDrawerMode.value === 'detail')
const detailDrawerSubtitle = computed(() =>
  isSystemEntry.value ? activeTenantName.value || selectedOrgUnit.value?.tenantId || '' : ''
)
const createDrawerSubtitle = computed(() =>
  isSystemEntry.value ? activeTenantName.value || createParentOrgUnitId.value || '' : ''
)

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
    syncSelectedOrgUnitId('')
    selectedOrgUnit.value = null
    detailDrawerOpen.value = false
    createDrawerOpen.value = false
    return [] as OrgGridRow[]
  }

  const result = await getManagedOrgTreeApi(activeTenantId.value)
  treeRows.value = flattenManagedOrgTree(result.roots ?? [])
  const gridRows = mapManagedOrgTreeToGridRows(result.roots ?? [])
  if (isSystemEntry.value && result.tenant?.name) {
    activeTenantName.value = result.tenant.name
  }

  const nextOrgUnitId = resolvePreferredOrgUnitId()
  syncSelectedOrgUnitId(nextOrgUnitId)

  return gridRows.map((row) => decorateGridRow(row))
}

/** expandRootRows opens all root nodes after grid data is mounted so depth=1 rows are visible on first entry. */
async function expandRootRows() {
  await nextTick()
  const currentRows = (orgGridApi.grid?.getData?.() ?? []) as Array<{
    children?: unknown[]
    depth: number
    id: string
  }>
  const rootRows = currentRows.filter((row) => row.depth === 0 && (row.children?.length ?? 0) > 0)
  if (rootRows.length === 0) {
    return
  }

  await orgGridApi.grid?.setTreeExpand(rootRows, true)
}

/** decorateGridRow adds presentation-only fields without breaking the nested org tree structure. */
function decorateGridRow(row: ReturnType<typeof mapManagedOrgTreeToGridRows>[number]): OrgGridRow {
  return {
    ...row,
    children: row.children?.map((child) => decorateGridRow(child)),
    organizationPartyName: formatManagedOrganizationPartyName(row) || '未关联'
  }
}

/** resetOrgForm prepares the org create/edit fields for the drawer form area. */
function resetOrgForm(orgUnit?: TenantManagementApi.ManagedOrgUnit | null) {
  form.name = orgUnit?.name ?? ''
  form.sortOrder = String(orgUnit?.sortOrder ?? 0)
  form.type = orgUnit?.type ?? 'DEPARTMENT'
}

/** openDetailDrawer enters the read-first org drawer mode used by grid view actions. */
async function openDetailDrawer(orgUnitId: string) {
  createDrawerOpen.value = false
  syncSelectedOrgUnitId(orgUnitId)
  detailDrawerMode.value = 'detail'
  detailDrawerTab.value = 'overview'
  await loadOrgUnitDetail(orgUnitId)
  detailDrawerOpen.value = true
}

/** openEditDrawer enters the drawer edit mode for the selected org node. */
async function openEditDrawer(orgUnitId: string) {
  createDrawerOpen.value = false
  syncSelectedOrgUnitId(orgUnitId)
  detailDrawerMode.value = 'edit'
  detailDrawerTab.value = 'form'
  await loadOrgUnitDetail(orgUnitId)
  resetOrgForm(selectedOrgUnit.value)
  detailDrawerOpen.value = true
}

/** openCreateChildDrawer opens the dedicated create drawer under the given parent node. */
async function openCreateChildDrawer(parentOrgUnitId: string) {
  const parentOrgUnit = treeRows.value.find((row) => row.id === parentOrgUnitId)
  createParentOrgUnitId.value = parentOrgUnitId
  createDrawerParentName.value = parentOrgUnit?.name || parentOrgUnitId
  detailDrawerOpen.value = false
  resetOrgForm(null)
  createDrawerOpen.value = true
}

/** submitEditDrawerForm persists the current detail drawer edit action through the org BFF. */
async function submitEditDrawerForm() {
  if (!activeTenantId.value || !internalSelectedOrgUnitId.value) {
    return
  }

  detailDrawerSaving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      sortOrder: Number.parseInt(form.sortOrder || '0', 10) || 0,
      type: form.type
    }

    await updateManagedOrgUnitApi(activeTenantId.value, internalSelectedOrgUnitId.value, payload)
    message.success('组织节点已更新')

    detailDrawerMode.value = 'detail'
    detailDrawerTab.value = 'overview'
    await refreshOrgGrid()
    await loadOrgUnitDetail(internalSelectedOrgUnitId.value)
  } catch (error) {
    message.error(resolveErrorMessage(error, '组织节点更新失败'))
  } finally {
    detailDrawerSaving.value = false
  }
}

/** submitCreateDrawerForm persists one create request through the dedicated new-org drawer. */
async function submitCreateDrawerForm() {
  if (!activeTenantId.value || !createParentOrgUnitId.value) {
    return
  }

  createDrawerSaving.value = true
  try {
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
  if (!activeTenantId.value || !internalSelectedOrgUnitId.value) {
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

function buildOrgGridColumns() {
  return [
    {
      align: 'left',
      field: 'name',
      fixed: 'left',
      title: '部门名称',
      treeNode: true,
      width: 220
    },
    {
      field: 'type',
      title: '类型',
      width: 120
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: '启用中', value: 'ACTIVE' },
          { color: 'default', label: '已停用', value: 'ARCHIVED' }
        ]
      }
    },
    {
      field: 'organizationPartyName',
      title: 'OrganizationParty',
      minWidth: 180
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '组织节点',
          onClick: onActionClick
        },
        name: 'CellOperation',
        options: [
          {
            code: 'view',
            text: '查看'
          },
          {
            code: 'append',
            text: '新增下级'
          },
          {
            code: 'edit',
            text: '编辑'
          }
        ]
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: '操作',
      width: 280
    },
  ]
}

/** onActionClick maps the dept-style operation column into the unified org drawer flows. */
async function onActionClick({ code, row }: OnActionClickParams<OrgGridRow>) {
  switch (code) {
    case 'view': {
      await openDetailDrawer(row.id)
      break
    }
    case 'append': {
      await openCreateChildDrawer(row.id)
      break
    }
    case 'edit': {
      await openEditDrawer(row.id)
      break
    }
  }
}

/** refreshOrgGrid re-queries the dept-style org tree grid after mutations. */
async function refreshOrgGrid() {
  await orgGridApi.query()
  await expandRootRows()
}

/** openCreateAtRoot opens create mode under the tenant root, mirroring dept-list style top-toolbar creation. */
function openCreateAtRoot() {
  const rootOrgUnitId = treeRows.value.find((row) => row.depth === 0)?.id
  if (!rootOrgUnitId) {
    message.warning('当前租户还没有可挂载的根组织')
    return
  }

  void openCreateChildDrawer(rootOrgUnitId)
}

function resolveErrorMessage(error: unknown, fallback: string) {
  const responseMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  return typeof responseMessage === 'string' && responseMessage.trim() ? responseMessage : fallback
}

/** updateGridHeight sizes the department grid to the live viewport so the workbench reads like a full page instead of a tiny list. */
function updateGridHeight() {
  if (typeof window === 'undefined') {
    return
  }

  const minHeight = window.innerWidth <= 960 ? 420 : 560
  const top = workspaceElement.value?.getBoundingClientRect().top ?? 0
  const measuredHeight = Math.floor(window.innerHeight - top - 32)
  const nextHeight = Number.isFinite(measuredHeight)
    ? Math.max(minHeight, measuredHeight)
    : minHeight

  gridHeight.value = nextHeight
  orgGridApi.setGridOptions({
    height: nextHeight
  })
}

const [Grid, orgGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: buildOrgGridColumns(),
    height: gridHeight.value,
    keepSource: true,
    pagerConfig: {
      enabled: false
    },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async () => queryOrgGrid()
      }
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true
    },
    treeConfig: {
      parentField: 'parentOrgId',
      rowField: 'id',
      transform: false
    }
  } as VxeTableGridOptions<OrgGridRow>
})

watch(activeTenantId, async (tenantId, previousTenantId) => {
  if (!tenantId || tenantId === previousTenantId) {
    return
  }

  syncSelectedOrgUnitId('')
  selectedOrgUnit.value = null
  detailDrawerOpen.value = false
  createDrawerOpen.value = false
  activeTenantName.value =
    tenantOptions.value.find((item) => item.id === tenantId)?.name || activeTenantName.value
  await refreshOrgGrid()
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
    await nextTick()
    updateGridHeight()
    window.addEventListener('resize', updateGridHeight)
  } catch (error) {
    message.error(resolveErrorMessage(error, '组织架构入口初始化失败'))
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateGridHeight)
})
</script>

<template>
  <div ref="workspaceElement" class="org-management-workspace">
    <Card :bordered="false" class="org-management__panel">
      <div data-testid="org-tree-panel" class="org-management__tree-panel">
        <Grid table-title="部门列表">
          <template #toolbar-actions>
            <div v-if="isSystemEntry" class="org-management__toolbar-context">
              <Select
                v-model:value="activeTenantId"
                class="org-management__tenant-select"
                data-testid="tenant-selector"
                :options="tenantOptions.map((tenant) => ({ label: tenant.name, value: tenant.id }))"
                option-filter-prop="label"
                placeholder="请选择租户"
                show-search
              />
            </div>
          </template>

          <template #toolbar-tools>
            <Button
              v-if="canCreate"
              data-testid="org-create-open"
              type="primary"
              @click="openCreateAtRoot"
            >
              <Plus class="size-5" />
              新建 OrgUnit
            </Button>
          </template>
        </Grid>
      </div>
    </Card>

    <Drawer
      v-model:open="detailDrawerOpen"
      :confirm-loading="detailDrawerSaving"
      :width="680"
      destroy-on-close
      placement="right"
      :title="drawerTitle"
    >
      <div data-testid="org-detail-drawer">
        <div v-if="!selectedOrgUnit && isDetailMode" class="org-management__empty-shell">
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
            <Space v-if="isDetailMode && selectedOrgUnit" wrap>
              <Button
                v-if="canUpdate"
                data-testid="org-edit-open"
                @click="openEditDrawer(selectedOrgUnit.id)"
              >
                编辑
              </Button>
              <Button
                v-if="canArchive && selectedOrgUnit.parentOrgId"
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
              <table
                v-if="selectedOrgUnit"
                class="org-management__detail-table"
              >
                <tbody>
                  <tr>
                    <th>名称</th>
                    <td>{{ selectedOrgUnit.name }}</td>
                  </tr>
                  <tr>
                    <th>类型</th>
                    <td>{{ selectedOrgUnit.type }}</td>
                  </tr>
                  <tr>
                    <th>状态</th>
                    <td>
                      <Tag :color="selectedOrgUnit.status === 'ARCHIVED' ? 'default' : 'green'">
                        {{ selectedOrgUnit.status === 'ARCHIVED' ? '已停用' : '启用中' }}
                      </Tag>
                    </td>
                  </tr>
                  <tr>
                    <th>父节点</th>
                    <td>{{ selectedOrgUnit.parentOrgId || 'ROOT' }}</td>
                  </tr>
                  <tr>
                    <th>负责人</th>
                    <td>
                      <span class="org-management__backend-gap">Backend gap</span>
                      <div>当前读模型尚未提供组织负责人名字</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Tabs.TabPane>

            <Tabs.TabPane key="form" tab="编辑信息">
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
                    :options="orgTypeOptions.map((option) => ({ label: option, value: option }))"
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
                  <Input
                    :value="selectedOrgUnit?.parentOrgId || 'ROOT'"
                    disabled
                  />
                </Form.Item>
              </Form>
              <div class="org-management__form-actions">
                <Button @click="detailDrawerMode = 'detail'; detailDrawerTab = 'overview'; resetOrgForm(selectedOrgUnit)">
                  取消
                </Button>
                <Button
                  type="primary"
                  @click="submitEditDrawerForm"
                >
                  保存
                </Button>
              </div>
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
              <table
                v-if="selectedOrgUnit"
                class="org-management__detail-table"
              >
                <tbody>
                  <tr>
                    <th>节点 ID</th>
                    <td>{{ selectedOrgUnit.id }}</td>
                  </tr>
                  <tr>
                    <th>层级深度</th>
                    <td>{{ selectedOrgUnit.depth }}</td>
                  </tr>
                  <tr>
                    <th>排序</th>
                    <td>{{ selectedOrgUnit.sortOrder }}</td>
                  </tr>
                  <tr>
                    <th>OrganizationPartyId</th>
                    <td>{{ selectedOrgUnit.organizationPartyId || '未关联' }}</td>
                  </tr>
                  <tr>
                    <th>OrganizationParty</th>
                    <td>{{ formatManagedOrganizationPartyName(selectedOrgUnit) || '未关联' }}</td>
                  </tr>
                  <tr>
                    <th>组织路径</th>
                    <td><code>{{ selectedOrgUnit.path }}</code></td>
                  </tr>
                </tbody>
              </table>
            </Tabs.TabPane>
          </Tabs>
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
              :options="orgTypeOptions.map((option) => ({ label: option, value: option }))"
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
            <Input
              :value="createDrawerParentName || createParentOrgUnitId || 'ROOT'"
              disabled
            />
          </Form.Item>
        </Form>
        <div class="org-management__form-actions">
          <Button
            @click="createDrawerOpen = false; resetOrgForm(null)"
          >
            取消
          </Button>
          <Button
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
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.org-management__panel {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.org-management__tree-panel {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.org-management__toolbar-context {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.org-management__tenant-select {
  min-width: 280px;
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
  color: #64748b;
}

.org-management__backend-gap {
  color: #d46b08;
  font-weight: 600;
}

.org-management__detail-table {
  border-collapse: collapse;
  width: 100%;
}

.org-management__detail-table th,
.org-management__detail-table td {
  border: 1px solid #f0f0f0;
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
}

.org-management__detail-table th {
  background: #fafafa;
  font-weight: 600;
  width: 140px;
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

.org-management__form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

.org-management__empty-shell {
  padding: 24px 0;
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
