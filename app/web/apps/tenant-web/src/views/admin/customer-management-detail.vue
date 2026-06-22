<script setup lang="ts">
import type { CustomerManagementApi } from '#/api'

import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Dropdown,
  Empty,
  Menu,
  Modal,
  Row,
  Skeleton,
  Tabs,
  Tag,
  Timeline,
  TimelineItem,
  message
} from 'ant-design-vue'

import {
  claimCrmAccountApi,
  convertLeadToProspectCustomerApi,
  deleteDraftLeadApi,
  getCrmAccountApi,
  submitDraftLeadApi
} from '#/api'
import NotesTab from '#/components/collaboration-panel/NotesTab.vue'
import { useAuthContextStore } from '#/store/auth-context'

const fallbackMessages = {
  back: '返回客户资源',
  bound: '已绑定主体',
  claim: '认领',
  claimFailed: '认领失败',
  claimSuccess: '已认领',
  collaboration: '协作',
  contact: '联系方式',
  convert: '转为潜在客户',
  convertFailed: 'Lead 正式化失败',
  country: '国家/地区',
  createdAt: '创建时间',
  createdBy: '创建人',
  createdByNameMissing: '未命名创建人',
  deleteDraft: '删除草稿',
  deleteDraftConfirm: '删除后该草稿及来源记录会被硬删除，不能恢复。',
  deleteDraftFailed: '草稿删除失败',
  deleteDraftSuccess: '草稿已删除',
  detailLoadFailed: 'CRM 详情加载失败',
  domain: '域名',
  email: '邮箱',
  followUpSummary: '跟进摘要',
  identifiers: '识别信息',
  lifecycle: '阶段',
  leadInfo: 'Lead 信息',
  moreActions: '更多操作',
  nextFollowUpAt: '下次跟进',
  noContacts: '暂无联系人',
  noSourceRecords: '暂无来源记录',
  notes: '备注',
  overview: '概览',
  owner: '负责人',
  ownerNameMissing: '未命名负责人',
  partyBinding: '主体绑定',
  partyType: '主体类型',
  phone: '电话',
  priority: '优先级',
  sourceRecords: '来源记录',
  submitDraft: '提交 Lead',
  submitDraftFailed: '草稿提交失败',
  submitDraftSuccess: '草稿已提交',
  summary: '责任摘要',
  title: '客户资源详情',
  unbound: '未绑定主体',
  updatedAt: '更新时间',
  whatsapp: 'WhatsApp'
}

const authContextStore = useAuthContextStore()
const route = useRoute()
const router = useRouter()

const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const crmAccountId = computed(() => `${route.params.crmAccountId ?? ''}`)
const canViewAccount = computed(() => authContextStore.actionCodes.includes('crm.account.read'))
const canConvertAccount = computed(() => authContextStore.actionCodes.includes('crm.account.convert'))
const canClaimAccount = computed(() => authContextStore.actionCodes.includes('crm.account.claim'))
const canManageAccount = computed(() => authContextStore.actionCodes.includes('crm.account.manage'))
const canUpdateLead = computed(() => authContextStore.actionCodes.includes('crm.account.update'))

const account = ref<CustomerManagementApi.CrmAccount | null>(null)
const loading = ref(false)
const actionLoading = ref('')
const errorMessage = ref('')
const activeTab = ref('overview')
const collaborationPanelOpen = ref(false)

const pageTitle = computed(() => account.value?.displayName || fallbackMessages.title)
const ownerLabel = computed(() => {
  const ownerDisplayName = account.value?.ownerDisplayName?.trim()
  if (ownerDisplayName) {
    return ownerDisplayName
  }

  return account.value?.ownerAccountId?.trim() ? fallbackMessages.ownerNameMissing : '-'
})
const bindingLabel = computed(() =>
  account.value?.tenantPartyId ? fallbackMessages.bound : fallbackMessages.unbound
)
const createdByLabel = computed(() => {
  const displayName = account.value?.createdByDisplayName?.trim()
  if (displayName) {
    return displayName
  }

  return account.value?.createdBy?.trim() ? fallbackMessages.createdByNameMissing : '-'
})
const accountInitials = computed(() => {
  const title = pageTitle.value.trim()
  if (!title || title === fallbackMessages.title) return 'CRM'
  const words = title.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase()
  }
  return title.slice(0, 2).toUpperCase()
})
const canConvertCurrentAccount = computed(
  () =>
    Boolean(account.value) &&
    canConvertAccount.value &&
    account.value!.recordStatus === 'ACTIVE' &&
    account.value!.lifecycleStage === 'LEAD' &&
    (Boolean(account.value!.ownerAccountId) || canManageAccount.value)
)
const canClaimCurrentAccount = computed(
  () =>
    Boolean(account.value) &&
    canClaimAccount.value &&
    account.value!.recordStatus === 'ACTIVE' &&
    !account.value!.ownerAccountId
)
const canSubmitCurrentDraft = computed(
  () => Boolean(account.value) && canUpdateLead.value && account.value!.recordStatus === 'DRAFT'
)
const hasSecondaryActions = computed(
  () => canClaimCurrentAccount.value || canSubmitCurrentDraft.value
)
const collaborationContext = computed(() => {
  if (!account.value) return null
  return {
    archived: Boolean(account.value.archivedAt) || account.value.recordStatus === 'ARCHIVED',
    displayName: account.value.displayName,
    objectRef: {
      objectOwnerService: 'crm-service',
      objectType: 'CrmAccount',
      objectId: account.value.crmAccountId
    }
  }
})

