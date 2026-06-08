<script setup lang="ts">
import type { PublicEntryShortLinkApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, reactive, ref } from 'vue'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  QRCode,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  message
} from 'ant-design-vue'

import {
  changePublicEntryShortLinkStatusApi,
  createPublicEntryShortLinkApi,
  getPublicEntryShortLinkQrApi,
  getPublicEntryShortLinkStatsApi,
  listPublicEntryShortLinksByTargetApi,
  resolvePublicEntryShortLinkQrDownloadUrl,
  updatePublicEntryShortLinkMetadataApi,
  updatePublicEntryShortLinkTargetApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type TargetKind = PublicEntryShortLinkApi.TargetKind
type ShortLinkRecord = PublicEntryShortLinkApi.ShortLinkRecord

interface CreateFormState {
  campaignRef: string
  displayName: string
  entryPurpose: string
  expiresAt: string
  sourcePlacement: string
  targetKind: TargetKind
  targetResourceId: string
  targetType: string
  targetUrl: string
}

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const filter = reactive({
  targetResourceId: 'card_001',
  targetType: 'BUSINESS_CARD'
})
const createForm = reactive<CreateFormState>({
  campaignRef: '',
  displayName: '',
  entryPurpose: 'BUSINESS_CARD',
  expiresAt: '',
  sourcePlacement: 'MAIN_PROFILE',
  targetKind: 'EXTERNAL_URL',
  targetResourceId: '',
  targetType: 'BUSINESS_CARD',
  targetUrl: ''
})
const links = ref<ShortLinkRecord[]>([])
const selectedLinkId = ref('')
const stats = ref<PublicEntryShortLinkApi.StatsResult | null>(null)
const qr = ref<PublicEntryShortLinkApi.QrResult | null>(null)
const loading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const drawerOpen = ref(false)
const drawerMode = ref<'create' | 'target'>('create')
const errorMessage = ref('')

const selectedLink = computed(() => links.value.find((link) => link.id === selectedLinkId.value) ?? null)
const qrImageSrc = computed(() => (qr.value?.imageBase64 ? `data:image/png;base64,${qr.value.imageBase64}` : ''))
const qrDownloadUrl = computed(() =>
  selectedLink.value && activeTenantId.value
    ? resolvePublicEntryShortLinkQrDownloadUrl(activeTenantId.value, selectedLink.value.id)
    : ''
)

const columns = computed<TableColumnsType<ShortLinkRecord>>(() => [
  {
    key: 'displayName',
    title: '名称',
    width: 220
  },
  {
    key: 'shortCode',
    title: '短码',
    width: 120
  },
  {
    key: 'target',
    title: '目标',
    width: 260
  },
  {
    key: 'status',
    title: '状态',
    width: 110
  },
  {
    key: 'operation',
    title: '操作',
    width: 220
  }
])

// loadLinks refreshes the target-scoped ShortLink list from the admin BFF.
async function loadLinks() {
  if (!activeTenantId.value) {
    errorMessage.value = '当前会话缺少租户上下文。'
    return
  }
  if (!filter.targetType.trim() || !filter.targetResourceId.trim()) {
    errorMessage.value = '请输入 targetType 和 targetResourceId 后再查询。'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listPublicEntryShortLinksByTargetApi(activeTenantId.value, {
      page: 1,
      pageSize: 50,
      targetResourceId: filter.targetResourceId.trim(),
      targetType: filter.targetType.trim()
    })
    links.value = result.items ?? []
    selectedLinkId.value = links.value[0]?.id ?? ''
    await loadSelectedDetail()
  } catch (error) {
    errorMessage.value = (error as Error).message || '短链列表加载失败。'
  } finally {
    loading.value = false
  }
}

// loadSelectedDetail refreshes stats and QR preview for the selected ShortLink.
async function loadSelectedDetail() {
  const link = selectedLink.value
  if (!link || !activeTenantId.value) {
    stats.value = null
    qr.value = null
    return
  }
  detailLoading.value = true
  try {
    const [statsResult, qrResult] = await Promise.all([
      getPublicEntryShortLinkStatsApi(activeTenantId.value, link.id),
      getPublicEntryShortLinkQrApi(activeTenantId.value, link.id)
    ])
    stats.value = statsResult
    qr.value = qrResult
  } finally {
    detailLoading.value = false
  }
}

// openCreateDrawer resets and opens the ShortLink create drawer.
function openCreateDrawer() {
  drawerMode.value = 'create'
  Object.assign(createForm, {
    campaignRef: '',
    displayName: '',
    entryPurpose: 'BUSINESS_CARD',
    expiresAt: '',
    sourcePlacement: 'MAIN_PROFILE',
    targetKind: 'EXTERNAL_URL',
    targetResourceId: filter.targetResourceId,
    targetType: filter.targetType || 'BUSINESS_CARD',
    targetUrl: ''
  })
  drawerOpen.value = true
}

// openTargetDrawer prepares target migration for the selected ShortLink.
function openTargetDrawer(link: ShortLinkRecord) {
  drawerMode.value = 'target'
  Object.assign(createForm, {
    campaignRef: link.campaignRef ?? '',
    displayName: link.displayName,
    entryPurpose: link.entryPurpose,
    expiresAt: link.expiresAt ?? '',
    sourcePlacement: link.sourcePlacement,
    targetKind: link.targetKind,
    targetResourceId: link.targetResourceId ?? '',
    targetType: link.targetType ?? 'BUSINESS_CARD',
    targetUrl: link.targetUrl ?? ''
  })
  selectedLinkId.value = link.id
  drawerOpen.value = true
}

// submitDrawer creates or migrates a ShortLink target from the drawer form.
async function submitDrawer() {
  if (!activeTenantId.value) return
  saving.value = true
  try {
    const target = buildTarget()
    if (drawerMode.value === 'create') {
      const result = await createPublicEntryShortLinkApi(activeTenantId.value, {
        campaignRef: emptyToUndefined(createForm.campaignRef),
        displayName: createForm.displayName,
        entryPurpose: createForm.entryPurpose,
        expiresAt: emptyToUndefined(createForm.expiresAt),
        sourcePlacement: createForm.sourcePlacement,
        target
      })
      message.success('短链已创建。')
      links.value = [result.shortLink, ...links.value]
      selectedLinkId.value = result.shortLink.id
      await loadSelectedDetail()
    } else if (selectedLink.value) {
      await updatePublicEntryShortLinkTargetApi(activeTenantId.value, selectedLink.value.id, {
        reason: 'Admin updated target from tenant-web',
        target
      })
      message.success('目标已更新。')
      await loadLinks()
    }
    drawerOpen.value = false
  } catch (error) {
    message.error((error as Error).message || '保存失败。')
  } finally {
    saving.value = false
  }
}

// saveMetadata persists lightweight display and attribution changes for the selected link.
async function saveMetadata() {
  if (!activeTenantId.value || !selectedLink.value) return
  saving.value = true
  try {
    await updatePublicEntryShortLinkMetadataApi(activeTenantId.value, selectedLink.value.id, {
      campaignRef: selectedLink.value.campaignRef,
      displayName: selectedLink.value.displayName,
      entryPurpose: selectedLink.value.entryPurpose,
      expiresAt: selectedLink.value.expiresAt,
      sourcePlacement: selectedLink.value.sourcePlacement
    })
    message.success('元数据已保存。')
  } finally {
    saving.value = false
  }
}

// changeStatus applies a governed lifecycle status transition.
async function changeStatus(link: ShortLinkRecord, targetStatus: PublicEntryShortLinkApi.Status) {
  if (!activeTenantId.value) return
  await changePublicEntryShortLinkStatusApi(activeTenantId.value, link.id, {
    reason: `Admin changed status to ${targetStatus}`,
    targetStatus
  })
  message.success('状态已更新。')
  await loadLinks()
}

// confirmArchive asks for confirmation before applying the irreversible Phase 1 archive transition.
function confirmArchive(link: ShortLinkRecord) {
  Modal.confirm({
    content: '归档后 Phase 1 不支持直接恢复为启用状态。',
    okText: '归档',
    title: '归档短链',
    onOk: () => changeStatus(link, 'ARCHIVED')
  })
}

// buildTarget converts form fields into the ShortLink target union expected by BFF.
function buildTarget(): PublicEntryShortLinkApi.ShortLinkTarget {
  if (createForm.targetKind === 'INTERNAL_REF') {
    return {
      targetKind: 'INTERNAL_REF',
      targetResourceId: createForm.targetResourceId,
      targetType: createForm.targetType
    }
  }
  return {
    targetKind: 'EXTERNAL_URL',
    targetUrl: createForm.targetUrl
  }
}

// resolveStatusTagColor returns compact lifecycle status colors for table rows.
function resolveStatusTagColor(status: PublicEntryShortLinkApi.Status) {
  return status === 'ACTIVE' ? 'green' : status === 'DISABLED' ? 'orange' : 'default'
}

// resolveStatusLabel returns localized lifecycle status text.
function resolveStatusLabel(status: PublicEntryShortLinkApi.Status) {
  return status === 'ACTIVE' ? '启用' : status === 'DISABLED' ? '禁用' : '归档'
}

// emptyToUndefined keeps optional payload fields absent instead of sending blank strings.
function emptyToUndefined(value: string) {
  const normalized = value.trim()
  return normalized || undefined
}

onMounted(() => {
  void loadLinks()
})
</script>

<template>
  <Page class="short-link-page" title="公开短链">
    <div class="short-link-page__toolbar">
      <div class="short-link-page__filters">
        <Input v-model:value="filter.targetType" class="short-link-page__filter-input" placeholder="targetType" />
        <Input
          v-model:value="filter.targetResourceId"
          class="short-link-page__filter-input"
          placeholder="targetResourceId"
        />
        <Button :loading="loading" type="primary" @click="loadLinks">
          <template #icon><IconifyIcon icon="lucide:search" /></template>
          查询
        </Button>
      </div>
      <Button type="primary" @click="openCreateDrawer">
        <template #icon><IconifyIcon icon="lucide:plus" /></template>
        创建短链
      </Button>
    </div>

    <Alert v-if="errorMessage" class="short-link-page__alert" :message="errorMessage" show-icon type="error" />

    <div class="short-link-page__layout">
      <section class="short-link-page__list">
        <Table
          :columns="columns"
          :data-source="links"
          :loading="loading"
          :pagination="false"
          :row-key="(record: ShortLinkRecord) => record.id"
          :scroll="{ x: 930 }"
          size="middle"
          @row="(record: ShortLinkRecord) => ({ onClick: () => { selectedLinkId = record.id; void loadSelectedDetail() } })"
        >
          <template #emptyText>
            <Empty description="当前目标下还没有短链" />
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'displayName'">
              <div class="short-link-page__name-cell">
                <strong>{{ record.displayName }}</strong>
                <span>{{ record.publicUrl }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'shortCode'">
              <code>{{ record.shortCode }}</code>
            </template>
            <template v-else-if="column.key === 'target'">
              <span class="short-link-page__target-text">
                {{ record.targetKind === 'EXTERNAL_URL' ? record.targetUrl : `${record.targetType}:${record.targetResourceId}` }}
              </span>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="resolveStatusTagColor(record.status)">{{ resolveStatusLabel(record.status) }}</Tag>
            </template>
            <template v-else-if="column.key === 'operation'">
              <Space>
                <Button size="small" @click.stop="openTargetDrawer(record as ShortLinkRecord)">目标</Button>
                <Button
                  v-if="record.status !== 'ACTIVE'"
                  size="small"
                  @click.stop="changeStatus(record as ShortLinkRecord, 'ACTIVE')"
                >
                  启用
                </Button>
                <Button
                  v-if="record.status === 'ACTIVE'"
                  size="small"
                  @click.stop="changeStatus(record as ShortLinkRecord, 'DISABLED')"
                >
                  禁用
                </Button>
                <Button danger size="small" @click.stop="confirmArchive(record as ShortLinkRecord)">归档</Button>
              </Space>
            </template>
          </template>
        </Table>
      </section>

      <aside class="short-link-page__detail">
        <Skeleton v-if="detailLoading" active />
        <Empty v-else-if="!selectedLink" description="选择一条短链查看详情" />
        <template v-else>
          <div class="short-link-page__detail-header">
            <div>
              <h3>{{ selectedLink.displayName }}</h3>
              <p>{{ selectedLink.publicUrl }}</p>
            </div>
            <Tag :color="resolveStatusTagColor(selectedLink.status)">{{ resolveStatusLabel(selectedLink.status) }}</Tag>
          </div>

          <Descriptions bordered :column="1" size="small">
            <Descriptions.Item label="短码">{{ selectedLink.shortCode }}</Descriptions.Item>
            <Descriptions.Item label="入口用途">
              <Input v-model:value="selectedLink.entryPurpose" />
            </Descriptions.Item>
            <Descriptions.Item label="放置位置">
              <Input v-model:value="selectedLink.sourcePlacement" />
            </Descriptions.Item>
            <Descriptions.Item label="活动引用">
              <Input v-model:value="selectedLink.campaignRef" />
            </Descriptions.Item>
            <Descriptions.Item label="过期时间">
              <Input v-model:value="selectedLink.expiresAt" placeholder="2026-11-30T23:59:59Z" />
            </Descriptions.Item>
          </Descriptions>

          <Button class="short-link-page__save-button" :loading="saving" type="primary" @click="saveMetadata">
            保存元数据
          </Button>

          <div class="short-link-page__stats">
            <Statistic title="总访问" :value="stats?.totalVisits ?? 0" />
            <Statistic title="最近访问" :value="stats?.lastVisitedAt || '-'" />
          </div>

          <div class="short-link-page__qr">
            <QRCode v-if="qr?.content" :value="qr.content" />
            <img v-if="qrImageSrc" :src="qrImageSrc" alt="ShortLink QR code" />
            <a v-if="qrDownloadUrl" :href="qrDownloadUrl" download>下载二维码 PNG</a>
          </div>
        </template>
      </aside>
    </div>

    <Drawer
      v-model:open="drawerOpen"
      :title="drawerMode === 'create' ? '创建 ShortLink' : '更新目标'"
      width="520"
    >
      <Form layout="vertical">
        <Form.Item v-if="drawerMode === 'create'" label="名称" required>
          <Input v-model:value="createForm.displayName" />
        </Form.Item>
        <Form.Item v-if="drawerMode === 'create'" label="入口用途" required>
          <Input v-model:value="createForm.entryPurpose" />
        </Form.Item>
        <Form.Item v-if="drawerMode === 'create'" label="放置位置" required>
          <Input v-model:value="createForm.sourcePlacement" />
        </Form.Item>
        <Form.Item label="Target Kind" required>
          <Select
            v-model:value="createForm.targetKind"
            :options="[
              { label: 'EXTERNAL_URL', value: 'EXTERNAL_URL' },
              { label: 'INTERNAL_REF', value: 'INTERNAL_REF' }
            ]"
          />
        </Form.Item>
        <template v-if="createForm.targetKind === 'EXTERNAL_URL'">
          <Form.Item label="HTTPS URL" required>
            <Input v-model:value="createForm.targetUrl" placeholder="https://example.com/page" />
          </Form.Item>
        </template>
        <template v-else>
          <Form.Item label="targetType" required>
            <Input v-model:value="createForm.targetType" />
          </Form.Item>
          <Form.Item label="targetResourceId" required>
            <Input v-model:value="createForm.targetResourceId" />
          </Form.Item>
        </template>
        <Form.Item v-if="drawerMode === 'create'" label="campaignRef">
          <Input v-model:value="createForm.campaignRef" />
        </Form.Item>
        <Form.Item v-if="drawerMode === 'create'" label="expiresAt">
          <Input v-model:value="createForm.expiresAt" placeholder="2026-11-30T23:59:59Z" />
        </Form.Item>
      </Form>
      <template #footer>
        <Space>
          <Button @click="drawerOpen = false">取消</Button>
          <Button :loading="saving" type="primary" @click="submitDrawer">保存</Button>
        </Space>
      </template>
    </Drawer>
  </Page>
</template>

<style scoped>
.short-link-page {
  --short-link-border: #e5e7eb;
}

.short-link-page__toolbar {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 16px;
}

.short-link-page__filters {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.short-link-page__filter-input {
  max-width: 260px;
  min-width: 190px;
}

.short-link-page__alert {
  margin-bottom: 16px;
}

.short-link-page__layout {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr) 380px;
}

.short-link-page__list,
.short-link-page__detail {
  background: #fff;
  border: 1px solid var(--short-link-border);
  border-radius: 8px;
  min-width: 0;
  padding: 16px;
}

.short-link-page__name-cell {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.short-link-page__name-cell span,
.short-link-page__target-text,
.short-link-page__detail-header p {
  color: #64748b;
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.short-link-page__detail {
  align-self: start;
}

.short-link-page__detail-header {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 14px;
}

.short-link-page__detail-header h3 {
  font-size: 18px;
  font-weight: 650;
  line-height: 1.35;
  margin: 0 0 4px;
}

.short-link-page__save-button {
  margin: 14px 0;
  width: 100%;
}

.short-link-page__stats {
  border-top: 1px solid var(--short-link-border);
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
  margin-top: 4px;
  padding-top: 14px;
}

.short-link-page__qr {
  align-items: center;
  border-top: 1px solid var(--short-link-border);
  display: grid;
  gap: 12px;
  justify-items: center;
  margin-top: 14px;
  padding-top: 14px;
}

.short-link-page__qr img {
  height: 152px;
  width: 152px;
}

@media (max-width: 1080px) {
  .short-link-page__layout {
    grid-template-columns: 1fr;
  }

  .short-link-page__toolbar {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
