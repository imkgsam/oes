<template>
  <main class="crm-workspace">
    <header class="workspace-header">
      <div>
        <span>CRM Workspace</span>
        <strong>CRM 工作台</strong>
      </div>
      <small>{{ headerMeta }}</small>
    </header>

    <nav class="workspace-nav" aria-label="CRM workspace navigation">
      <button
        v-for="item in navItems"
        :key="item.key"
        type="button"
        :class="{ active: activeTab === item.key }"
        @click="selectTab(item.key)"
      >
        {{ item.label }}
      </button>
    </nav>

    <section class="workspace-actions" aria-label="CRM quick actions">
      <button type="button" @click="selectTab('workspace')">+ Lead</button>
      <button type="button" @click="selectTab('recent')">记录页面</button>
      <button type="button" @click="selectTab('recent')">备注</button>
    </section>

    <section class="workspace-body">
      <section v-if="view === 'loading'" class="state-summary">
        <span class="state-indicator"></span>
        <p>正在读取 CRM 工作区状态。</p>
      </section>

      <section v-else-if="view === 'signed-out'" class="state-summary">
        <span class="state-indicator muted"></span>
        <p>请先在插件弹窗登录并启用 CRM 工作区。</p>
      </section>

      <section v-else-if="view === 'conflict' && activeDraft && pendingCapture" class="draft-panel">
        <div class="panel-heading">
          <span>Draft conflict</span>
          <h1>已有未保存草稿</h1>
          <p>{{ activeDraft.fields.companyName || activeDraft.capture.targetTitle }} 尚未保存。</p>
        </div>
        <div class="target-summary">
          <strong>{{ pendingCapture.targetTitle }}</strong>
          <small>{{ pendingCapture.targetDomain }}</small>
          <a :href="pendingCapture.targetUrl" target="_blank" rel="noreferrer">{{ pendingCapture.targetUrl }}</a>
        </div>
        <div class="action-stack">
          <button type="button" @click="resolveConflict('CONTINUE_CURRENT')">继续编辑当前草稿</button>
          <button type="button" @click="resolveConflict('SAVE_CURRENT_AND_CREATE_NEW')">
            保存当前草稿并创建新草稿
          </button>
          <button class="danger-button" type="button" @click="resolveConflict('DISCARD_CURRENT_AND_CREATE_NEW')">
            丢弃当前草稿并创建新草稿
          </button>
        </div>
      </section>

      <section v-else-if="view === 'duplicate' && blockedDuplicate" class="draft-panel">
        <section class="state-summary" aria-label="重复创建已阻止">
          <span class="state-indicator muted"></span>
          <p>当前目标暂不可创建 Lead。</p>
        </section>
      </section>

      <section v-else-if="activeTab === 'drafts'" class="draft-panel">
        <div class="panel-heading">
          <span>Draft inbox</span>
          <h1>OES 草稿箱</h1>
          <p>只显示 OES 中尚未转为 Lead 的草稿。</p>
        </div>

        <section v-if="draftInboxStatus === 'loading'" class="state-summary">
          <span class="state-indicator"></span>
          <p>正在读取 OES 草稿。</p>
        </section>
        <section v-else-if="draftInboxError" class="state-summary">
          <span class="state-indicator muted"></span>
          <p>{{ draftInboxError }}</p>
        </section>
        <section v-else-if="!draftInbox.length" class="state-summary">
          <span class="state-indicator muted"></span>
          <p>暂无 OES 草稿。</p>
        </section>
        <section v-else class="draft-inbox" aria-label="OES Draft Leads">
          <article v-for="draft in draftInbox" :key="draft.crmAccountId">
            <div>
              <strong>{{ draft.displayName }}</strong>
              <small>{{ draft.leadDomain || '未填写域名' }}</small>
            </div>
            <span>{{ formatDraftMeta(draft) }}</span>
            <div class="row-actions">
              <button type="button" @click="continueOesDraft(draft)">继续</button>
              <button class="danger-button" type="button" @click="deleteOesDraft(draft)">删除</button>
            </div>
          </article>
        </section>
      </section>

      <form v-else-if="view === 'draft' && activeDraft" class="draft-panel" @submit.prevent="submitDraft">
        <div class="panel-heading">
          <span>Lead draft</span>
          <h1>编辑 Lead 草稿</h1>
        </div>

        <section class="target-summary" aria-label="目标摘要">
          <strong>{{ activeDraft.capture.companyNameCandidates[0] || activeDraft.capture.targetTitle }}</strong>
          <small>{{ activeDraft.capture.targetDomain }}</small>
          <a :href="activeDraft.capture.targetUrl" target="_blank" rel="noreferrer">{{ activeDraft.capture.targetUrl }}</a>
          <span class="check-status">重复检测：未命中</span>
        </section>

        <section class="form-grid" aria-label="Lead 字段">
          <label>
            <span>公司名</span>
            <input
              v-model.trim="activeDraft.fields.companyName"
              name="companyName"
              placeholder="公司名"
              @input="syncActiveDraft"
            />
          </label>
          <label>
            <span>官网域名</span>
            <input v-model.trim="activeDraft.fields.domain" name="domain" placeholder="example.com" @input="syncActiveDraft" />
          </label>
          <label>
            <span>国家/地区</span>
            <select :value="activeDraft.fields.country" name="country" @change="handleDraftCountryChange">
              <option value="">选择国家/地区</option>
              <option v-for="option in countryRegionOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label>
            <span>邮箱</span>
            <input v-model.trim="activeDraft.fields.email" name="email" placeholder="name@example.com" @input="syncActiveDraft" />
          </label>
          <label>
            <span>电话</span>
            <input v-model.trim="activeDraft.fields.phone" name="phone" placeholder="+1" @input="syncActiveDraft" />
          </label>
          <label>
            <span>优先级</span>
            <select v-model="activeDraft.fields.priority" name="priority" @change="syncActiveDraft">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </label>
          <label>
            <span>负责人/归属意图</span>
            <select v-model="activeDraft.fields.assigneeIntent" name="assigneeIntent" @change="syncActiveDraft">
              <option value="">稍后分配</option>
              <option value="CURRENT_OPERATOR">当前账号跟进</option>
            </select>
          </label>
        </section>

        <section class="source-block" aria-label="来源">
          <div>
            <span>来源</span>
            <strong>{{ activeDraft.capture.captureKind === 'LINK' ? '链接右键' : '当前页右键' }}</strong>
          </div>
          <div>
            <span>标题</span>
            <strong>{{ activeDraft.capture.sourcePageTitle }}</strong>
          </div>
          <div>
            <span>采集时间</span>
            <strong>{{ activeDraft.capture.capturedAt }}</strong>
          </div>
          <label>
            <span>Source note</span>
            <textarea v-model.trim="activeDraft.fields.sourceNote" name="sourceNote" rows="2" @input="syncActiveDraft"></textarea>
          </label>
        </section>

        <details class="evidence-block">
          <summary>采集证据</summary>
          <dl>
            <div>
              <dt>visible emails</dt>
              <dd>{{ formatList(activeDraft.capture.visibleEmails) }}</dd>
            </div>
            <div>
              <dt>visible phones</dt>
              <dd>{{ formatList(activeDraft.capture.visiblePhones) }}</dd>
            </div>
            <div>
              <dt>company candidates</dt>
              <dd>{{ formatList(activeDraft.capture.companyNameCandidates) }}</dd>
            </div>
          </dl>
        </details>

        <p v-if="noticeMessage" class="notice-text">{{ noticeMessage }}</p>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

        <footer class="draft-actions">
          <button type="button" @click="saveDraft">保存草稿</button>
          <button class="primary-action" :disabled="busy || !canSubmit" type="submit">转为 Lead</button>
          <button type="button" @click="openDraftInbox">查看草稿箱</button>
          <button type="button" @click="goHome">回到工作台</button>
          <button class="danger-button" type="button" @click="discardActiveDraft">丢弃</button>
        </footer>
      </form>

      <section v-else-if="view === 'success'" class="result-panel">
        <span class="state-indicator"></span>
        <div>
          <strong>{{ successTitle }}</strong>
          <p>{{ successDescription }}</p>
          <div class="row-actions">
            <button type="button" @click="goHome">回到工作台</button>
            <button type="button" @click="openDraftInbox">查看草稿箱</button>
            <button type="button" @click="view = 'empty'">继续创建</button>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'recent'" class="state-summary">
        <span class="state-indicator muted"></span>
        <p>最近记录会承载页面记录与备注入口，当前版本先保留操作位置。</p>
      </section>

      <section v-else-if="activeTab === 'settings'" class="state-summary">
        <span class="state-indicator muted"></span>
        <p>CRM tag 默认随工作台启用，官网浮窗由独立开关控制。</p>
      </section>

      <section v-else class="state-summary">
        <span class="state-indicator muted"></span>
        <p>当前没有正在编辑的 Lead 草稿。请在网页或链接上右键创建，草稿会直接写入 OES。</p>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { refreshStoredExtensionAccessToken } from '../auth/access-token'
