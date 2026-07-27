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
  Input,
  Menu,
  Modal,
  Radio,
  Row,
  Select,
  Skeleton,
  Tabs,
  Tag,
  Timeline,
  TimelineItem,
  message
} from 'ant-design-vue'

import {
  archiveCrmAccountApi,
  claimCrmAccountApi,
  convertLeadToProspectCustomerApi,
  deleteDraftLeadApi,
  getCrmAccountApi,
  listCrmSourceRecordsApi,
  submitDraftLeadApi,
  updateCrmAccountIdentifiersApi
} from '#/api'
import NotesTab from '#/components/collaboration-panel/NotesTab.vue'
import CountryRegionSelect from '#/components/country-region-select.vue'
import { useAuthContextStore } from '#/store/auth-context'

import {
  identifierTypeLabel as resolveIdentifierTypeLabel,
  identifierTypeOptionsForCountry
} from './customer-management-identifiers'

const fallbackMessages = {
  back: '返回客户资源',
  archive: '归档',
  archiveConfirm: '归档后该记录会退出 active 跟进视图，原因会作为 CRM 共识记录。',
  archiveFailed: '归档失败',
  archiveReason: '归档原因',
  archiveReasonRequired: '请选择归档原因',
  archiveSuccess: '已归档',
  bound: '已绑定主体',
  claim: '认领',
  claimFailed: '认领失败',
  claimSuccess: '已认领',
  collaboration: '协作',
  contact: '联系方式',
  convert: '转为潜在客户',
  convertFailed: 'Lead 正式化失败',
  convertLegalNameHelp: '转为潜在客户前，需要确认将写入 Party 的法定/登记名称。',
  convertLegalNameRequired: '请填写法定/登记名称后再正式化',
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
  identifiers: '登记/证件信息',
  identifierAdd: '添加登记/证件',
  identifierEdit: '编辑登记/证件',
  identifierEmpty: '还未添加登记/证件信息',
  identifierLocked: '已锁定',
  identifierSave: '保存登记/证件',
  identifierType: '登记/证件类型',
  identifierTypePlaceholder: '先选国家/地区',
  identifierValue: '号码',
  identifierValuePlaceholder: '填写对应号码',
  legalName: '法定/登记名称',
  legalNamePlaceholder: '填写营业执照、注册文件或证件上的名称',
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
  sourceRecordsLoadFailed: '来源记录加载失败',
  primarySource: '主来源',
  sourceCapturedAt: '获取时间',
  sourceCapturedBy: '获取人',
  sourceExternalReference: '外部引用',
  sourceNote: '说明',
  sourceRawPayload: '原始载荷',
  submitDraft: '提交 Lead',
  submitDraftFailed: '草稿提交失败',
  submitDraftSuccess: '草稿已提交',
  summary: '责任摘要',
  title: '客户资源详情',
  unbound: '未绑定主体',
  updatedAt: '更新时间',
  whatsapp: 'WhatsApp'
}

const archiveReasonOptions: Array<{
  description: string
  label: string
  value: CustomerManagementApi.CrmArchiveReason
}> = [
  { description: '真实主体，但不属于当前目标客户范围。', label: '非目标', value: 'NON_TARGET_ACCOUNT' },
  { description: '调研后确认是同行、竞品或同业竞争主体。', label: '同行', value: 'COMPETITOR' },
  { description: '真实主体，但商业价值或跟进优先级较低。', label: '低价值', value: 'LOW_VALUE' },
  { description: '不存在、错误公司、垃圾主体或不可作为 CRM 主体。', label: '无效', value: 'INVALID_TARGET' },
  { description: '已有其他 CRM 记录承载同一主体。', label: '重复', value: 'DUPLICATE' },
  { description: '品类、地区或产品线与当前市场不匹配。', label: '不匹配', value: 'NO_FIT' },
  { description: '长期无法联系或长期没有回应。', label: '无响应', value: 'UNRESPONSIVE' },
  { description: '不属于以上原因，但需要退出 active 跟进。', label: '其他', value: 'OTHER' }
]

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
const identifierRows = ref<IdentifierFormRow[]>([])
const sourceRecords = ref<CustomerManagementApi.CrmSourceRecord[]>([])
const loading = ref(false)
const sourceRecordsLoading = ref(false)
const actionLoading = ref('')
const errorMessage = ref('')
const sourceRecordsError = ref('')
const activeTab = ref('overview')
const collaborationPanelOpen = ref(false)
const archiveModalOpen = ref(false)
const archiveReasonDraft = ref<CustomerManagementApi.CrmArchiveReason | ''>('')
const identifierModalOpen = ref(false)
const conversionModalOpen = ref(false)
const conversionLegalName = ref('')