/** loadAccount reads the latest CRM P1 account detail for this route. */
async function loadAccount() {
  if (!activeTenantId.value || !crmAccountId.value || !canViewAccount.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    account.value = await getCrmAccountApi(activeTenantId.value, crmAccountId.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : fallbackMessages.detailLoadFailed
  } finally {
    loading.value = false
  }
}

/** goBack returns to the CRM customer resource workspace without changing the menu entry. */
async function goBack() {
  await router.push({ name: 'TenantCrmAccounts' })
}

/** convertLead formalizes the current Lead and refreshes the independent detail page. */
async function convertLead() {
  if (!activeTenantId.value || !account.value || !canConvertCurrentAccount.value) {
    return
  }

  actionLoading.value = 'convert'
  errorMessage.value = ''
  try {
    const result = await convertLeadToProspectCustomerApi(activeTenantId.value, account.value.crmAccountId)
    if (result.crmAccount) {
      account.value = result.crmAccount
    } else {
      await loadAccount()
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : fallbackMessages.convertFailed
  } finally {
    actionLoading.value = ''
  }
}

/** claimAccount assigns one ownerless Pool record to the current operator. */
async function claimAccount() {
  if (!activeTenantId.value || !account.value || !canClaimCurrentAccount.value) {
    return
  }

  actionLoading.value = 'claim'
  errorMessage.value = ''
  try {
    account.value = await claimCrmAccountApi(activeTenantId.value, account.value.crmAccountId)
    message.success(fallbackMessages.claimSuccess)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : fallbackMessages.claimFailed
  } finally {
    actionLoading.value = ''
  }
}

/** submitDraft promotes the current draft lead to an active Lead and refreshes detail state. */
async function submitDraft() {
  if (!activeTenantId.value || !account.value || !canSubmitCurrentDraft.value) {
    return
  }

  actionLoading.value = 'submitDraft'
  errorMessage.value = ''
  try {
    const result = await submitDraftLeadApi(activeTenantId.value, account.value.crmAccountId, {})
    if (result.crmAccount) {
      account.value = result.crmAccount
    }
    message.success(fallbackMessages.submitDraftSuccess)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : fallbackMessages.submitDraftFailed
  } finally {
    actionLoading.value = ''
  }
}

/** confirmDeleteDraft asks before hard-deleting the current draft Lead. */
function confirmDeleteDraft() {
  if (!account.value) {
    return
  }

  Modal.confirm({
    content: fallbackMessages.deleteDraftConfirm,
    okButtonProps: { danger: true },
    okText: fallbackMessages.deleteDraft,
    title: fallbackMessages.deleteDraft,
    onOk: deleteDraft
  })
}

/** deleteDraft hard-deletes the draft Lead and returns to the account workspace. */
async function deleteDraft() {
  if (!activeTenantId.value || !account.value || !canSubmitCurrentDraft.value) {
    return
  }

  actionLoading.value = 'deleteDraft'
  errorMessage.value = ''
  try {
    await deleteDraftLeadApi(activeTenantId.value, account.value.crmAccountId)
    message.success(fallbackMessages.deleteDraftSuccess)
    await goBack()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : fallbackMessages.deleteDraftFailed
  } finally {
    actionLoading.value = ''
  }
}

/** stageLabel maps CRM lifecycle values into concise operational labels. */
function stageLabel(stage?: string) {
  if (stage === 'PROSPECT_CUSTOMER') return '潜在客户'
  if (stage === 'CUSTOMER') return '客户'
  return 'Lead'
}

/** stageColor keeps CRM lifecycle tags aligned with Ant Design status color usage. */
function stageColor(stage?: string) {
  if (stage === 'PROSPECT_CUSTOMER') return 'blue'
  if (stage === 'CUSTOMER') return 'green'
  return 'gold'
}

/** partyTypeLabel maps compact CRM party hints into readable labels. */
function partyTypeLabel(type?: string) {
  if (type === 'ORGANIZATION') return '组织'
  if (type === 'PERSON') return '个人'
  return '未知'
}

/** formatDateTime keeps optional timestamps compact in CRM detail descriptions. */
function formatDateTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}

/** formatLeadIdentifiers renders lead identifier evidence without exposing raw JSON structure. */
function formatLeadIdentifiers(values: CustomerManagementApi.CrmLeadIdentifier[]) {
  if (!values.length) return '-'
  return values
    .map((identifier) => `${identifier.identifierType}:${identifier.normalizedValue}`)
    .join(' / ')
}

onMounted(() => {
  void loadAccount()
})
</script>

<template>
  <Page :title="fallbackMessages.title">
    <div class="crm-account-detail">
      <Card class="crm-account-detail__hero" :bordered="false">
        <Skeleton v-if="loading && !account" active />
        <template v-else-if="account">
          <div class="crm-account-detail__topbar">
            <Button data-testid="crm-account-detail-back" @click="goBack">
              <template #icon>
                <IconifyIcon icon="lucide:arrow-left" />
              </template>
              {{ fallbackMessages.back }}
            </Button>
            <div class="crm-account-detail__actions">
              <Dropdown v-if="hasSecondaryActions" :trigger="['click']">
                <Button data-testid="crm-account-detail-more-actions">
                  {{ fallbackMessages.moreActions }}
                  <template #icon>
                    <IconifyIcon icon="lucide:chevron-down" />
                  </template>
                </Button>
                <template #overlay>
                  <Menu>
                    <Menu.Item
                      v-if="canClaimCurrentAccount"
                      key="claim"
                      data-testid="crm-account-detail-claim"
                      :disabled="actionLoading === 'claim'"
                      @click="claimAccount"
                    >
                      {{ fallbackMessages.claim }}
                    </Menu.Item>
                    <Menu.Item
                      v-if="canSubmitCurrentDraft"
                      key="submitDraft"
                      data-testid="crm-account-detail-submit-draft"
                      :disabled="actionLoading === 'submitDraft'"
                      @click="submitDraft"
                    >
                      {{ fallbackMessages.submitDraft }}
                    </Menu.Item>
                    <Menu.Item
                      v-if="canSubmitCurrentDraft"
                      key="deleteDraft"
                      danger
                      data-testid="crm-account-detail-delete-draft"
                      :disabled="actionLoading === 'deleteDraft'"
                      @click="confirmDeleteDraft"
                    >
                      {{ fallbackMessages.deleteDraft }}
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
              <Button
                v-if="canConvertCurrentAccount"
                data-testid="crm-account-detail-convert"
                :loading="actionLoading === 'convert'"
                type="primary"
                @click="convertLead"
              >
                {{ fallbackMessages.convert }}
              </Button>
            </div>
          </div>

          <div class="crm-account-detail__identity">
            <Avatar class="crm-account-detail__avatar" shape="square" :size="48">
              {{ accountInitials }}
            </Avatar>
            <div class="crm-account-detail__identity-main">
              <div class="crm-account-detail__breadcrumb">CRM / 客户资源 / {{ pageTitle }}</div>
              <h2>{{ pageTitle }}</h2>
              <div class="crm-account-detail__tags">
                <Tag :color="stageColor(account.lifecycleStage)">{{ stageLabel(account.lifecycleStage) }}</Tag>
                <Tag color="processing">{{ fallbackMessages.priority }} {{ account.priority || '-' }}</Tag>
                <Tag :color="account.recordStatus === 'DRAFT' ? 'default' : 'success'">
                  {{ account.recordStatus }}
                </Tag>
              </div>
              <div class="crm-account-detail__meta">
                <span>账号 ID {{ account.crmAccountId }}</span>
                <span>{{ fallbackMessages.country }} {{ account.leadCountry || '-' }}</span>
                <span>{{ fallbackMessages.createdAt }} {{ formatDateTime(account.createdAt) }}</span>
              </div>
            </div>
          </div>
        </template>
        <Empty v-else :description="errorMessage || fallbackMessages.detailLoadFailed" />
      </Card>

      <Alert
        v-if="errorMessage"
        class="crm-account-detail__alert"
        :message="errorMessage"
        show-icon
        type="error"
      />

      <Row v-if="account" :gutter="[16, 16]">
        <Col :lg="16" :span="24">
          <Card class="crm-account-detail__section" :bordered="false">
            <Tabs v-model:active-key="activeTab" class="crm-account-detail__tabs">
              <template #rightExtra>
                <div v-if="collaborationContext" class="crm-account-detail__tab-actions">
                  <Button
                    class="crm-account-detail__notes-trigger"
                    data-testid="collaboration-panel-open"
                    @click="collaborationPanelOpen = true"
                  >
                    <template #icon>
                      <IconifyIcon icon="ant-design:message-outlined" />
                    </template>
                    {{ fallbackMessages.notes }}
                  </Button>
                </div>
              </template>

              <Tabs.TabPane key="overview" :tab="fallbackMessages.overview">
                <div class="crm-account-detail__tab-stack">
                  <section>
                    <h3>{{ fallbackMessages.leadInfo }}</h3>
                    <Descriptions bordered :column="{ xs: 1, sm: 2, md: 2 }" size="small">
                      <DescriptionsItem label="显示名称">{{ account.displayName || '-' }}</DescriptionsItem>
                      <DescriptionsItem label="公司">{{ account.leadCompanyName || '-' }}</DescriptionsItem>
                      <DescriptionsItem label="联系人">{{ account.leadPersonName || '-' }}</DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.partyType">
                        {{ partyTypeLabel(account.partyTypeHint) }}
                      </DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.country">{{ account.leadCountry || '-' }}</DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.domain">{{ account.leadDomain || '-' }}</DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.email">{{ account.leadEmail || '-' }}</DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.phone">{{ account.leadPhone || '-' }}</DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.whatsapp">{{ account.leadWhatsapp || '-' }}</DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.identifiers">
                        {{ formatLeadIdentifiers(account.leadIdentifiers) }}
                      </DescriptionsItem>
                    </Descriptions>
                  </section>

                  <section>
                    <h3>{{ fallbackMessages.summary }}</h3>
                    <Descriptions bordered :column="{ xs: 1, sm: 2, md: 2 }" size="small">
                      <DescriptionsItem :label="fallbackMessages.lifecycle">
                        {{ stageLabel(account.lifecycleStage) }}
                      </DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.owner">{{ ownerLabel }}</DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.partyBinding">
                        {{ bindingLabel }}
                      </DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.nextFollowUpAt">
                        {{ formatDateTime(account.nextFollowUpAt) }}
                      </DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.createdBy">{{ createdByLabel }}</DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.createdAt">
                        {{ formatDateTime(account.createdAt) }}
                      </DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.updatedAt">
                        {{ formatDateTime(account.updatedAt) }}
                      </DescriptionsItem>
                    </Descriptions>
                  </section>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane key="source" :tab="fallbackMessages.sourceRecords">
                <Empty :description="fallbackMessages.noSourceRecords" />
              </Tabs.TabPane>

              <Tabs.TabPane key="contact" :tab="fallbackMessages.contact">
                <Empty :description="fallbackMessages.noContacts" />
              </Tabs.TabPane>

              <Tabs.TabPane key="activity" tab="跟进动态">
                <Timeline>
                  <TimelineItem>
                    <strong>{{ fallbackMessages.createdAt }}</strong>
                    <p>{{ formatDateTime(account.createdAt) }}</p>
                  </TimelineItem>
                  <TimelineItem v-if="account.nextFollowUpAt">
                    <strong>{{ fallbackMessages.nextFollowUpAt }}</strong>
                    <p>{{ formatDateTime(account.nextFollowUpAt) }}</p>
                  </TimelineItem>
                </Timeline>
              </Tabs.TabPane>

            </Tabs>
          </Card>
        </Col>

        <Col :lg="8" :span="24">
          <div class="crm-account-detail__side">
            <Card class="crm-account-detail__section" :bordered="false" :title="fallbackMessages.followUpSummary">
              <Timeline>
                <TimelineItem>
                  <strong>{{ fallbackMessages.createdAt }}</strong>
                  <p>{{ formatDateTime(account.createdAt) }}</p>
                </TimelineItem>
                <TimelineItem v-if="account.nextFollowUpAt">
                  <strong>{{ fallbackMessages.nextFollowUpAt }}</strong>
                  <p>{{ formatDateTime(account.nextFollowUpAt) }}</p>
                </TimelineItem>
              </Timeline>
            </Card>
          </div>
        </Col>
      </Row>

      <Drawer
        v-if="collaborationContext"
        v-model:open="collaborationPanelOpen"
        class="collaboration-panel"
        destroy-on-close
        placement="right"
        :title="collaborationContext.displayName || fallbackMessages.collaboration"
        width="min(460px, 100vw)"
      >
        <NotesTab :object-context="collaborationContext" />
      </Drawer>
    </div>
  </Page>
</template>

<style scoped>
.crm-account-detail {
  --crm-detail-bg: hsl(var(--card));
  --crm-detail-border: hsl(var(--border));
  --crm-detail-muted: hsl(var(--muted-foreground));
  --crm-detail-panel: hsl(var(--muted) / 0.34);
  --crm-detail-text: hsl(var(--foreground) / 0.92);

  display: grid;
  gap: 16px;
  max-width: 100%;
  min-width: 0;
}

.crm-account-detail__hero,
.crm-account-detail__section {
  border: 1px solid var(--crm-detail-border);
  background: var(--crm-detail-bg);
  box-shadow: 0 10px 30px rgb(15 23 42 / 0.04);
}

.crm-account-detail__hero :deep(.ant-card-body),
.crm-account-detail__section :deep(.ant-card-body) {
  padding: 20px;
}

.crm-account-detail__topbar,
.crm-account-detail__identity,
.crm-account-detail__tags {
  display: flex;
  align-items: center;
}

.crm-account-detail__topbar {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.crm-account-detail__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  min-width: 0;
}

.crm-account-detail__identity {
  align-items: flex-start;
  justify-content: flex-start;
  gap: 16px;
}

.crm-account-detail__avatar {
  flex: 0 0 auto;
  background: hsl(var(--primary) / 0.12);
  color: hsl(var(--primary));
  font-weight: 700;
}

.crm-account-detail__identity-main {
  flex: 1;
  min-width: 0;
}

.crm-account-detail__identity h2 {
  margin: 4px 0 10px;
  color: var(--crm-detail-text);
  font-size: 24px;
  font-weight: 700;
}

.crm-account-detail__breadcrumb {
  color: var(--crm-detail-muted);
  font-size: 13px;
}

.crm-account-detail__tags {
  flex-wrap: wrap;
  gap: 6px;
}

.crm-account-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 10px;
  color: var(--crm-detail-muted);
  font-size: 13px;
}