import { ExtensionAuthApi } from '../auth/api'
import { ExtensionAuthStorage } from '../auth/storage'
import type { StoredAuthSession } from '../auth/types'
import {
  CRM_LEAD_DRAFT_STATE_CHANGED_MESSAGE,
  REFRESH_CRM_TAGS_MESSAGE
} from '../runtime/messages'
import { WorkspacePreferenceStore } from '../workspaces/workspace-preferences'
import { CRM_WORKSPACE_KEY } from '../workspaces/workspace-registry'
import {
  CrmLeadDraftCaptureFlow,
  CrmLeadDraftStore,
  buildDraftLeadUpdateRequestFromDraft,
  type CrmDraftIdentity,
  type CrmLeadDraft,
  type CrmLeadDraftConflictResolution,
  type CrmLeadDuplicateCheckResult,
  type CrmLeadCapturePayload
} from '../workspaces/crm-lead-drafts'
import {
  buildCountryRegionOptionsWithSelected,
  normalizeRegionCode
} from './country-region-options'
import { ExtensionCrmApi } from './crm-api'
import type { ExtensionCrmAccountSummary } from './crm-types'

type WorkspaceView = 'conflict' | 'draft' | 'duplicate' | 'empty' | 'loading' | 'signed-out' | 'success'
type WorkspaceTab = 'drafts' | 'recent' | 'settings' | 'workspace'
type DraftCrmAccountSummary = ExtensionCrmAccountSummary & { recordStatus: 'DRAFT' }

