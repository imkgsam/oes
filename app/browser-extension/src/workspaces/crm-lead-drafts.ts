import type { ExtensionCrmAccountSummary, ExtensionLeadRequest } from '../side-panel/crm-types'
import type { PageSignals } from '../runtime/page-signals'

export const CRM_LEAD_DRAFT_PAGE_CONTEXT_MENU_ID = 'oes-crm-create-lead-draft-page'
export const CRM_LEAD_DRAFT_LINK_CONTEXT_MENU_ID = 'oes-crm-create-lead-draft-link'

export type CrmLeadCaptureKind = 'CURRENT_PAGE' | 'LINK'
export type CrmLeadDraftConflictResolution =
  | 'CONTINUE_CURRENT'
  | 'DISCARD_CURRENT_AND_CREATE_NEW'
  | 'SAVE_CURRENT_AND_CREATE_NEW'

export interface CrmDraftIdentity {
  accountId?: string
  tenantId?: string | null
}

export interface CrmLeadDraftContextMenuInfo {
  linkUrl?: string
  menuItemId: string
  pageUrl?: string
  selectionText?: string
}

export interface CrmLeadCapturePayload {
  browserContext: {
    entryPoint: 'CONTEXT_MENU'
    workspace: 'CRM'
  }
  capturedAt: string
  captureKind: CrmLeadCaptureKind
  companyNameCandidates: string[]
  sourcePageTitle: string
  sourcePageUrl: string
  targetDomain: string
  targetTitle: string
  targetUrl: string
  visibleEmails: string[]
  visiblePhones: string[]
}

export interface CrmLeadDraftFields {
  assigneeIntent?: string
  companyName: string
  country: string
  domain: string
  email: string
  phone: string
  priority: string
  sourceNote: string
}

export interface CrmLeadDraft {
  capture: CrmLeadCapturePayload
  createdAt: string
  dirty: boolean
  draftId: string
  fields: CrmLeadDraftFields
  oesDraft?: ExtensionCrmAccountSummary
  savedAt?: string
  updatedAt: string
}

export interface CrmLeadDraftStorage {
  get(key: string): Promise<unknown>
  remove(key: string): Promise<void>
  set(key: string, value: unknown): Promise<void>
}

interface DraftBucket {
  activeDraftId?: string
  blockedDuplicate?: {
    capture: CrmLeadCapturePayload
    duplicate: CrmLeadDuplicateCheckResult
  }
  drafts: CrmLeadDraft[]
  pendingCapture?: CrmLeadCapturePayload
}

export interface CrmLeadDraftState {
  activeDraft: CrmLeadDraft | null
  blockedDuplicate: {
    capture: CrmLeadCapturePayload
    duplicate: CrmLeadDuplicateCheckResult
  } | null
  pendingCapture: CrmLeadCapturePayload | null
  savedDrafts: CrmLeadDraft[]
}

export interface CrmLeadDuplicateCheckResult {
  allowedActions?: string[]
  duplicateResult?: {
    candidates?: unknown[]
    resultType?: string
  }
}

export interface CrmLeadDraftApi {
  checkDuplicate(input: ExtensionLeadRequest): Promise<CrmLeadDuplicateCheckResult>
  createDraftLead(input: ExtensionLeadRequest): Promise<{ crmAccount?: ExtensionCrmAccountSummary }>
  submitDraftLead?(
    tenantId: string,
    crmAccountId: string,
    input: { assignmentIntent?: string; duplicateWarningAcknowledged?: boolean }
  ): Promise<unknown>
  updateDraftLead?(tenantId: string, crmAccountId: string, input: CrmDraftLeadUpdateRequest): Promise<unknown>
}

export interface CrmDraftLeadUpdateRequest {
  displayName: string
  leadCompanyName?: string
  leadCountry?: string
  leadDomain?: string
  leadEmail?: string
  leadPhone?: string
  partyTypeHint?: string
  priority?: string
}

export type CrmLeadDraftFlowResult =
  | { draft: CrmLeadDraft; status: 'DRAFT_READY' }
  | {
      activeDraft: CrmLeadDraft
      pendingCapture: CrmLeadCapturePayload
      status: 'ACTIVE_DRAFT_CONFLICT'
    }
  | {
      capture: CrmLeadCapturePayload
      duplicate: CrmLeadDuplicateCheckResult
      status: 'DUPLICATE_BLOCKED'
    }

