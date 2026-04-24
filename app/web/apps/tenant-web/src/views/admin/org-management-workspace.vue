<script setup lang="ts">
import type { TenantManagementApi } from '#/api'

import { computed, onMounted, reactive, ref, watch } from 'vue'

import { Button, Card, Empty, Modal, Space, Tag, message } from 'ant-design-vue'

import {
  archiveManagedOrgUnitApi,
  createManagedOrgUnitApi,
  getManagedOrgTreeApi,
  getManagedOrgUnitByIdApi,
  listManagedTenantsApi,
  updateManagedOrgUnitApi,
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

import {
  flattenManagedOrgTree,
  formatManagedOrganizationPartyName,
} from './org-read-side'

interface OrgFormState {
  name: string
  sortOrder: string
  type: string
}

type OrgFormMode = 'create' | 'edit'
type ManagementMode = 'SYSTEM' | 'TENANT'

interface Props {
  managementMode: ManagementMode
  selectedOrgUnitId?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedOrgUnitId: '',
})

const emit = defineEmits<{
  (event: 'update:selectedOrgUnitId', value: string): void
}>()

const authContextStore = useAuthContextStore()
const tenantOptions = ref<TenantManagementApi.TenantSummary[]>([])
const activeTenantId = ref('')
const activeTenantName = ref('')
const loading = ref(false)
const treeRows = ref<ReturnType<typeof flattenManagedOrgTree>>([])
const internalSelectedOrgUnitId = ref('')
const selectedOrgUnit = ref<null | TenantManagementApi.ManagedOrgUnit>(null)
const detailLoading = ref(false)
const formOpen = ref(false)
const formMode = ref<OrgFormMode>('create')
const formSaving = ref(false)
const form = reactive<OrgFormState>({
  name: '',
  sortOrder: '0',
  type: 'DEPARTMENT',
})

const orgTypeOptions = [
  'ROOT',
  'DEPARTMENT',
  'TEAM',
  'BRANCH',
  'OTHER',
] as const

const isSystemEntry = computed(
  () => props.managementMode === 'SYSTEM' && authContextStore.isPlatformScope,
)
const canReadTree = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.org_unit.list_tree'),
)
const canReadDetail = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.org_unit.get_by_id'),
)
const canCreate = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.org_unit.create'),
)
const canUpdate = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.org_unit.update'),
)
const canArchive = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.org_unit.archive'),
)

/** syncSelectedOrgUnitId keeps the selected org node aligned with the owning shell query state. */
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
    status: 'ACTIVE',
  })
  tenantOptions.value = result.items ?? []
}

/** loadOrgUnitDetail refreshes the right-side detail workspace for one selected org node. */
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

/** loadOrgTree refreshes the selected tenant org tree and keeps the current selection/detail coherent. */
async function loadOrgTree() {
  if (!canReadTree.value || !activeTenantId.value) {
    treeRows.value = []
    internalSelectedOrgUnitId.value = ''
    selectedOrgUnit.value = null
    return
  }

  loading.value = true
  try {
    const result = await getManagedOrgTreeApi(activeTenantId.value)
    treeRows.value = flattenManagedOrgTree(result.roots ?? [])
    if (isSystemEntry.value && result.tenant?.name) {
      activeTenantName.value = result.tenant.name
    }

    const nextOrgUnitId = resolvePreferredOrgUnitId()
    if (nextOrgUnitId) {
      syncSelectedOrgUnitId(nextOrgUnitId)
      await loadOrgUnitDetail(nextOrgUnitId)
    } else {
      selectedOrgUnit.value = null
    }
  } catch (error) {
    treeRows.value = []
    internalSelectedOrgUnitId.value = ''
    selectedOrgUnit.value = null
    message.error(resolveErrorMessage(error, '组织树加载失败'))
  } finally {
    loading.value = false
  }
}

/** selectOrgNode switches the current detail workspace to the clicked org node. */
async function selectOrgNode(orgUnitId: string) {
  syncSelectedOrgUnitId(orgUnitId)
  await loadOrgUnitDetail(orgUnitId)
}

/** openCreateForm prepares a create draft under the currently selected parent org node. */
function openCreateForm() {
  formMode.value = 'create'
  form.name = ''
  form.sortOrder = '0'
  form.type = 'DEPARTMENT'
  formOpen.value = true
}

/** openEditForm copies the current org node detail into the shared edit form. */
function openEditForm() {
  if (!selectedOrgUnit.value) {
    return
  }

  formMode.value = 'edit'
  form.name = selectedOrgUnit.value.name
  form.sortOrder = String(selectedOrgUnit.value.sortOrder)
  form.type = selectedOrgUnit.value.type
  formOpen.value = true
}