const authStorage = new ExtensionAuthStorage()
const authApi = new ExtensionAuthApi()
const draftStore = new CrmLeadDraftStore()
const workspacePreferences = new WorkspacePreferenceStore()

const activeTab = ref<WorkspaceTab>('workspace')
const activeDraft = ref<CrmLeadDraft | null>(null)
const blockedDuplicate = ref<{ capture: CrmLeadCapturePayload; duplicate: CrmLeadDuplicateCheckResult } | null>(null)
const busy = ref(false)
const draftInbox = ref<ExtensionCrmAccountSummary[]>([])
const draftInboxError = ref('')
const draftInboxStatus = ref<'idle' | 'loading' | 'ready'>('idle')
const errorMessage = ref('')
const identity = ref<CrmDraftIdentity | null>(null)
const noticeMessage = ref('')
const pendingCapture = ref<CrmLeadCapturePayload | null>(null)
const session = ref<StoredAuthSession | null>(null)
const successKind = ref<'saved' | 'submitted'>('submitted')
const view = ref<WorkspaceView>('loading')
const navItems: Array<{ key: WorkspaceTab; label: string }> = [
  { key: 'workspace', label: '工作台' },
  { key: 'drafts', label: '草稿' },
  { key: 'recent', label: '最近' },
  { key: 'settings', label: '设置' }
]