// Builds one normalized CRM capture payload from a supported browser context-menu target.
export function createCaptureFromContextMenu(input: {
  capturedAt?: string
  info: CrmLeadDraftContextMenuInfo
  page: PageSignals
}): CrmLeadCapturePayload {
  const captureKind = input.info.menuItemId === CRM_LEAD_DRAFT_LINK_CONTEXT_MENU_ID ? 'LINK' : 'CURRENT_PAGE'
  const targetUrl = captureKind === 'LINK' ? input.info.linkUrl || input.page.url : input.page.url
  const targetDomain = resolveHostname(targetUrl)
  const targetTitle = captureKind === 'LINK' ? targetDomain : input.page.title

  return {
    browserContext: { entryPoint: 'CONTEXT_MENU', workspace: 'CRM' },
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    captureKind,
    companyNameCandidates: uniqueStrings(input.page.companyNameCandidates).slice(0, 5),
    sourcePageTitle: input.page.title,
    sourcePageUrl: input.page.url,
    targetDomain,
    targetTitle,
    targetUrl,
    visibleEmails: uniqueStrings(input.page.visibleEmails).slice(0, 5),
    visiblePhones: uniqueStrings(input.page.visiblePhones).slice(0, 5)
  }
}

// Builds the extension BFF lead input from the active plugin draft form and capture evidence.
export function buildLeadRequestFromDraft(draft: CrmLeadDraft): ExtensionLeadRequest {
  return {
    capture: draft.capture,
    displayName: draft.fields.companyName || draft.capture.companyNameCandidates[0] || draft.capture.targetTitle,
    leadCompanyName: draft.fields.companyName || undefined,
    leadCountry: draft.fields.country || undefined,
    leadDomain: draft.fields.domain || undefined,
    leadEmail: draft.fields.email || undefined,
    leadPhone: draft.fields.phone || undefined,
    priority: draft.fields.priority || undefined,
    sourceNote: draft.fields.sourceNote || undefined
  }
}

// Builds the customer-management Draft Lead update payload without extension-only capture evidence.
export function buildDraftLeadUpdateRequestFromDraft(draft: CrmLeadDraft): CrmDraftLeadUpdateRequest {
  return {
    displayName: draft.fields.companyName || draft.capture.companyNameCandidates[0] || draft.capture.targetTitle,
    leadCompanyName: draft.fields.companyName || undefined,
    leadCountry: draft.fields.country || undefined,
    leadDomain: draft.fields.domain || undefined,
    leadEmail: draft.fields.email || undefined,
    leadPhone: draft.fields.phone || undefined,
    priority: draft.fields.priority || undefined
  }
}

