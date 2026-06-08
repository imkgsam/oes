<script setup lang="ts">
import type { PublicEntryBusinessCardApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, reactive, ref } from 'vue'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import { Alert, Button, Descriptions, Drawer, Empty, Form, Input, QRCode, Skeleton, Space, Statistic, Table, Tag, message } from 'ant-design-vue'

import {
  bindBusinessCardPublicEntryApi,
  disableBusinessCardApi,
  enableBusinessCardApi,
  ensurePrimaryBusinessCardApi,
  getBusinessCardDetailApi,
  getBusinessCardVisitSummaryApi,
  listBusinessCardsApi,
  updateBusinessCardContactActionsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type BusinessCardRecord = PublicEntryBusinessCardApi.BusinessCardRecord
type ContactActionConfig = PublicEntryBusinessCardApi.ContactActionConfig

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const cards = ref<BusinessCardRecord[]>([])
const selectedCardId = ref('')
const detail = ref<PublicEntryBusinessCardApi.DetailResult | null>(null)
const visits = ref<PublicEntryBusinessCardApi.VisitSummary | null>(null)
const loading = ref(false)
const detailLoading = ref(false)
const actionSaving = ref(false)
const drawerOpen = ref(false)
const errorMessage = ref('')
const ensureForm = reactive({ employeeId: '' })
const actionForm = ref<ContactActionConfig[]>([])

const selectedCard = computed(() => detail.value?.businessCard ?? cards.value.find((card) => card.businessCardId === selectedCardId.value) ?? null)
const readinessReasons = computed(() => detail.value?.readiness?.reasons ?? [])
const publicUrl = computed(() => selectedCard.value?.publicEntryRef?.publicUrl ?? '')

const columns = computed<TableColumnsType<BusinessCardRecord>>(() => [
  { key: 'employeeId', title: '员工', width: 180 },
  { key: 'status', title: '状态', width: 120 },
  { key: 'publicEntry', title: '公开入口', width: 240 },
  { key: 'updatedAt', title: '更新', width: 180 },
  { key: 'operation', title: '操作', width: 260 }
])

// loadCards refreshes the tenant BusinessCard list and selected detail.
async function loadCards() {
  if (!activeTenantId.value) {
    errorMessage.value = '当前会话缺少租户上下文。'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listBusinessCardsApi(activeTenantId.value, { page: 1, pageSize: 50 })
    cards.value = result.items ?? []
    selectedCardId.value = selectedCardId.value || cards.value[0]?.businessCardId || ''
    await loadDetail()
  } catch (error) {
    errorMessage.value = (error as Error).message || '名片列表加载失败。'
  } finally {
    loading.value = false
  }
}

// loadDetail refreshes readiness diagnostics and visit summary for the selected card.
async function loadDetail() {
  if (!activeTenantId.value || !selectedCardId.value) {
    detail.value = null
    visits.value = null
    return
  }
  detailLoading.value = true
  try {
    const [detailResult, visitResult] = await Promise.all([
      getBusinessCardDetailApi(activeTenantId.value, selectedCardId.value),
      getBusinessCardVisitSummaryApi(activeTenantId.value, selectedCardId.value).catch(() => null)
    ])
    detail.value = detailResult
    visits.value = visitResult
    actionForm.value = cloneActions(detailResult.businessCard?.contactActionConfigs ?? [])
  } finally {
    detailLoading.value = false
  }
}

// ensureCard creates or loads the primary card for one employee.
async function ensureCard() {
  if (!activeTenantId.value || !ensureForm.employeeId.trim()) return
  actionSaving.value = true
  try {
    const result = await ensurePrimaryBusinessCardApi(activeTenantId.value, ensureForm.employeeId.trim())
    selectedCardId.value = result.businessCard?.businessCardId ?? ''
    ensureForm.employeeId = ''
    message.success('员工主名片已就绪')
    await loadCards()
  } finally {
    actionSaving.value = false
  }
}

// bindPublicEntry binds the card to its main ShortLink public entry.
async function bindPublicEntry() {
  if (!activeTenantId.value || !selectedCardId.value) return
  actionSaving.value = true
  try {
    await bindBusinessCardPublicEntryApi(activeTenantId.value, selectedCardId.value)
    message.success('公开入口已刷新')
    await loadDetail()
  } finally {
    actionSaving.value = false
  }
}

// changeCardStatus runs one explicit lifecycle command.
async function changeCardStatus(target: 'ACTIVE' | 'DISABLED') {
  if (!activeTenantId.value || !selectedCardId.value) return
  actionSaving.value = true
  try {
    if (target === 'ACTIVE') await enableBusinessCardApi(activeTenantId.value, selectedCardId.value)
    else await disableBusinessCardApi(activeTenantId.value, selectedCardId.value)
    message.success(target === 'ACTIVE' ? '名片已启用' : '名片已禁用')
    await loadCards()
  } finally {
    actionSaving.value = false
  }
}

// openActionDrawer prepares Contact Action editing from current detail.
function openActionDrawer() {
  actionForm.value = cloneActions(selectedCard.value?.contactActionConfigs ?? defaultActions())
  drawerOpen.value = true
}

// saveActions replaces Contact Action config without storing contact values.
async function saveActions() {
  if (!activeTenantId.value || !selectedCardId.value) return
  actionSaving.value = true
  try {
    await updateBusinessCardContactActionsApi(activeTenantId.value, selectedCardId.value, {
      contactActionConfigs: cloneActions(actionForm.value),
      visibilityConfig: selectedCard.value?.visibilityConfig
    })
    drawerOpen.value = false
    message.success('联系动作已保存')
    await loadDetail()
  } finally {
    actionSaving.value = false
  }
}

function selectCard(card: BusinessCardRecord | Record<string, any>) {
  selectedCardId.value = card.businessCardId
  void loadDetail()
}

function cloneActions(actions: ContactActionConfig[]) {
  return actions.map((action) => ({ ...action }))
}

function defaultActions(): ContactActionConfig[] {
  return [
    { contactActionType: 'CALL_PHONE', displayOrder: 10, enabled: true, includeInVCard: true, targetRefId: '', targetRefType: 'CONTACT_ASSET', visibility: 'PUBLIC' },
    { contactActionType: 'SEND_EMAIL', displayOrder: 20, enabled: true, includeInVCard: true, targetRefId: '', targetRefType: 'CONTACT_ASSET', visibility: 'PUBLIC' },
    { contactActionType: 'SAVE_VCARD', displayOrder: 30, enabled: true, includeInVCard: false, targetRefId: null, targetRefType: 'NONE', visibility: 'PUBLIC' }
  ]
}

function statusColor(status?: string) {
  return status === 'ACTIVE' ? 'green' : status === 'DISABLED' ? 'orange' : status === 'ARCHIVED' ? 'default' : 'blue'
}

onMounted(loadCards)
</script>

<template>
  <Page title="员工数字名片">
    <div class="business-card-admin">
      <Alert v-if="errorMessage" :message="errorMessage" show-icon type="error" />
      <section class="business-card-admin__toolbar">
        <Form layout="inline" @submit.prevent="ensureCard">
          <Form.Item label="员工 ID">
            <Input v-model:value="ensureForm.employeeId" placeholder="emp_001" />
          </Form.Item>
          <Button :loading="actionSaving" type="primary" @click="ensureCard">
            <template #icon><IconifyIcon icon="lucide:badge-plus" /></template>
            创建/加载主名片
          </Button>
        </Form>
      </section>

      <section class="business-card-admin__grid">
        <div class="business-card-admin__list">
          <Table :columns="columns" :data-source="cards" :loading="loading" :pagination="false" row-key="businessCardId">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'employeeId'">
                <button class="business-card-admin__link" type="button" @click="selectCard(record)"> {{ record.employeeId }} </button>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="statusColor(record.status)">{{ record.status }}</Tag>
              </template>
              <template v-else-if="column.key === 'publicEntry'">
                <span>{{ record.publicEntryRef?.shortCode || '未绑定' }}</span>
              </template>
              <template v-else-if="column.key === 'operation'">
                <Space>
                  <Button size="small" @click="selectCard(record)">详情</Button>
                  <Button size="small" @click="selectedCardId = record.businessCardId; bindPublicEntry()">入口</Button>
                </Space>
              </template>
            </template>
          </Table>
        </div>

        <aside class="business-card-admin__detail">
          <Skeleton v-if="detailLoading" active />
          <Empty v-else-if="!selectedCard" description="选择一张名片查看配置" />
          <template v-else>
            <div class="business-card-admin__detail-head">
              <div>
                <p class="business-card-admin__eyebrow">BusinessCard</p>
                <h2>{{ selectedCard.employeeId }}</h2>
              </div>
              <Tag :color="statusColor(selectedCard.status)">{{ selectedCard.status }}</Tag>
            </div>
            <Descriptions :column="1" size="small">
              <Descriptions.Item label="模板">{{ selectedCard.templateKey }}</Descriptions.Item>
              <Descriptions.Item label="公开 URL">{{ publicUrl || '未绑定' }}</Descriptions.Item>
              <Descriptions.Item label="Readiness">{{ readinessReasons.join(', ') || 'READY' }}</Descriptions.Item>
            </Descriptions>
            <div class="business-card-admin__stats">
              <Statistic title="总访问" :value="visits?.totalVisits ?? 0" />
              <Statistic title="动作数" :value="selectedCard.contactActionConfigs.length" />
            </div>
            <div v-if="publicUrl" class="business-card-admin__qr">
              <QRCode :value="publicUrl" :size="132" />
              <a :href="publicUrl" rel="noreferrer" target="_blank">{{ publicUrl }}</a>
            </div>
            <Space wrap>
              <Button :loading="actionSaving" @click="bindPublicEntry">绑定/刷新入口</Button>
              <Button @click="openActionDrawer">配置动作</Button>
              <Button :loading="actionSaving" type="primary" @click="changeCardStatus('ACTIVE')">启用</Button>
              <Button :loading="actionSaving" danger @click="changeCardStatus('DISABLED')">禁用</Button>
            </Space>
          </template>
        </aside>
      </section>
    </div>

    <Drawer v-model:open="drawerOpen" title="Contact Actions" width="560">
      <div class="business-card-admin__actions">
        <section v-for="(action, index) in actionForm" :key="`${action.contactActionType}-${index}`" class="business-card-admin__action-row">
          <Tag>{{ action.contactActionType }}</Tag>
          <Input
            :disabled="action.targetRefType === 'NONE'"
            :value="action.targetRefId ?? ''"
            placeholder="Contact Asset ID"
            @update:value="(value: string) => action.targetRefId = value"
          />
          <Input v-model:value.number="action.displayOrder" type="number" />
          <Button size="small" @click="action.enabled = !action.enabled">{{ action.enabled ? '启用' : '隐藏' }}</Button>
        </section>
      </div>
      <template #footer>
        <Space>
          <Button @click="drawerOpen = false">取消</Button>
          <Button :loading="actionSaving" type="primary" @click="saveActions">保存</Button>
        </Space>
      </template>
    </Drawer>
  </Page>
</template>

<style scoped>
.business-card-admin {
  display: grid;
  gap: 16px;
}
.business-card-admin__toolbar,
.business-card-admin__detail,
.business-card-admin__list {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}
.business-card-admin__grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1.6fr) minmax(340px, 0.9fr);
}
.business-card-admin__detail {
  display: grid;
  gap: 16px;
}
.business-card-admin__detail-head {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
}
.business-card-admin__detail-head h2 {
  color: #111827;
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}
.business-card-admin__eyebrow {
  color: #6b7280;
  font-size: 12px;
  margin: 0 0 4px;
}
.business-card-admin__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.business-card-admin__qr {
  align-items: center;
  display: grid;
  gap: 12px;
  justify-items: start;
  overflow-wrap: anywhere;
}
.business-card-admin__link {
  color: #155e75;
  font-weight: 600;
}
.business-card-admin__actions {
  display: grid;
  gap: 12px;
}
.business-card-admin__action-row {
  align-items: center;
  border-bottom: 1px solid #eef2f7;
  display: grid;
  gap: 8px;
  grid-template-columns: 150px 1fr 88px 72px;
  padding-bottom: 12px;
}
@media (max-width: 960px) {
  .business-card-admin__grid {
    grid-template-columns: 1fr;
  }
}
</style>