const api = new ExtensionCrmApi({
  accessTokenProvider: async () => (await authStorage.load())?.accessToken,
  refreshAccessTokenProvider: async () => refreshStoredExtensionAccessToken({
    api: authApi,
    storage: authStorage
  }),
  workspaceEnabledProvider: async () => {
    const stored = await authStorage.load()
    return stored?.context
      ? workspacePreferences.isEnabled({ ...toIdentity(stored), workspaceKey: CRM_WORKSPACE_KEY })
      : false
  }
})
const flow = new CrmLeadDraftCaptureFlow({
  api,
  refreshCrmTags,
  store: draftStore
})

const canSubmit = computed(() =>
  Boolean(activeDraft.value?.fields.companyName.trim() && activeDraft.value?.fields.domain.trim())
)
const countryRegionOptions = computed(() =>
  buildCountryRegionOptionsWithSelected(
    activeDraft.value?.fields.country ?? '',
    globalThis.navigator?.language || 'en-US'
  )
)
const headerMeta = computed(() => session.value?.context?.tenant?.name || '未登录')
const successTitle = computed(() => successKind.value === 'saved' ? '已保存到 OES 草稿' : '已转为 Lead')
const successDescription = computed(() =>
  successKind.value === 'saved'
    ? '草稿仍保留在 OES，可从草稿箱继续补充信息。'
    : '当前草稿已提交，页面 CRM tag 会刷新为最新状态。'
)

onMounted(async () => {
  await hydrateWorkspace()
  globalThis.chrome?.runtime?.onMessage?.addListener?.(handleRuntimeMessage)
})

onUnmounted(() => {
  globalThis.chrome?.runtime?.onMessage?.removeListener?.(handleRuntimeMessage)
})

// Deletes the active OES-backed draft and clears the local editing slot.
async function discardActiveDraft(): Promise<void> {
  if (!identity.value || !activeDraft.value) {
    return
  }

  if (session.value?.context?.tenant?.tenantId && isDraftLead(activeDraft.value.oesDraft)) {
    await api.deleteDraftLead(session.value.context.tenant.tenantId, activeDraft.value.draftId)
  }
  await draftStore.deleteDraft(identity.value, activeDraft.value.draftId)
  await hydrateDraftState()
}

// Deletes one OES-backed draft and refreshes the draft inbox.
async function deleteOesDraft(draft: ExtensionCrmAccountSummary): Promise<void> {
  if (!identity.value) {
    return
  }

  busy.value = true
  errorMessage.value = ''
  try {
    if (!isDraftLead(draft)) {
      draftInbox.value = draftInbox.value.filter((item) => item.crmAccountId !== draft.crmAccountId)
      draftInboxError.value = '该记录已不是草稿，不能删除。'
      return
    }
    await api.deleteDraftLead(requireTenantId(identity.value), draft.crmAccountId)
    if (activeDraft.value?.draftId === draft.crmAccountId) {
      await draftStore.deleteDraft(identity.value, draft.crmAccountId)
      activeDraft.value = null
    }
    await loadDraftInbox()
  } catch (caught) {
    draftInboxError.value = caught instanceof Error ? caught.message : '删除 OES 草稿失败'
  } finally {
    busy.value = false
  }
}

// Formats compact evidence arrays for side-panel display.
function formatList(values: string[]): string {
  return values.length ? values.join(', ') : '无'
}

// Formats one compact draft inbox metadata line without repeating full CRM detail.
function formatDraftMeta(draft: ExtensionCrmAccountSummary): string {
  return [
    draft.priority ? `P${draft.priority}` : '',
    draft.leadCountry,
    draft.updatedAt ? `更新 ${draft.updatedAt.slice(0, 10)}` : ''
  ].filter(Boolean).join(' / ') || '未补充'
}