/** submitForm persists either a create or edit action through the shared org management BFF. */
async function submitForm() {
  if (!activeTenantId.value || !internalSelectedOrgUnitId.value) {
    return
  }

  formSaving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      sortOrder: Number.parseInt(form.sortOrder || '0', 10) || 0,
      type: form.type,
    }

    if (formMode.value === 'create') {
      await createManagedOrgUnitApi(activeTenantId.value, {
        ...payload,
        parentOrgId: internalSelectedOrgUnitId.value,
      })
      message.success('组织节点已创建')
    } else {
      await updateManagedOrgUnitApi(activeTenantId.value, internalSelectedOrgUnitId.value, payload)
      message.success('组织节点已更新')
    }

    formOpen.value = false
    await loadOrgTree()
  } catch (error) {
    message.error(resolveErrorMessage(error, formMode.value === 'create' ? '组织节点创建失败' : '组织节点更新失败'))
  } finally {
    formSaving.value = false
  }
}

/** confirmArchive requests confirmation before archiving the currently selected org node. */
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
        await loadOrgTree()
      } catch (error) {
        message.error(resolveErrorMessage(error, '组织节点停用失败'))
      }
    },
  })
}

function resolveErrorMessage(error: unknown, fallback: string) {
  const responseMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  return typeof responseMessage === 'string' && responseMessage.trim()
    ? responseMessage
    : fallback
}

watch(activeTenantId, async (tenantId, previousTenantId) => {
  if (!tenantId || tenantId === previousTenantId) {
    return
  }

  internalSelectedOrgUnitId.value = ''
  selectedOrgUnit.value = null
  activeTenantName.value =
    tenantOptions.value.find((item) => item.id === tenantId)?.name || activeTenantName.value
  await loadOrgTree()
})

watch(
  () => props.selectedOrgUnitId,
  async (orgUnitId) => {
    if (!orgUnitId || orgUnitId === internalSelectedOrgUnitId.value) {
      return
    }

    if (treeRows.value.some((row) => row.id === orgUnitId)) {
      internalSelectedOrgUnitId.value = orgUnitId
      await loadOrgUnitDetail(orgUnitId)
    }
  },
)

onMounted(async () => {
  try {
    await loadTenantOptions()
    syncActiveTenant()
    await loadOrgTree()
  } catch (error) {
    message.error(resolveErrorMessage(error, '组织架构入口初始化失败'))
  }
})
</script>