// Persists CRM Lead drafts in a tenant/account-isolated browser storage bucket.
export class CrmLeadDraftStore {
  constructor(
    private readonly storage: CrmLeadDraftStorage = new ChromeCrmLeadDraftStorage(),
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async createActiveDraft(
    identity: CrmDraftIdentity,
    capture: CrmLeadCapturePayload,
    oesDraft?: ExtensionCrmAccountSummary
  ): Promise<CrmLeadDraft> {
    const bucket = await this.loadBucket(identity)
    const draft = buildDraft(capture, this.now(), oesDraft)
    bucket.drafts = bucket.drafts.filter((item) => item.draftId !== draft.draftId)
    bucket.drafts.push(draft)
    bucket.activeDraftId = draft.draftId
    bucket.pendingCapture = undefined
    await this.saveBucket(identity, bucket)
    return draft
  }

  async clearActiveDraft(identity: CrmDraftIdentity): Promise<void> {
    const bucket = await this.loadBucket(identity)
    bucket.activeDraftId = undefined
    await this.saveBucket(identity, bucket)
  }

  async deleteDraft(identity: CrmDraftIdentity, draftId: string): Promise<void> {
    const bucket = await this.loadBucket(identity)
    bucket.drafts = bucket.drafts.filter((draft) => draft.draftId !== draftId)
    if (bucket.activeDraftId === draftId) {
      bucket.activeDraftId = undefined
    }
    await this.saveBucket(identity, bucket)
  }

  async hasUnsavedActiveDraft(identity: CrmDraftIdentity): Promise<boolean> {
    const active = await this.loadActiveDraft(identity)
    return Boolean(active?.dirty)
  }

  async listSavedDrafts(identity: CrmDraftIdentity): Promise<CrmLeadDraft[]> {
    const bucket = await this.loadBucket(identity)
    return bucket.drafts.filter((draft) => Boolean(draft.savedAt))
  }

  async loadBlockedDuplicate(identity: CrmDraftIdentity): Promise<{
    capture: CrmLeadCapturePayload
    duplicate: CrmLeadDuplicateCheckResult
  } | null> {
    const bucket = await this.loadBucket(identity)
    return bucket.blockedDuplicate ?? null
  }

  async loadActiveDraft(identity: CrmDraftIdentity): Promise<CrmLeadDraft | null> {
    const bucket = await this.loadBucket(identity)
    return bucket.drafts.find((draft) => draft.draftId === bucket.activeDraftId) ?? null
  }

  async loadPendingCapture(identity: CrmDraftIdentity): Promise<CrmLeadCapturePayload | null> {
    const bucket = await this.loadBucket(identity)
    return bucket.pendingCapture ?? null
  }

  async loadDraftState(identity: CrmDraftIdentity): Promise<CrmLeadDraftState> {
    const bucket = await this.loadBucket(identity)
    return {
      activeDraft: bucket.drafts.find((draft) => draft.draftId === bucket.activeDraftId) ?? null,
      blockedDuplicate: bucket.blockedDuplicate ?? null,
      pendingCapture: bucket.pendingCapture ?? null,
      savedDrafts: bucket.drafts.filter((draft) => Boolean(draft.savedAt))
    }
  }

  async markSubmitted(identity: CrmDraftIdentity, draftId: string): Promise<void> {
    await this.deleteDraft(identity, draftId)
  }

  async restoreSavedDraft(identity: CrmDraftIdentity, draftId: string): Promise<CrmLeadDraft | null> {
    const bucket = await this.loadBucket(identity)
    const draft = bucket.drafts.find((item) => item.draftId === draftId && item.savedAt)
    if (!draft) {
      return null
    }

    bucket.activeDraftId = draft.draftId
    bucket.pendingCapture = undefined
    await this.saveBucket(identity, bucket)
    return draft
  }

  async saveActiveDraft(identity: CrmDraftIdentity): Promise<CrmLeadDraft> {
    const bucket = await this.loadBucket(identity)
    const active = bucket.drafts.find((draft) => draft.draftId === bucket.activeDraftId)
    if (!active) {
      throw new Error('Active CRM draft is missing')
    }

    const saved = {
      ...active,
      dirty: false,
      savedAt: this.now(),
      updatedAt: this.now()
    }
    bucket.drafts = bucket.drafts.map((draft) => draft.draftId === saved.draftId ? saved : draft)
    await this.saveBucket(identity, bucket)
    return saved
  }

  async setPendingCapture(identity: CrmDraftIdentity, capture: CrmLeadCapturePayload | null): Promise<void> {
    const bucket = await this.loadBucket(identity)
    bucket.pendingCapture = capture ?? undefined
    await this.saveBucket(identity, bucket)
  }

  async setBlockedDuplicate(
    identity: CrmDraftIdentity,
    blockedDuplicate: { capture: CrmLeadCapturePayload; duplicate: CrmLeadDuplicateCheckResult } | null
  ): Promise<void> {
    const bucket = await this.loadBucket(identity)
    bucket.blockedDuplicate = blockedDuplicate ?? undefined
    await this.saveBucket(identity, bucket)
  }

  async updateActiveDraft(identity: CrmDraftIdentity, fields: CrmLeadDraftFields): Promise<CrmLeadDraft> {
    const bucket = await this.loadBucket(identity)
    const active = bucket.drafts.find((draft) => draft.draftId === bucket.activeDraftId)
    if (!active) {
      throw new Error('Active CRM draft is missing')
    }

    const updated = {
      ...active,
      dirty: true,
      fields,
      updatedAt: this.now()
    }
    bucket.drafts = bucket.drafts.map((draft) => draft.draftId === updated.draftId ? updated : draft)
    await this.saveBucket(identity, bucket)
    return updated
  }

  private async loadBucket(identity: CrmDraftIdentity): Promise<DraftBucket> {
    return normalizeBucket(await this.storage.get(buildCrmLeadDraftStorageKey(identity)))
  }

  private async saveBucket(identity: CrmDraftIdentity, bucket: DraftBucket): Promise<void> {
    const key = buildCrmLeadDraftStorageKey(identity)
    if (!bucket.activeDraftId && bucket.drafts.length === 0 && !bucket.pendingCapture && !bucket.blockedDuplicate) {
      await this.storage.remove(key)
      return
    }

    await this.storage.set(key, bucket)
  }
}

// Coordinates context-menu captures, duplicate checks, conflict resolution, and CRM Draft Lead submission.
export class CrmLeadDraftCaptureFlow {
  constructor(
    private readonly options: {
      api: CrmLeadDraftApi
      onStateChanged?: () => Promise<void>
      refreshCrmTags?: () => Promise<void>
      store: CrmLeadDraftStore
    }
  ) {}