.crm-account-detail__alert {
  margin: 0;
}

.crm-account-detail__tabs {
  min-width: 0;
}

.crm-account-detail__tabs :deep(.ant-tabs-nav) {
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.crm-account-detail__tabs :deep(.ant-tabs-extra-content) {
  align-items: flex-start;
  display: flex;
  padding-left: 12px;
}

.crm-account-detail__tab-actions {
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.crm-account-detail__notes-trigger {
  border-color: hsl(var(--primary) / 0.26);
  border-radius: 8px;
  color: hsl(var(--primary));
  font-weight: 500;
  min-width: 86px;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.crm-account-detail__notes-trigger:hover,
.crm-account-detail__notes-trigger:focus-visible {
  border-color: hsl(var(--primary) / 0.5);
  background: hsl(var(--primary) / 0.06);
  color: hsl(var(--primary));
}

.crm-account-detail__notes-trigger:active {
  transform: translateY(1px);
}

.crm-account-detail__tab-stack {
  display: grid;
  gap: 18px;
}

.crm-account-detail__tab-stack h3 {
  margin: 0 0 12px;
  color: var(--crm-detail-text);
  font-size: 15px;
  font-weight: 700;
}

.crm-account-detail__side {
  position: sticky;
  top: 76px;
  display: grid;
  gap: 16px;
}

@media (max-width: 991px) {
  .crm-account-detail__topbar,
  .crm-account-detail__identity {
    align-items: stretch;
    flex-direction: column;
  }

  .crm-account-detail__actions {
    justify-content: flex-start;
  }

  .crm-account-detail__tabs :deep(.ant-tabs-nav) {
    gap: 8px;
  }

  .crm-account-detail__tabs :deep(.ant-tabs-extra-content) {
    padding-left: 0;
  }

  .crm-account-detail__notes-trigger {
    min-width: 72px;
  }

  .crm-account-detail__avatar {
    display: none;
  }

  .crm-account-detail__side {
    position: static;
  }
}

@media (max-width: 575px) {
  .crm-account-detail__tabs :deep(.ant-tabs-nav) {
    flex-wrap: wrap;
  }

  .crm-account-detail__tabs :deep(.ant-tabs-nav-wrap) {
    flex: 1 1 100%;
    min-width: 100%;
    order: 1;
  }

  .crm-account-detail__tabs :deep(.ant-tabs-nav-operations) {
    order: 1;
  }

  .crm-account-detail__tabs :deep(.ant-tabs-extra-content) {
    flex: 1 0 100%;
    justify-content: flex-start;
    order: 2;
    padding-top: 8px;
  }
}
</style>