<template>
  <div class="org-management-workspace">
    <Card :bordered="false" class="org-management__panel">
      <div class="org-management__context-grid">
        <div class="org-management__context-card">
          <div class="org-management__context-title">
            {{ isSystemEntry ? '指定 Tenant' : '当前 Tenant' }}
          </div>
          <div>{{ activeTenantName || '未选择租户' }}</div>
        </div>
        <div class="org-management__context-card">
          <div class="org-management__context-title">组织边界</div>
          <div>这里只管理 org tree / org node。</div>
          <div>不处理 employee / account owner。</div>
        </div>
      </div>
      <select
        v-if="isSystemEntry"
        v-model="activeTenantId"
        class="org-management__select"
        data-testid="tenant-selector"
      >
        <option
          v-for="tenant in tenantOptions"
          :key="tenant.id"
          :value="tenant.id"
        >
          {{ tenant.name }}
        </option>
      </select>
    </Card>

    <div class="org-management__grid">
      <Card :bordered="false" class="org-management__panel">
        <template #title>部门树</template>
        <div v-if="!activeTenantId && isSystemEntry" class="org-management__empty-shell">
          <Empty description="请选择要管理的 tenant" />
        </div>
        <div v-else-if="treeRows.length === 0" class="org-management__empty-shell">
          <Empty description="当前 tenant 暂无组织节点" />
        </div>
        <div v-else class="org-management__tree-list" v-loading="loading">
          <button
            v-for="node in treeRows"
            :key="node.id"
            :data-testid="`org-node-${node.id}`"
            class="org-management__tree-node"
            :class="{ 'org-management__tree-node--active': internalSelectedOrgUnitId === node.id }"
            type="button"
            :style="{ paddingLeft: `${16 + node.depth * 20}px` }"
            @click="selectOrgNode(node.id)"
          >
            <span class="org-management__tree-main">
              <span class="org-management__tree-name">{{ node.name }}</span>
              <span class="org-management__tree-meta">{{ node.type }}</span>
              <span
                v-if="node.organizationPartyId"
                class="org-management__tree-meta org-management__tree-meta--secondary"
              >
                OrganizationParty: {{ formatManagedOrganizationPartyName(node) }}
              </span>
            </span>
            <Tag :color="node.status === 'ARCHIVED' ? 'default' : 'green'">
              {{ node.status === 'ARCHIVED' ? '已停用' : '启用中' }}
            </Tag>
          </button>
        </div>
      </Card>

      <Card :bordered="false" class="org-management__panel">
        <template #title>部门详情</template>
        <div v-if="!selectedOrgUnit" class="org-management__empty-shell">
          <Empty description="从左侧选择组织节点查看详情" />
        </div>
        <div v-else class="org-management__detail" v-loading="detailLoading">
          <div class="org-management__detail-head">
            <div>
              <div class="org-management__detail-title">{{ selectedOrgUnit.name }}</div>
              <div class="org-management__detail-subtitle">
                {{ activeTenantName || selectedOrgUnit.tenantId }}
              </div>
            </div>
            <Space>
              <Button
                v-if="canCreate"
                data-testid="org-create-open"
                type="primary"
                @click="openCreateForm"
              >
                新建下级 OrgUnit
              </Button>
              <Button
                v-if="canUpdate"
                data-testid="org-edit-open"
                @click="openEditForm"
              >
                编辑 OrgUnit
              </Button>
              <Button
                v-if="canArchive && selectedOrgUnit.parentOrgId"
                danger
                data-testid="org-archive"
                @click="confirmArchive"
              >
                停用 OrgUnit
              </Button>
            </Space>
          </div>

          <div class="org-management__detail-grid">
            <div class="org-management__detail-item">
              <span>节点 ID</span>
              <strong>{{ selectedOrgUnit.id }}</strong>
            </div>
            <div class="org-management__detail-item">
              <span>类型</span>
              <strong>{{ selectedOrgUnit.type }}</strong>
            </div>
            <div class="org-management__detail-item">
              <span>状态</span>
              <strong>{{ selectedOrgUnit.status }}</strong>
            </div>
            <div class="org-management__detail-item">
              <span>父节点</span>
              <strong>{{ selectedOrgUnit.parentOrgId || 'ROOT' }}</strong>
            </div>
            <div class="org-management__detail-item">
              <span>层级深度</span>
              <strong>{{ selectedOrgUnit.depth }}</strong>
            </div>
            <div class="org-management__detail-item">
              <span>排序</span>
              <strong>{{ selectedOrgUnit.sortOrder }}</strong>
            </div>
            <div class="org-management__detail-item">
              <span>OrganizationPartyId</span>
              <strong>{{ selectedOrgUnit.organizationPartyId || '未关联' }}</strong>
            </div>
            <div class="org-management__detail-item">
              <span>OrganizationParty</span>
              <strong>{{ formatManagedOrganizationPartyName(selectedOrgUnit) || '未关联' }}</strong>
            </div>
          </div>

          <div class="org-management__path">
            <span>组织路径</span>
            <code>{{ selectedOrgUnit.path }}</code>
          </div>
        </div>
      </Card>
    </div>

    <Card v-if="formOpen" :bordered="false" class="org-management__panel org-management__form-panel">
      <template #title>
        {{ formMode === 'create' ? '新建 OrgUnit' : '编辑 OrgUnit' }}
      </template>
      <div class="org-management__form-grid">
        <label class="org-management__field">
          <span>名称</span>
          <input
            v-model="form.name"
            placeholder="输入组织节点名称"
            type="text"
          >
        </label>
        <label class="org-management__field">
          <span>类型</span>
          <select
            v-model="form.type"
            class="org-management__select"
            data-testid="org-form-type"
          >
            <option
              v-for="option in orgTypeOptions"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </label>
        <label class="org-management__field">
          <span>排序</span>
          <input
            v-model="form.sortOrder"
            placeholder="默认 0，可用于同级排序"
            type="number"
          >
        </label>
      </div>
      <div class="org-management__form-actions">
        <Button @click="formOpen = false">取消</Button>
        <Button
          type="primary"
          data-testid="org-form-submit"
          :loading="formSaving"
          @click="submitForm"
        >
          {{ formMode === 'create' ? '创建' : '保存' }}
        </Button>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.org-management-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.org-management__detail-head,
.org-management__form-actions {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.org-management__context-grid,
.org-management__grid,
.org-management__detail-grid,
.org-management__form-grid {
  display: grid;
  gap: 16px;
}

.org-management__context-grid,
.org-management__detail-grid,
.org-management__form-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.org-management__grid {
  grid-template-columns: minmax(280px, 0.95fr) minmax(320px, 1.05fr);
}

.org-management__panel {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.org-management__context-card,
.org-management__detail-item,
.org-management__field {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
}

.org-management__context-title,
.org-management__detail-title {
  font-size: 16px;
  font-weight: 700;
}

.org-management__detail-subtitle,
.org-management__detail-item span,
.org-management__path span,
.org-management__field span {
  color: #64748b;
  font-size: 12px;
}

.org-management__tree-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.org-management__tree-node {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  justify-content: space-between;
  min-height: 52px;
  padding: 12px 16px;
  text-align: left;
  width: 100%;
}

.org-management__tree-node--active {
  border-color: #1677ff;
  box-shadow: 0 0 0 1px rgba(22, 119, 255, 0.12);
}

.org-management__tree-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.org-management__tree-name {
  font-weight: 600;
}

.org-management__tree-meta {
  color: #64748b;
  font-size: 12px;
}

.org-management__detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.org-management__path {
  background: #0f172a;
  border-radius: 14px;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
}

.org-management__path code {
  color: #f8fafc;
  white-space: pre-wrap;
}

.org-management__select,
.org-management__field input {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  min-height: 40px;
  padding: 0 12px;
}

.org-management__empty-shell {
  padding: 24px 0;
}

@media (max-width: 960px) {
  .org-management__grid {
    grid-template-columns: 1fr;
  }

  .org-management__detail-head,
  .org-management__form-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