  async beginCapture(
    identity: CrmDraftIdentity,
    capture: CrmLeadCapturePayload
  ): Promise<CrmLeadDraftFlowResult> {
    const active = await this.options.store.loadActiveDraft(identity)
    if (active?.dirty) {
      await this.options.store.setPendingCapture(identity, capture)
      await this.notifyStateChanged()
      return {
        activeDraft: active,
        pendingCapture: capture,
        status: 'ACTIVE_DRAFT_CONFLICT'
      }
    }

    return this.createDraftAfterDuplicateCheck(identity, capture)
  }

  async resolvePendingCapture(
    identity: CrmDraftIdentity,
    resolution: CrmLeadDraftConflictResolution
  ): Promise<CrmLeadDraftFlowResult> {
    const pendingCapture = await this.options.store.loadPendingCapture(identity)
    const active = await this.options.store.loadActiveDraft(identity)
    if (!pendingCapture) {
      throw new Error('Pending CRM capture is missing')
    }
    if (resolution === 'CONTINUE_CURRENT') {
      await this.options.store.setPendingCapture(identity, null)
      await this.notifyStateChanged()
      if (!active) {
        throw new Error('Active CRM draft is missing')
      }
      return { draft: active, status: 'DRAFT_READY' }
    }
    if (resolution === 'SAVE_CURRENT_AND_CREATE_NEW' && active) {
      await this.updateOesDraft(identity, active)
      await this.options.store.saveActiveDraft(identity)
      await this.options.store.clearActiveDraft(identity)
    }
    if (resolution === 'DISCARD_CURRENT_AND_CREATE_NEW' && active) {
      await this.options.store.deleteDraft(identity, active.draftId)
    }

    return this.createDraftAfterDuplicateCheck(identity, pendingCapture)
  }

  async submitActiveDraft(identity: CrmDraftIdentity): Promise<unknown> {
    const active = await this.options.store.loadActiveDraft(identity)
    if (!active) {
      throw new Error('Active CRM draft is missing')
    }

    await this.updateOesDraft(identity, active)
    const result = await this.options.api.submitDraftLead?.(requireTenantId(identity), active.draftId, {
      assignmentIntent: active.fields.assigneeIntent === 'CURRENT_OPERATOR' ? 'OWNED_BY_OPERATOR' : undefined,
      duplicateWarningAcknowledged: false
    })
    await this.options.store.markSubmitted(identity, active.draftId)
    await this.notifyStateChanged()
    await this.options.refreshCrmTags?.()
    return result
  }

  private async createDraftAfterDuplicateCheck(
    identity: CrmDraftIdentity,
    capture: CrmLeadCapturePayload
  ): Promise<CrmLeadDraftFlowResult> {
    await this.options.store.setBlockedDuplicate(identity, null)
    await this.notifyStateChanged()

    const duplicate = await this.options.api.checkDuplicate(buildLeadRequestFromCapture(capture))
    if (isDuplicateBlocked(duplicate)) {
      await this.options.store.setPendingCapture(identity, null)
      await this.options.store.setBlockedDuplicate(identity, { capture, duplicate })
      await this.notifyStateChanged()
      return { capture, duplicate, status: 'DUPLICATE_BLOCKED' }
    }

    await this.options.store.setBlockedDuplicate(identity, null)
    const created = await this.options.api.createDraftLead(buildLeadRequestFromCapture(capture))
    const draft = await this.options.store.createActiveDraft(identity, capture, created.crmAccount)
    await this.notifyStateChanged()
    return { draft, status: 'DRAFT_READY' }
  }

  private async updateOesDraft(identity: CrmDraftIdentity, draft: CrmLeadDraft): Promise<void> {
    await this.options.api.updateDraftLead?.(
      requireTenantId(identity),
      draft.draftId,
      buildDraftLeadUpdateRequestFromDraft(draft)
    )
  }