// handleDraftCountryChange stores normalized ISO region values from the side-panel selector.
function handleDraftCountryChange(event: Event): void {
  if (!activeDraft.value) {
    return
  }

  activeDraft.value.fields.country = normalizeRegionCode((event.target as HTMLSelectElement).value)
  void syncActiveDraft()
}

// Loads auth and draft state for the current tenant/account-scoped CRM workspace.
async function hydrateWorkspace(): Promise<void> {
  session.value = await authStorage.load()
  if (!session.value?.context) {
    view.value = 'signed-out'
    return
  }

  identity.value = toIdentity(session.value)
  await hydrateDraftState()
}

// Rehydrates the side panel when background context-menu work updates local draft storage.
function handleRuntimeMessage(message: unknown): void {
  if (!message || typeof message !== 'object') {
    return
  }

  if ((message as { type?: unknown }).type === CRM_LEAD_DRAFT_STATE_CHANGED_MESSAGE) {
    void hydrateWorkspace()
  }
}

// Loads active, pending, and blocked plugin draft state into the side panel.
async function hydrateDraftState(): Promise<void> {
  if (!identity.value) {
    view.value = 'signed-out'
    return
  }

  const draftState = await draftStore.loadDraftState(identity.value)
  activeDraft.value = draftState.activeDraft
  pendingCapture.value = draftState.pendingCapture
  blockedDuplicate.value = draftState.blockedDuplicate

  if (activeDraft.value?.dirty && pendingCapture.value) {
    view.value = 'conflict'
    return
  }
  if (blockedDuplicate.value) {
    view.value = 'duplicate'
    return
  }
  if (activeDraft.value) {
    view.value = 'draft'
    return
  }

  view.value = 'empty'
}

// Opens an OES draft in the side-panel single active editing slot.
async function continueOesDraft(draft: ExtensionCrmAccountSummary): Promise<void> {
  if (!identity.value) {
    return
  }

  if (activeDraft.value?.dirty && activeDraft.value.draftId !== draft.crmAccountId) {
    errorMessage.value = '还有未保存的数据，请先保存或提交当前草稿。'
    activeTab.value = 'workspace'
    return
  }

  await draftStore.createActiveDraft(identity.value, captureFromOesDraft(draft), draft)
  activeTab.value = 'workspace'
  await hydrateDraftState()
}

// Returns the panel to the main operation page without changing active draft data.
function goHome(): void {
  activeTab.value = 'workspace'
  if (view.value === 'success') {
    view.value = activeDraft.value ? 'draft' : 'empty'
  }
}

// Loads OES draft leads only when the user enters the draft inbox.
async function loadDraftInbox(): Promise<void> {
  if (!identity.value) {
    return
  }

  draftInboxStatus.value = 'loading'
  draftInboxError.value = ''
  try {
    const page = await api.listDraftLeads(identity.value)
    draftInbox.value = page.crmAccounts.filter(isDraftLead)
    draftInboxStatus.value = 'ready'
  } catch (caught) {
    draftInbox.value = []
    draftInboxStatus.value = 'ready'
    draftInboxError.value = caught instanceof Error ? caught.message : '读取 OES 草稿失败'
  }
}

// Opens the draft inbox and refreshes it from OES.
async function openDraftInbox(): Promise<void> {
  activeTab.value = 'drafts'
  await loadDraftInbox()
}

// isDraftLead centralizes the client-side guard for the CRM hard-delete Draft Lead contract.
function isDraftLead(
  value: Pick<ExtensionCrmAccountSummary, 'recordStatus'> | null | undefined
): value is DraftCrmAccountSummary {
  return value?.recordStatus === 'DRAFT'
}

// Resolves an active-draft conflict before creating a draft from the pending capture.
async function resolveConflict(resolution: CrmLeadDraftConflictResolution): Promise<void> {
  if (!identity.value) {
    return
  }

  busy.value = true
  errorMessage.value = ''
  try {
    await flow.resolvePendingCapture(identity.value, resolution)
    await hydrateDraftState()
  } catch (caught) {
    errorMessage.value = caught instanceof Error ? caught.message : '处理草稿冲突失败'
  } finally {
    busy.value = false
  }
}