interface IdentifierFormRow {
  identifierType: string
  issuerCountryOrRegion: string
  rowId: string
  value: string
}

let identifierRowSequence = 0

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
const canArchiveCurrentAccount = computed(
  () =>
    Boolean(account.value) &&
    canManageAccount.value &&
    account.value!.recordStatus === 'ACTIVE' &&
    ['LEAD', 'PROSPECT_CUSTOMER'].includes(account.value!.lifecycleStage)
)
const isIdentifierLocked = computed(
  () =>
    Boolean(account.value?.tenantPartyId) &&
    account.value?.lifecycleStage === 'PROSPECT_CUSTOMER' &&
    (account.value?.leadIdentifiers ?? []).length > 0
)
const canEditIdentifiers = computed(
  () =>
    Boolean(account.value) &&
    canUpdateLead.value &&
    account.value!.recordStatus === 'ACTIVE' &&
    ['LEAD', 'PROSPECT_CUSTOMER'].includes(account.value!.lifecycleStage) &&
    !isIdentifierLocked.value
)
const hasSecondaryActions = computed(
  () => canClaimCurrentAccount.value || canSubmitCurrentDraft.value || canArchiveCurrentAccount.value
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
    await loadSourceRecords()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : fallbackMessages.detailLoadFailed
  } finally {
    loading.value = false
  }
}

/** loadSourceRecords reads CRM-owned source evidence for the current detail account. */
async function loadSourceRecords() {
  if (!activeTenantId.value || !crmAccountId.value || !canViewAccount.value) {
    return
  }

  sourceRecordsLoading.value = true
  sourceRecordsError.value = ''
  try {
    const result = await listCrmSourceRecordsApi(activeTenantId.value, crmAccountId.value)
    sourceRecords.value = result.sourceRecords ?? []
  } catch (error) {
    sourceRecords.value = []
    sourceRecordsError.value = error instanceof Error ? error.message : fallbackMessages.sourceRecordsLoadFailed
  } finally {
    sourceRecordsLoading.value = false
  }
}

/** goBack returns to the CRM customer resource workspace without changing the menu entry. */
async function goBack() {
  await router.push({ name: 'TenantCrmAccounts' })
}

/** openConversionModal captures the legal name required only when turning a Lead into a PC. */
function openConversionModal() {
  if (!activeTenantId.value || !account.value || !canConvertCurrentAccount.value) {
    return
  }
  conversionLegalName.value = account.value.leadLegalName || ''
  conversionModalOpen.value = true
}

/** closeConversionModal clears conversion-only legal name capture state. */
function closeConversionModal() {
  conversionModalOpen.value = false
  conversionLegalName.value = ''
}