  private async notifyStateChanged(): Promise<void> {
    await this.options.onStateChanged?.()
  }
}

function requireTenantId(identity: CrmDraftIdentity): string {
  if (!identity.tenantId) {
    throw new Error('CRM tenant context is missing')
  }

  return identity.tenantId
}

// Persists CRM Lead draft buckets through chrome.storage.local with a browser-preview localStorage fallback.
export class ChromeCrmLeadDraftStorage implements CrmLeadDraftStorage {
  async get(key: string): Promise<unknown> {
    const storage = resolveChromeStorage()
    if (storage) {
      const result = await storage.get(key)
      return result[key]
    }

    const raw = globalThis.localStorage?.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  }

  async remove(key: string): Promise<void> {
    const storage = resolveChromeStorage()
    if (storage) {
      await storage.remove(key)
      return
    }

    globalThis.localStorage?.removeItem(key)
  }

  async set(key: string, value: unknown): Promise<void> {
    const storage = resolveChromeStorage()
    if (storage) {
      await storage.set({ [key]: value })
      return
    }

    globalThis.localStorage?.setItem(key, JSON.stringify(value))
  }
}

// Provides deterministic in-memory CRM Lead draft persistence for unit tests.
export class MemoryCrmLeadDraftStorage implements CrmLeadDraftStorage {
  private readonly values = new Map<string, unknown>()

  async get(key: string): Promise<unknown> {
    return this.values.get(key)
  }

  async remove(key: string): Promise<void> {
    this.values.delete(key)
  }

  async set(key: string, value: unknown): Promise<void> {
    this.values.set(key, value)
  }
}

// Builds the local storage key that enforces tenant and account isolation for plugin drafts.
export function buildCrmLeadDraftStorageKey(identity: CrmDraftIdentity): string {
  return [
    'crm-lead-drafts',
    normalizeKeyPart(identity.tenantId),
    normalizeKeyPart(identity.accountId)
  ].join(':')
}

// Builds the duplicate-check request from browser capture evidence before a plugin draft exists.
export function buildLeadRequestFromCapture(capture: CrmLeadCapturePayload): ExtensionLeadRequest {
  return {
    capture,
    displayName: capture.companyNameCandidates[0] || capture.targetTitle || capture.targetDomain,
    leadCompanyName: capture.companyNameCandidates[0],
    leadDomain: capture.targetDomain,
    leadEmail: capture.visibleEmails[0],
    leadPhone: capture.visiblePhones[0],
    priority: 'C'
  }
}

function buildDraft(
  capture: CrmLeadCapturePayload,
  now: string,
  oesDraft?: ExtensionCrmAccountSummary
): CrmLeadDraft {
  return {
    capture,
    createdAt: now,
    dirty: false,
    draftId: oesDraft?.crmAccountId || createDraftId(),
    fields: {
      assigneeIntent: '',
      companyName: oesDraft?.displayName || capture.companyNameCandidates[0] || capture.targetTitle,
      country: '',
      domain: oesDraft?.leadDomain || capture.targetDomain,
      email: oesDraft?.leadEmail || capture.visibleEmails[0] || '',
      phone: oesDraft?.leadPhone || capture.visiblePhones[0] || '',
      priority: oesDraft?.priority || 'C',
      sourceNote: ''
    },
    oesDraft,
    updatedAt: now
  }
}

function createDraftId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isDuplicateBlocked(result: CrmLeadDuplicateCheckResult): boolean {
  if (result.duplicateResult?.resultType && result.duplicateResult.resultType !== 'NO_DUPLICATE') {
    return true
  }

  return Array.isArray(result.allowedActions) && !result.allowedActions.includes('CREATE_DRAFT_LEAD')
}

function normalizeBucket(value: unknown): DraftBucket {
  if (!value || typeof value !== 'object') {
    return { drafts: [] }
  }

  const bucket = value as Partial<DraftBucket>
  return {
    activeDraftId: typeof bucket.activeDraftId === 'string' ? bucket.activeDraftId : undefined,
    blockedDuplicate: bucket.blockedDuplicate,
    drafts: Array.isArray(bucket.drafts) ? bucket.drafts : [],
    pendingCapture: bucket.pendingCapture
  }
}

function normalizeKeyPart(value: string | null | undefined): string {
  return value?.trim() || 'none'
}

function resolveChromeStorage(): chrome.storage.StorageArea | undefined {
  return globalThis.chrome?.storage?.local
}

function resolveHostname(value: string): string {
  try {
    return new URL(value).hostname
  } catch {
    return ''
  }
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}