// Switches between side-panel console pages while keeping active edit state intact.
function selectTab(tab: WorkspaceTab): void {
  activeTab.value = tab
  noticeMessage.value = ''
  errorMessage.value = ''
  if (tab === 'drafts') {
    void loadDraftInbox()
  }
}

// Sends a runtime request to refresh visible CRM tags after a successful submit.
async function refreshCrmTags(): Promise<void> {
  if (!globalThis.chrome?.runtime?.sendMessage) {
    return
  }

  const response = await chrome.runtime.sendMessage({ type: REFRESH_CRM_TAGS_MESSAGE }) as { error?: string } | undefined
  if (response?.error) {
    throw new Error(response.error)
  }
}

// Saves the active side-panel draft back to its OES Draft Lead record.
async function saveDraft(): Promise<void> {
  if (!identity.value || !activeDraft.value || busy.value) {
    return
  }

  busy.value = true
  errorMessage.value = ''
  noticeMessage.value = ''
  try {
    await syncActiveDraft()
    if (!activeDraft.value) {
      throw new Error('Active CRM draft is missing')
    }
    await api.updateDraftLead(
      requireTenantId(identity.value),
      activeDraft.value.draftId,
      buildDraftLeadUpdateRequestFromDraft(activeDraft.value)
    )
    activeDraft.value = await draftStore.saveActiveDraft(identity.value)
    successKind.value = 'saved'
    noticeMessage.value = '已保存到 OES 草稿'
  } catch (caught) {
    errorMessage.value = caught instanceof Error ? caught.message : '保存 OES 草稿失败'
  } finally {
    busy.value = false
  }
}

// Persists current form edits into the active local draft after each user edit.
async function syncActiveDraft(): Promise<void> {
  if (!identity.value || !activeDraft.value) {
    return
  }

  activeDraft.value = await draftStore.updateActiveDraft(identity.value, { ...activeDraft.value.fields })
}

// Submits the active OES Draft Lead as an active Lead and clears local draft state.
async function submitDraft(): Promise<void> {
  if (!identity.value || !canSubmit.value || busy.value) {
    return
  }

  busy.value = true
  errorMessage.value = ''
  try {
    await syncActiveDraft()
    await flow.submitActiveDraft(identity.value)
    activeDraft.value = null
    successKind.value = 'submitted'
    activeTab.value = 'workspace'
    view.value = 'success'
  } catch (caught) {
    errorMessage.value = caught instanceof Error ? caught.message : '提交 OES Lead 草稿失败'
  } finally {
    busy.value = false
  }
}

// Builds a minimal capture envelope from an OES draft when continuing it from the inbox.
function captureFromOesDraft(draft: ExtensionCrmAccountSummary): CrmLeadCapturePayload {
  const domain = draft.leadDomain || ''
  const targetUrl = domain ? `https://${domain}` : ''
  return {
    browserContext: { entryPoint: 'CONTEXT_MENU', workspace: 'CRM' },
    capturedAt: new Date().toISOString(),
    captureKind: 'CURRENT_PAGE',
    companyNameCandidates: [draft.displayName].filter(Boolean),
    sourcePageTitle: draft.displayName,
    sourcePageUrl: targetUrl,
    targetDomain: domain,
    targetTitle: draft.displayName,
    targetUrl,
    visibleEmails: draft.leadEmail ? [draft.leadEmail] : [],
    visiblePhones: draft.leadPhone ? [draft.leadPhone] : []
  }
}

function requireTenantId(current: CrmDraftIdentity): string {
  if (!current.tenantId) {
    throw new Error('CRM tenant context is missing')
  }

  return current.tenantId
}

// Converts the restored auth session into the draft storage and workspace preference identity.
function toIdentity(stored: StoredAuthSession): CrmDraftIdentity {
  return {
    accountId: stored.context?.account?.accountId,
    tenantId: stored.context?.tenant?.tenantId
  }
}
</script>