/** convertLead formalizes the current Lead and refreshes the independent detail page. */
async function convertLead() {
  if (!activeTenantId.value || !account.value || !canConvertCurrentAccount.value) {
    return
  }
  const legalName = conversionLegalName.value.trim()
  if (!legalName) {
    errorMessage.value = fallbackMessages.convertLegalNameRequired
    message.error(fallbackMessages.convertLegalNameRequired)
    return
  }

  actionLoading.value = 'convert'
  errorMessage.value = ''
  try {
    const result = await convertLeadToProspectCustomerApi(activeTenantId.value, account.value.crmAccountId, {
      legalName
    })
    if (result.crmAccount) {
      account.value = result.crmAccount
    } else {
      await loadAccount()
    }
    closeConversionModal()
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

/** openArchiveModal starts the operator-driven CRM archive reason selection flow. */
function openArchiveModal() {
  if (!canArchiveCurrentAccount.value) {
    return
  }
  archiveReasonDraft.value = ''
  archiveModalOpen.value = true
}

/** openIdentifierModal starts CRM-owned strong identifier editing for eligible Lead or PC records. */
function openIdentifierModal() {
  if (!account.value || !canEditIdentifiers.value) {
    return
  }
  identifierRows.value = identifierFormRows(account.value)
  identifierModalOpen.value = true
}

/** addIdentifierRow appends one country/type/value row to the detail identifier editor. */
function addIdentifierRow() {
  identifierRows.value.push(createIdentifierRow())
}

/** removeIdentifierRow removes one unsaved identifier row from the detail editor. */
function removeIdentifierRow(rowId: string) {
  identifierRows.value = identifierRows.value.filter((row) => row.rowId !== rowId)
}

/** saveIdentifiers persists CRM-owned strong identifiers through the formal BFF endpoint. */
async function saveIdentifiers() {
  if (!activeTenantId.value || !account.value || !canEditIdentifiers.value) {
    return
  }

  actionLoading.value = 'identifiers'
  errorMessage.value = ''
  try {
    account.value = await updateCrmAccountIdentifiersApi(
      activeTenantId.value,
      account.value.crmAccountId,
      {
        leadIdentifiers: buildLeadIdentifiers(identifierRows.value)
      }
    )
    identifierModalOpen.value = false
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : fallbackMessages.detailLoadFailed
  } finally {
    actionLoading.value = ''
  }
}

/** archiveAccount sends the selected CRM archive reason to the BFF and refreshes local detail state. */
async function archiveAccount() {
  if (!activeTenantId.value || !account.value || !canArchiveCurrentAccount.value) {
    return
  }
  if (!archiveReasonDraft.value) {
    errorMessage.value = fallbackMessages.archiveReasonRequired
    return
  }

  actionLoading.value = 'archive'
  errorMessage.value = ''
  try {
    account.value = await archiveCrmAccountApi(activeTenantId.value, account.value.crmAccountId, {
      archiveReason: archiveReasonDraft.value
    })
    archiveModalOpen.value = false
    message.success(fallbackMessages.archiveSuccess)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : fallbackMessages.archiveFailed
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

/** archiveReasonLabel maps CRM archive reason enum values to display labels without deriving the reason. */
function archiveReasonLabel(reason?: string) {
  return archiveReasonOptions.find((option) => option.value === reason)?.label ?? '-'
}

/** sourceTypeLabel maps CRM source types into compact operator-facing labels. */
function sourceTypeLabel(sourceType?: string) {
  const labels: Record<string, string> = {
    AD_CAMPAIGN: '广告投放',
    BROWSER_EXTENSION: '浏览器插件',
    BUSINESS_CARD: '名片',
    EXHIBITION_SCAN: '展会扫码',
    IMPORTED_LIST: '名单导入',
    OTHER: '其他',
    PEER_TRANSFER: '同事转交',
    REFERRAL: '转介绍',
    SOCIAL_MEDIA: '社交媒体',
    WEB_RESEARCH: '网络调研',
    WEBSITE_FORM: '官网表单'
  }
  return labels[sourceType ?? ''] ?? sourceType ?? '-'
}

/** formatRawPayload keeps technical source payloads inspectable but compact. */
function formatRawPayload(value: Record<string, unknown> | null) {
  return value ? JSON.stringify(value) : ''
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
    .map((identifier) =>
      [
        identifier.issuerCountryOrRegion,
        identifierTypeLabel(identifier.identifierType, identifier.issuerCountryOrRegion),
        identifier.normalizedValue
      ]
        .filter(Boolean)
        .join(' / ')
    )
    .join(' / ')
}

/** currentIdentifierSubjectType returns the subject kind used to filter detail-page official identity choices. */
function currentIdentifierSubjectType() {
  return account.value?.partyTypeHint === 'PERSON' ? 'PERSON' : 'ORGANIZATION'
}

/** identifierTypeOptionsFor returns country-appropriate official identity choices for one editor row. */
function identifierTypeOptionsFor(identifier: IdentifierFormRow) {
  return identifierTypeOptionsForCountry(identifier.issuerCountryOrRegion, currentIdentifierSubjectType())
}

/** identifierTypeLabel renders CRM official identity enum values as concise operator-facing text. */
function identifierTypeLabel(value?: string, issuerCountryOrRegion = '') {
  return resolveIdentifierTypeLabel(value, issuerCountryOrRegion, currentIdentifierSubjectType())
}

/** updateIdentifierCountry stores row country and clears stale official identity type choices. */
function updateIdentifierCountry(identifier: IdentifierFormRow, value?: string) {
  identifier.issuerCountryOrRegion = value || ''
  const validTypes = new Set(identifierTypeOptionsFor(identifier).map((option) => option.value))
  if (identifier.identifierType && !validTypes.has(identifier.identifierType)) {
    identifier.identifierType = ''
  }
}

/** createIdentifierRow creates one detail-page official identity editor row. */
function createIdentifierRow(identifierType = '', value = '', issuerCountryOrRegion = ''): IdentifierFormRow {
  identifierRowSequence += 1
  return {
    identifierType,
    issuerCountryOrRegion,
    rowId: `identifier-row-${identifierRowSequence}`,
    value
  }
}

/** identifierFormRows hydrates the detail identifier editor from current CRM account facts. */
function identifierFormRows(record: CustomerManagementApi.CrmAccount) {
  return (record.leadIdentifiers ?? [])
    .filter((identifier) => identifier.identifierType && identifier.normalizedValue)
    .map((identifier) =>
      createIdentifierRow(
        identifier.identifierType,
        identifier.normalizedValue,
        identifier.issuerCountryOrRegion ?? record.leadCountry ?? ''
      )
    )
}

/** buildLeadIdentifiers materializes detail editor rows into deduplicated CRM official identity inputs. */
function buildLeadIdentifiers(rows: IdentifierFormRow[]): CustomerManagementApi.CrmLeadIdentifier[] {
  const seen = new Set<string>()
  const identifiers: CustomerManagementApi.CrmLeadIdentifier[] = []

  for (const row of rows) {
    const identifierType = row.identifierType.trim()
    const identifierValue = row.value.trim()
    const issuerCountryOrRegion = row.issuerCountryOrRegion.trim()
    if (!identifierType || !identifierValue) {
      continue
    }
    const dedupeKey = `${issuerCountryOrRegion}:${identifierType}:${identifierValue.toLowerCase()}`
    if (seen.has(dedupeKey)) {
      continue
    }
    seen.add(dedupeKey)
    identifiers.push({
      identifierType,
      issuerCountryOrRegion,
      normalizedValue: identifierValue,
      rawValue: identifierValue
    })
  }

  return identifiers
}

/** formatAccountProfileItems renders account-owned profile items as the CRM profile truth. */
function formatAccountProfileItems(itemType: string) {
  const profileValues = (account.value?.profileItems ?? [])
    .filter((profileItem) => profileItem.itemType === itemType && profileItem.normalizedValue)
    .map((profileItem) => profileItem.normalizedValue)

  if (profileValues.length) {
    return [...new Set(profileValues)].join(' / ')
  }

  return '-'
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
            <Button class="crm-account-detail__back-button" data-testid="crm-account-detail-back" @click="goBack">
              <template #icon>
                <IconifyIcon icon="lucide:arrow-left" />
              </template>
              {{ fallbackMessages.back }}
            </Button>
            <div class="crm-account-detail__actions">
              <Dropdown v-if="hasSecondaryActions" :trigger="['click']">
                <Button class="crm-account-detail__more-button" data-testid="crm-account-detail-more-actions">
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
                    <Menu.Item
                      v-if="canArchiveCurrentAccount"
                      key="archive"
                      danger
                      data-testid="crm-account-detail-archive"
                      :disabled="actionLoading === 'archive'"
                      @click="openArchiveModal"
                    >
                      {{ fallbackMessages.archive }}
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
              <Button
                v-if="canConvertCurrentAccount"
                data-testid="crm-account-detail-convert"
                :loading="actionLoading === 'convert'"
                type="primary"
                @click="openConversionModal"
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
                <Tag :color="account.recordStatus === 'ARCHIVED' ? 'warning' : account.recordStatus === 'DRAFT' ? 'default' : 'success'">
                  {{ account.recordStatus }}
                </Tag>
                <Tag v-if="account.archiveReason" color="warning">
                  {{ archiveReasonLabel(account.archiveReason) }}
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
                      <DescriptionsItem label="法定/登记名称">{{ account.leadLegalName || '-' }}</DescriptionsItem>
                      <DescriptionsItem label="公司">{{ account.leadCompanyName || '-' }}</DescriptionsItem>
                      <DescriptionsItem label="联系人">{{ account.leadPersonName || '-' }}</DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.partyType">
                        {{ partyTypeLabel(account.partyTypeHint) }}
                      </DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.country">{{ account.leadCountry || '-' }}</DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.domain">
                        {{ formatAccountProfileItems('DOMAIN') }}
                      </DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.email">
                        {{ formatAccountProfileItems('EMAIL') }}
                      </DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.phone">
                        {{ formatAccountProfileItems('PHONE') }}
                      </DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.whatsapp">
                        {{ formatAccountProfileItems('WHATSAPP') }}
                      </DescriptionsItem>
                      <DescriptionsItem :label="fallbackMessages.identifiers">
                        <div class="crm-account-detail__identifier-cell">
                          <span>{{ formatLeadIdentifiers(account.leadIdentifiers) }}</span>
                          <Tag
                            v-if="isIdentifierLocked"
                            color="default"
                            data-testid="crm-account-identifier-lock"
                          >
                            {{ fallbackMessages.identifierLocked }}
                          </Tag>
                          <Button
                            v-if="canEditIdentifiers"
                            class="crm-account-detail__inline-action"
                            data-testid="crm-account-identifiers-edit"
                            size="small"
                            @click="openIdentifierModal"
                          >
                            {{ fallbackMessages.identifierEdit }}
                          </Button>
                        </div>
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
                      <DescriptionsItem v-if="account.recordStatus === 'ARCHIVED'" :label="fallbackMessages.archiveReason">
                        {{ archiveReasonLabel(account.archiveReason) }}
                      </DescriptionsItem>
                      <DescriptionsItem v-if="account.recordStatus === 'ARCHIVED'" :label="fallbackMessages.archive">
                        {{ formatDateTime(account.archivedAt) }}
                      </DescriptionsItem>
                    </Descriptions>
                  </section>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane key="source" :tab="fallbackMessages.sourceRecords">
                <div class="crm-account-detail__source-panel">
                  <Skeleton v-if="sourceRecordsLoading" active />
                  <Alert
                    v-else-if="sourceRecordsError"
                    :message="sourceRecordsError"
                    show-icon
                    type="error"
                  />
                  <Empty v-else-if="!sourceRecords.length" :description="fallbackMessages.noSourceRecords" />
                  <div v-else class="crm-account-detail__source-list">
                    <article
                      v-for="source in sourceRecords"
                      :key="source.sourceRecordId"
                      class="crm-account-detail__source-row"
                      data-testid="crm-account-detail-source-record"
                    >
                      <div class="crm-account-detail__source-heading">
                        <div class="crm-account-detail__source-title">
                          <strong>{{ source.sourceName || sourceTypeLabel(source.sourceType) }}</strong>
                          <Tag v-if="source.isPrimary" color="gold">{{ fallbackMessages.primarySource }}</Tag>
                          <Tag>{{ source.sourceType }}</Tag>
                        </div>
                      </div>
                      <div class="crm-account-detail__source-meta">
                        <span>{{ fallbackMessages.sourceCapturedAt }} {{ formatDateTime(source.capturedAt) }}</span>
                        <span>{{ fallbackMessages.sourceCapturedBy }} {{ source.capturedByDisplayName || source.capturedByAccountId || '-' }}</span>
                      </div>
                      <div v-if="source.externalReference" class="crm-account-detail__source-field">
                        <span>{{ fallbackMessages.sourceExternalReference }}</span>
                        <code>{{ source.externalReference }}</code>
                      </div>
                      <div v-if="source.note" class="crm-account-detail__source-field">
                        <span>{{ fallbackMessages.sourceNote }}</span>
                        <p>{{ source.note }}</p>
                      </div>
                      <details v-if="source.rawPayload" class="crm-account-detail__source-raw">
                        <summary>{{ fallbackMessages.sourceRawPayload }}</summary>
                        <pre>{{ formatRawPayload(source.rawPayload) }}</pre>
                      </details>
                    </article>
                  </div>
                </div>
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

      <Modal
        v-model:open="archiveModalOpen"
        cancel-text="取消"
        :title="fallbackMessages.archive"
      >
        <div class="crm-account-detail__archive-form">
          <Alert
            :message="fallbackMessages.archiveConfirm"
            show-icon
            type="warning"
          />
          <div class="crm-account-detail__archive-label">
            {{ fallbackMessages.archiveReason }}
          </div>
          <Radio.Group
            v-model:value="archiveReasonDraft"
            class="crm-account-detail__archive-options"
            data-testid="crm-account-detail-archive-reason"
          >
            <label
              v-for="option in archiveReasonOptions"
              :key="option.value"
              class="crm-account-detail__archive-option"
              :class="{ 'crm-account-detail__archive-option--selected': archiveReasonDraft === option.value }"
              :data-testid="`crm-account-detail-archive-reason-${option.value}`"
            >
              <Radio :value="option.value" />
              <span class="crm-account-detail__archive-option-copy">
                <strong>{{ option.label }}</strong>
                <span>{{ option.description }}</span>
              </span>
            </label>
          </Radio.Group>
        </div>
        <template #footer>
          <Button @click="archiveModalOpen = false">取消</Button>
          <Button
            data-testid="crm-account-detail-archive-submit"
            :disabled="!archiveReasonDraft"
            :loading="actionLoading === 'archive'"
            type="primary"
            @click="archiveAccount"
          >
            {{ fallbackMessages.archive }}
          </Button>
        </template>
      </Modal>

      <Modal
        v-model:open="conversionModalOpen"
        :title="fallbackMessages.convert"
        @cancel="closeConversionModal"
      >
        <div class="crm-account-detail__archive-form">
          <Alert :message="fallbackMessages.convertLegalNameHelp" show-icon type="info" />
          <div class="crm-account-detail__archive-label">{{ fallbackMessages.legalName }}</div>
          <Input
            v-model:value="conversionLegalName"
            allow-clear
            data-testid="crm-account-detail-convert-legal-name"
            :placeholder="fallbackMessages.legalNamePlaceholder"
          />
        </div>
        <template #footer>
          <Button @click="closeConversionModal">取消</Button>
          <Button
            data-testid="crm-account-detail-convert-submit"
            :disabled="!conversionLegalName.trim()"
            :loading="actionLoading === 'convert'"
            type="primary"
            @click="convertLead"
          >
            {{ fallbackMessages.convert }}
          </Button>
        </template>
      </Modal>

      <Modal
        v-model:open="identifierModalOpen"
        :confirm-loading="actionLoading === 'identifiers'"
        :title="fallbackMessages.identifierEdit"
        @ok="saveIdentifiers"
      >
        <div class="crm-detail-identifier-editor" data-testid="crm-identifier-editor">
          <div v-if="identifierRows.length" class="crm-detail-identifier-editor__labels" aria-hidden="true">
            <span>{{ fallbackMessages.country }}</span>
            <span>{{ fallbackMessages.identifierType }}</span>
            <span>{{ fallbackMessages.identifierValue }}</span>
            <span>操作</span>
          </div>
          <div v-if="identifierRows.length" class="crm-detail-identifier-editor__rows">
            <div
              v-for="(identifier, index) in identifierRows"
              :key="identifier.rowId"
              class="crm-detail-identifier-editor__row"
            >
              <CountryRegionSelect
                :data-testid="`crm-identifier-country-${index}`"
                :placeholder="fallbackMessages.country"
                :value="identifier.issuerCountryOrRegion"
                @update:value="(value) => updateIdentifierCountry(identifier, value)"
              />
              <Select
                v-model:value="identifier.identifierType"
                :data-testid="`crm-identifier-type-${index}`"
                :options="identifierTypeOptionsFor(identifier)"
                :placeholder="fallbackMessages.identifierTypePlaceholder"
              />
              <Input
                v-model:value="identifier.value"
                :data-testid="`crm-identifier-value-${index}`"
                :placeholder="fallbackMessages.identifierValuePlaceholder"
              />
              <Button
                :data-testid="`crm-identifier-remove-${index}`"
                shape="circle"
                size="small"
                type="text"
                @click="removeIdentifierRow(identifier.rowId)"
              >
                <IconifyIcon icon="ant-design:delete-outlined" />
              </Button>
            </div>
          </div>
          <div v-else class="crm-detail-identifier-editor__empty" data-testid="crm-identifier-empty">
            {{ fallbackMessages.identifierEmpty }}
          </div>
          <button
            class="crm-detail-identifier-editor__add"
            data-testid="crm-identifier-add"
            type="button"
            @click="addIdentifierRow"
          >
            <IconifyIcon icon="ant-design:plus-outlined" />
            <span>{{ fallbackMessages.identifierAdd }}</span>
          </button>
        </div>
        <template #footer>
          <Button @click="identifierModalOpen = false">取消</Button>
          <Button
            data-testid="crm-account-identifiers-save"
            :loading="actionLoading === 'identifiers'"
            type="primary"
            @click="saveIdentifiers"
          >
            {{ fallbackMessages.identifierSave }}
          </Button>
        </template>
      </Modal>
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
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.crm-account-detail__back-button,
.crm-account-detail__more-button {
  align-items: center;
  display: inline-flex;
  flex: 0 0 auto;
  justify-content: center;
  min-width: 0;
  width: auto;
}

.crm-account-detail__back-button {
  padding-inline: 12px;
}

.crm-account-detail__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  margin-left: auto;
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

.crm-account-detail__identifier-cell {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.crm-account-detail__inline-action {
  border-radius: 7px;
}

.crm-detail-identifier-editor {
  border: 1px solid var(--crm-detail-border);
  border-radius: 8px;
  overflow: hidden;
}

.crm-detail-identifier-editor__labels,
.crm-detail-identifier-editor__row {
  display: grid;
  grid-template-columns: minmax(110px, 0.24fr) minmax(168px, 0.34fr) minmax(0, 1fr) 46px;
}

.crm-detail-identifier-editor__labels {
  border-bottom: 1px solid hsl(var(--border) / 0.86);
  background: hsl(var(--muted) / 0.42);
  color: var(--crm-detail-muted);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  padding: 7px 12px;
}

.crm-detail-identifier-editor__labels span:not(:last-child),
.crm-detail-identifier-editor__row > *:not(:last-child) {
  border-right: 1px solid hsl(var(--border) / 0.64);
  padding-right: 10px;
}

.crm-detail-identifier-editor__rows {
  display: grid;
}

.crm-detail-identifier-editor__row {
  align-items: center;
  border-bottom: 1px solid hsl(var(--border) / 0.74);
  column-gap: 10px;
  padding: 10px 12px;
}

.crm-detail-identifier-editor__row:last-child {
  border-bottom: 0;
}

.crm-detail-identifier-editor__empty {
  color: var(--crm-detail-muted);
  font-size: 13px;
  line-height: 20px;
  padding: 18px 14px;
  text-align: center;
}

.crm-detail-identifier-editor__add {
  align-items: center;
  border: 0;
  border-top: 1px solid hsl(var(--border) / 0.74);
  background: hsl(var(--muted) / 0.14);
  color: hsl(var(--primary));
  cursor: pointer;
  display: flex;
  gap: 4px;
  justify-content: center;
  min-height: 44px;
  width: 100%;
}

.crm-detail-identifier-editor__add:hover {
  background: hsl(var(--primary) / 0.08);
}

.crm-account-detail__source-panel {
  min-width: 0;
}

.crm-account-detail__source-list {
  display: grid;
  gap: 12px;
}

.crm-account-detail__source-row {
  display: grid;
  gap: 10px;
  border: 1px solid var(--crm-detail-border);
  border-radius: 8px;
  background: var(--crm-detail-panel);
  padding: 12px 14px;
}

.crm-account-detail__source-heading,
.crm-account-detail__source-title,
.crm-account-detail__source-meta,
.crm-account-detail__source-field {
  min-width: 0;
}

.crm-account-detail__source-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.crm-account-detail__source-title strong {
  color: var(--crm-detail-text);
  font-size: 14px;
}

.crm-account-detail__source-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  color: var(--crm-detail-muted);
  font-size: 12px;
}

.crm-account-detail__source-field {
  display: grid;
  gap: 4px;
  color: var(--crm-detail-text);
  font-size: 13px;
}

.crm-account-detail__source-field > span {
  color: var(--crm-detail-muted);
  font-size: 12px;
}

.crm-account-detail__source-field code {
  overflow-wrap: anywhere;
  border-radius: 6px;
  background: hsl(var(--background) / 0.7);
  padding: 4px 6px;
  color: var(--crm-detail-text);
  font-size: 12px;
}

.crm-account-detail__source-field p {
  margin: 0;
  line-height: 1.5;
}

.crm-account-detail__source-raw {
  color: var(--crm-detail-muted);
  font-size: 12px;
}

.crm-account-detail__source-raw summary {
  cursor: pointer;
}

.crm-account-detail__source-raw pre {
  overflow: auto;
  margin: 8px 0 0;
  border-radius: 6px;
  background: hsl(var(--background) / 0.7);
  padding: 8px;
  color: var(--crm-detail-text);
  font-size: 12px;
}

.crm-account-detail__side {
  position: sticky;
  top: 76px;
  display: grid;
  gap: 16px;
}

.crm-account-detail__archive-form {
  display: grid;
  gap: 14px;
}

.crm-account-detail__archive-label {
  color: var(--crm-detail-text);
  font-size: 13px;
  font-weight: 600;
}

.crm-account-detail__archive-options {
  display: grid;
  gap: 8px;
  width: 100%;
}

.crm-account-detail__archive-option {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
  border: 1px solid var(--crm-detail-border);
  border-radius: 8px;
  background: var(--crm-detail-bg);
  cursor: pointer;
  padding: 10px 12px;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    transform 0.18s ease;
}

.crm-account-detail__archive-option:hover,
.crm-account-detail__archive-option--selected {
  border-color: hsl(var(--primary) / 0.42);
  background: hsl(var(--primary) / 0.045);
}

.crm-account-detail__archive-option:active {
  transform: translateY(1px);
}

.crm-account-detail__archive-option-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.crm-account-detail__archive-option-copy strong {
  color: var(--crm-detail-text);
  font-size: 13px;
}

.crm-account-detail__archive-option-copy span {
  color: var(--crm-detail-muted);
  font-size: 12px;
  line-height: 1.45;
}

@media (max-width: 991px) {
  .crm-account-detail__identity {
    align-items: stretch;
    flex-direction: column;
  }

  .crm-account-detail__actions {
    justify-content: flex-end;
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
  .crm-detail-identifier-editor__labels {
    display: none;
  }

  .crm-detail-identifier-editor__row {
    grid-template-columns: 1fr 38px;
    row-gap: 8px;
  }

  .crm-detail-identifier-editor__row > *:not(:last-child) {
    grid-column: 1 / -1;
  }

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
