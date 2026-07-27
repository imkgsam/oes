import { ForbiddenException, Injectable } from '@nestjs/common'
import { CRM_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { PermissionAccessSummaryGrpcAdapter } from '../auth-bff/infrastructure/downstream/permission-service/permission-access-summary-grpc.adapter'
import { CustomerManagementService } from './customer-management.service'

type ExtensionCrmStatus =
  | 'CUSTOMER'
  | 'OTHER_OWNER_LEAD'
  | 'OWNED_LEAD'
  | 'POOL_LEAD'
  | 'POSSIBLE_DUPLICATE'
  | 'PROSPECT_CUSTOMER'
  | 'RESTRICTED'
  | 'UNKNOWN'

type ExtensionCrmAction =
  | 'CHECK_DUPLICATE'
  | 'CLAIM_POOL_LEAD'
  | 'CREATE_ACTIVE_LEAD'
  | 'CREATE_DRAFT_LEAD'
  | 'OPEN_OES_DETAIL'

interface ExtensionPageSignals {
  capturedAt: string
  companyNameCandidates?: string[]
  domain: string
  pageKind: string
  selectedText?: string
  socialLinks?: string[]
  title: string
  url: string
  visibleEmails?: string[]
  visiblePhones?: string[]
}

interface ExtensionSearchResultSignal {
  domain: string
  snippet?: string
  title: string
  url: string
}

interface ExtensionLeadCapture extends Record<string, unknown> {
  browserContext: {
    entryPoint: string
    workspace: string
  }
  capturedAt: string
  captureKind: string
  companyNameCandidates?: string[]
  sourcePageTitle: string
  sourcePageUrl: string
  targetDomain: string
  targetTitle: string
  targetUrl: string
  socialLinks?: string[]
  visibleEmails?: string[]
  visiblePhones?: string[]
}

interface AccountProfileItemInput {
  itemType?: string
  normalizedValue?: string
  rawValue?: string
  label?: string
  role?: string
}

interface LeadInput {
  capture?: ExtensionLeadCapture
  displayName: string
  duplicateWarningAcknowledged?: boolean
  leadCompanyName?: string
  leadCountry?: string
  leadDomain?: string
  leadEmail?: string
  leadPhone?: string
  partyTypeHint?: string
  priority?: string
  profileItems?: AccountProfileItemInput[]
  sourceNote?: string
  page?: ExtensionPageSignals
}

interface CrmAccountView {
  archiveReason?: string
  archivedAt?: string
  crmAccountId?: string
  displayName?: string
  lifecycleStage?: string
  leadDomain?: string
  leadEmail?: string
  ownerAccountId?: string
  ownerDisplayName?: string
  recordStatus?: string
  createdAt?: string
  lastActivityAt?: string
  nextFollowUpAt?: string
}

interface DuplicateCandidate {
  archiveReason?: string
  archivedAt?: string
  confidence?: string
  crmAccountId?: string
  displayName?: string
  lifecycleStage?: string
  matchedFields?: string[]
  ownerAccountId?: string
  ownerDisplayName?: string
  recordStatus?: string
}

interface ExtensionActionContext {
  actionCodes: string[]
}

// Composes extension-safe CRM workspace view models from existing CRM P1 BFF use cases.
@Injectable()
export class ExtensionCrmWorkspaceService {
  constructor(
    private readonly customerManagementService: CustomerManagementService,
    private readonly permissionAccessSummaryAdapter: PermissionAccessSummaryGrpcAdapter
  ) {}

  /** resolvePageContext converts current-page signals into extension CRM status and allowed actions. */
  async resolvePageContext(input: { page: ExtensionPageSignals }, source: DownstreamRequestSource) {
    assertBrowserExtensionSource(source)
    const tenantId = resolveTenantId(source)
    const actionContext = await this.resolveActionContext(source)
    const duplicate = await this.customerManagementService.checkLeadDuplicate(
      tenantId,
      toDuplicateInput(input.page),
      source
    )

    const duplicateResult = await this.hydrateArchivedDuplicateResult(
      tenantId,
      duplicate.duplicateResult,
      source
    )

    return this.renderResolvedPage(input.page, duplicateResult, source, actionContext, true)
  }

  /** resolveSearchResults returns low-sensitivity read-only statuses for search result candidates. */
  async resolveSearchResults(
    input: {
      capturedAt: string
      query: string
      results: ExtensionSearchResultSignal[]
      searchEngine: string
    },
    source: DownstreamRequestSource
  ) {
    assertBrowserExtensionSource(source)
    const tenantId = resolveTenantId(source)
    const resolvedResults = await Promise.all(
      input.results.slice(0, 10).map(async (result) => {
        const duplicate = await this.customerManagementService.checkLeadDuplicate(
          tenantId,
          {
            displayName: result.title,
            leadCompanyName: result.title,
            leadDomain: result.domain
          },
          source
        )
        const duplicateResult = await this.hydrateArchivedDuplicateResult(
          tenantId,
          duplicate.duplicateResult,
          source
        )
        return {
          ...this.renderResolvedCandidate(
            result,
            duplicateResult,
            source,
            { actionCodes: [] },
            false
          ),
          allowedActions: []
        }
      })
    )

    return { results: resolvedResults.filter((result) => result.status !== 'UNKNOWN') }
  }

  /** checkDuplicate runs the explicit CRM duplicate check and returns extension-safe actions. */
  async checkDuplicate(input: LeadInput, source: DownstreamRequestSource) {
    assertBrowserExtensionSource(source)
    const tenantId = resolveTenantId(source)
    const actionContext = await this.resolveActionContext(source)
    const result = await this.customerManagementService.checkLeadDuplicate(
      tenantId,
      toLeadDuplicateInput(input),
      source
    )
    const duplicateResult = await this.hydrateArchivedDuplicateResult(
      tenantId,
      result.duplicateResult,
      source
    )

    return {
      duplicateResult: {
        resultType: duplicateResult.resultType,
        candidates: (duplicateResult.candidates ?? []).map((candidate) =>
          renderDuplicateHint(candidate, source)
        )
      },
      allowedActions: resolveActionsForDuplicate(duplicateResult, source, actionContext, true)
    }
  }

  /** createDraftLead creates one extension-sourced CRM draft lead. */
  async createDraftLead(input: LeadInput, source: DownstreamRequestSource) {
    assertBrowserExtensionSource(source)
    const crmAccount = await this.customerManagementService.createDraftLead(
      resolveTenantId(source),
      toLeadCreateInput(input),
      source
    )

    return {
      crmAccount: renderAccountSummary(crmAccount, source),
      allowedActions: ['OPEN_OES_DETAIL'],
      deepLinks: renderDeepLinks(crmAccount)
    }
  }

  /** createActiveLead creates one owned active lead from browser extension evidence. */
  async createActiveLead(input: LeadInput, source: DownstreamRequestSource) {
    assertBrowserExtensionSource(source)
    const result = await this.customerManagementService.createLead(
      resolveTenantId(source),
      {
        ...toLeadCreateInput(input),
        assignmentIntent: 'OWNED_BY_OPERATOR',
        claimForCurrentUser: false,
        duplicateWarningAcknowledged: Boolean(input.duplicateWarningAcknowledged),
        sourceType: 'BROWSER_EXTENSION'
      },
      source
    )

    return {
      resultType: result.resultType,
      crmAccount: renderAccountSummary(result.crmAccount, source),
      duplicateResult: result.duplicateResult,
      allowedActions: result.crmAccount ? ['OPEN_OES_DETAIL'] : [],
      deepLinks: renderDeepLinks(result.crmAccount)
    }
  }

  /** claimPoolLead claims one ownerless active Lead and renders the extension status. */
  async claimPoolLead(crmAccountId: string, source: DownstreamRequestSource) {
    assertBrowserExtensionSource(source)
    const crmAccount = await this.customerManagementService.claimCrmAccount(
      resolveTenantId(source),
      crmAccountId,
      source
    )

    return {
      crmAccount: renderAccountSummary(crmAccount, source),
      status: 'OWNED_LEAD' as ExtensionCrmStatus,
      allowedActions: ['OPEN_OES_DETAIL'],
      deepLinks: renderDeepLinks(crmAccount)
    }
  }

  /** getAccountSummary returns one extension-safe CRM account summary and deep link. */
  async getAccountSummary(crmAccountId: string, source: DownstreamRequestSource) {
    assertBrowserExtensionSource(source)
    const crmAccount = await this.customerManagementService.getCrmAccount(
      resolveTenantId(source),
      crmAccountId,
      source
    )
    const status = statusFromAccount(crmAccount, source)

    return {
      crmAccount: renderAccountSummary(crmAccount, source),
      status,
      allowedActions: crmAccount ? ['OPEN_OES_DETAIL'] : [],
      deepLinks: renderDeepLinks(crmAccount)
    }
  }

  private renderResolvedPage(
    page: ExtensionPageSignals,
    duplicateResult: { resultType: string; candidates?: DuplicateCandidate[] },
    source: DownstreamRequestSource,
    actionContext: ExtensionActionContext,
    allowMutations: boolean
  ) {
    const rendered = this.renderResolvedCandidate(
      {
        domain: page.domain,
        title: page.title,
        url: page.url
      },
      duplicateResult,
      source,
      actionContext,
      allowMutations
    )

    return {
      ...rendered,
      page: {
        domain: page.domain,
        pageKind: page.pageKind,
        title: page.title
      }
    }
  }

  private renderResolvedCandidate(
    page: { domain: string; title: string; url: string },
    duplicateResult: { resultType: string; candidates?: DuplicateCandidate[] },
    source: DownstreamRequestSource,
    actionContext: ExtensionActionContext,
    allowMutations: boolean
  ) {
    const candidate = duplicateResult.candidates?.[0]
    const status = statusFromDuplicate(duplicateResult, source)
    const matchedAccount = shouldExposeMatchedAccount(status)
      ? renderAccountSummary(candidateToAccount(candidate), source)
      : null

    return {
      url: page.url,
      domain: page.domain,
      title: page.title,
      status,
      archiveReason: matchedAccount?.archiveReason ?? '',
      archivedAt: matchedAccount?.archivedAt ?? '',
      summary: renderStatusSummary(status, candidate?.displayName || page.title),
      matchedAccount,
      duplicateHints: (duplicateResult.candidates ?? []).map((item) =>
        renderDuplicateHint(item, source)
      ),
      allowedActions: resolveActionsForDuplicate(
        duplicateResult,
        source,
        actionContext,
        allowMutations
      ),
      deepLinks: renderDeepLinks(matchedAccount)
    }
  }

  private async resolveActionContext(
    source: DownstreamRequestSource
  ): Promise<ExtensionActionContext> {
    const accountId = currentAccountId(source)
    if (!accountId) {
      throw new ForbiddenException('extension CRM workspace requires account context')
    }

    const summary = await this.permissionAccessSummaryAdapter.getAccountAccessSummary(
      {
        accountId,
        tenantId: resolveTenantId(source),
        scopeLevel: 'TENANT'
      },
      source
    )

    return {
      actionCodes: mergeActionCodes(summary.actionCodes, source.user?.permissions)
    }
  }

  /** hydrateArchivedDuplicateResult attaches archive details through the existing account detail query. */
  private async hydrateArchivedDuplicateResult(
    tenantId: string,
    duplicateResult: { resultType: string; candidates?: DuplicateCandidate[] },
    source: DownstreamRequestSource
  ): Promise<{ resultType: string; candidates?: DuplicateCandidate[] }> {
    const candidates = await Promise.all(
      (duplicateResult.candidates ?? []).map(async (candidate) => {
        if (candidate.recordStatus !== 'ARCHIVED' || !candidate.crmAccountId) {
          return candidate
        }

        const account = await this.customerManagementService.getCrmAccount(
          tenantId,
          candidate.crmAccountId,
          source
        )

        return {
          ...candidate,
          archiveReason: account?.archiveReason ?? candidate.archiveReason,
          archivedAt: account?.archivedAt ?? candidate.archivedAt,
          displayName: account?.displayName ?? candidate.displayName,
          lifecycleStage: account?.lifecycleStage ?? candidate.lifecycleStage,
          ownerAccountId: account?.ownerAccountId ?? candidate.ownerAccountId,
          ownerDisplayName: account?.ownerDisplayName ?? candidate.ownerDisplayName,
          recordStatus: account?.recordStatus ?? candidate.recordStatus
        }
      })
    )

    return {
      ...duplicateResult,
      candidates
    }
  }
}

function assertBrowserExtensionSource(source: DownstreamRequestSource): void {
  if (source.user?.terminal !== 'BROWSER_EXTENSION') {
    throw new ForbiddenException('extension CRM workspace requires browser extension terminal')
  }
}

function resolveTenantId(source: DownstreamRequestSource): string {
  const tenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)
  if (!tenantId) {
    throw new ForbiddenException('extension CRM workspace requires tenant context')
  }

  return tenantId
}

function toDuplicateInput(page: ExtensionPageSignals) {
  return {
    displayName: page.companyNameCandidates?.[0] || page.title,
    leadCompanyName: page.companyNameCandidates?.[0] || page.title,
    leadDomain: page.domain,
    leadEmail: page.visibleEmails?.[0],
    leadPhone: page.visiblePhones?.[0],
    profileItems: buildExtensionProfileItems({
      domain: page.domain,
      emails: page.visibleEmails,
      phones: page.visiblePhones,
      socialLinks: page.socialLinks
    })
  }
}

function toLeadDuplicateInput(input: LeadInput) {
  return {
    displayName: input.displayName,
    leadCompanyName: input.leadCompanyName ?? input.capture?.companyNameCandidates?.[0],
    leadCountry: input.leadCountry,
    leadDomain: input.leadDomain ?? input.capture?.targetDomain,
    leadEmail: input.leadEmail ?? input.capture?.visibleEmails?.[0],
    leadPhone: input.leadPhone ?? input.capture?.visiblePhones?.[0],
    profileItems: buildExtensionProfileItems({
      explicit: input.profileItems,
      domain: input.leadDomain ?? input.capture?.targetDomain,
      emails: [input.leadEmail, ...(input.capture?.visibleEmails ?? [])],
      phones: [input.leadPhone, ...(input.capture?.visiblePhones ?? [])],
      socialLinks: input.capture?.socialLinks
    })
  }
}

function toLeadCreateInput(input: LeadInput) {
  const sourceCapture = input.capture ?? toLegacyCapture(input.page)

  return {
    displayName: input.displayName,
    partyTypeHint: input.partyTypeHint ?? 'ORGANIZATION',
    leadCompanyName: input.leadCompanyName,
    leadDomain: input.leadDomain,
    leadEmail: input.leadEmail,
    leadPhone: input.leadPhone,
    leadCountry: input.leadCountry,
    profileItems: buildExtensionProfileItems({
      explicit: input.profileItems,
      domain: input.leadDomain ?? sourceCapture?.targetDomain,
      emails: [input.leadEmail, ...(sourceCapture?.visibleEmails ?? [])],
      phones: [input.leadPhone, ...(sourceCapture?.visiblePhones ?? [])],
      socialLinks: sourceCapture?.socialLinks
    }),
    priority: input.priority ?? 'C',
    sourceType: 'BROWSER_EXTENSION',
    sourceName: 'Browser CRM capture',
    sourceCapturedAt: sourceCapture?.capturedAt,
    sourceExternalReference: sourceCapture?.targetUrl,
    sourceRawPayload: sourceCapture,
    sourceNote: input.sourceNote ?? 'Captured from browser extension.'
  }
}

/** toLegacyCapture maps pre-capture page signals into the standard rawPayload shape for backward compatibility. */
function toLegacyCapture(page: ExtensionPageSignals | undefined): ExtensionLeadCapture | undefined {
  if (!page) {
    return undefined
  }

  return {
    browserContext: { entryPoint: 'CONTEXT_MENU', workspace: 'CRM' },
    capturedAt: page.capturedAt,
    captureKind: 'CURRENT_PAGE',
    companyNameCandidates: page.companyNameCandidates,
    sourcePageTitle: page.title,
    sourcePageUrl: page.url,
    targetDomain: page.domain,
    targetTitle: page.title,
    targetUrl: page.url,
    socialLinks: page.socialLinks,
    visibleEmails: page.visibleEmails,
    visiblePhones: page.visiblePhones
  }
}

/** buildExtensionProfileItems turns bounded browser evidence into CRM account-level profile items. */
function buildExtensionProfileItems(input: {
  explicit?: AccountProfileItemInput[]
  domain?: string
  emails?: Array<string | undefined>
  phones?: Array<string | undefined>
  socialLinks?: string[]
}): AccountProfileItemInput[] {
  const drafts: AccountProfileItemInput[] = [
    ...(input.explicit ?? []),
    profileItem('DOMAIN', input.domain, input.domain, 'captured domain'),
    ...(input.emails ?? []).map((email) => profileItem('EMAIL', email, email, 'visible email')),
    ...(input.phones ?? []).map((phone) => profileItem('PHONE', phone, phone, 'visible phone')),
    ...(input.socialLinks ?? []).map((link) =>
      profileItem('SOCIAL_PROFILE', link, link, 'social link')
    )
  ].filter((item): item is AccountProfileItemInput =>
    Boolean(item?.itemType && item.normalizedValue)
  )
  const seen = new Set<string>()

  return drafts.filter((item) => {
    const key = `${normalize(item.itemType) ?? ''}:${normalize(item.normalizedValue)?.toLowerCase() ?? ''}`
    if (!key || seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/** profileItem creates one extension profile item draft from nonblank captured text. */
function profileItem(
  itemType: string,
  normalizedValue?: string,
  rawValue?: string,
  label?: string
): AccountProfileItemInput | null {
  const normalized = normalize(normalizedValue)
  if (!normalized) {
    return null
  }
  return {
    itemType,
    normalizedValue: normalized,
    rawValue: normalize(rawValue) ?? normalized,
    label
  }
}

function resolveActionsForDuplicate(
  duplicateResult: { resultType: string; candidates?: DuplicateCandidate[] },
  source: DownstreamRequestSource,
  actionContext: ExtensionActionContext,
  allowMutations: boolean
): ExtensionCrmAction[] {
  const status = statusFromDuplicate(duplicateResult, source)
  if (isArchivedDuplicate(duplicateResult)) {
    return status === 'OTHER_OWNER_LEAD' || status === 'RESTRICTED' ? [] : ['OPEN_OES_DETAIL']
  }

  if (status === 'POOL_LEAD') {
    return hasAction(actionContext, CRM_MANAGEMENT_PERMISSION_CODES.CLAIM_CRM_ACCOUNT)
      ? ['CLAIM_POOL_LEAD', 'OPEN_OES_DETAIL']
      : ['OPEN_OES_DETAIL']
  }

  if (status === 'OWNED_LEAD' || status === 'PROSPECT_CUSTOMER' || status === 'CUSTOMER') {
    return ['OPEN_OES_DETAIL']
  }

  if (status === 'OTHER_OWNER_LEAD' || status === 'RESTRICTED') {
    return []
  }

  if (!allowMutations) {
    return []
  }

  const actions: ExtensionCrmAction[] = ['CHECK_DUPLICATE']
  if (hasAction(actionContext, CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT)) {
    actions.push('CREATE_DRAFT_LEAD', 'CREATE_ACTIVE_LEAD')
  }

  return status === 'POSSIBLE_DUPLICATE'
    ? actions.filter((action) => action !== 'CREATE_ACTIVE_LEAD')
    : actions
}

function isArchivedDuplicate(duplicateResult: { candidates?: DuplicateCandidate[] }): boolean {
  return duplicateResult.candidates?.[0]?.recordStatus === 'ARCHIVED'
}

function statusFromDuplicate(
  duplicateResult: { resultType: string; candidates?: DuplicateCandidate[] },
  source: DownstreamRequestSource
): ExtensionCrmStatus {
  const candidate = duplicateResult.candidates?.[0]
  if (duplicateResult.resultType === 'NO_DUPLICATE') {
    return 'UNKNOWN'
  }
  if (duplicateResult.resultType === 'RESTRICTED_DUPLICATE') {
    return 'RESTRICTED'
  }
  if (duplicateResult.resultType === 'POSSIBLE_DUPLICATE') {
    return 'POSSIBLE_DUPLICATE'
  }
  if (duplicateResult.resultType === 'CLAIMABLE_EXISTING') {
    return 'POOL_LEAD'
  }
  if (duplicateResult.resultType === 'OWNED_DUPLICATE') {
    return 'OWNED_LEAD'
  }

  return statusFromAccount(candidateToAccount(candidate), source)
}

function statusFromAccount(
  account: CrmAccountView | null | undefined,
  source: DownstreamRequestSource
): ExtensionCrmStatus {
  if (!account) {
    return 'UNKNOWN'
  }
  if (account.lifecycleStage === 'CUSTOMER') {
    return 'CUSTOMER'
  }
  if (account.lifecycleStage === 'PROSPECT_CUSTOMER') {
    return 'PROSPECT_CUSTOMER'
  }
  if (normalize(account.ownerAccountId) === currentAccountId(source)) {
    return 'OWNED_LEAD'
  }
  if (!normalize(account.ownerAccountId) && account.lifecycleStage === 'LEAD') {
    return 'POOL_LEAD'
  }
  if (normalize(account.ownerAccountId)) {
    return 'OTHER_OWNER_LEAD'
  }
  if (account.recordStatus === 'ARCHIVED' && normalize(account.crmAccountId)) {
    return 'POOL_LEAD'
  }

  return 'UNKNOWN'
}

function renderAccountSummary(
  account: CrmAccountView | null | undefined,
  source: DownstreamRequestSource
) {
  if (!account) {
    return null
  }

  const status = statusFromAccount(account, source)
  const restricted = status === 'OTHER_OWNER_LEAD' || status === 'RESTRICTED'
  return {
    archiveReason: account.archiveReason ?? '',
    archivedAt: account.archivedAt ?? '',
    crmAccountId: account.crmAccountId ?? '',
    displayName: account.displayName ?? '',
    recordStatus: account.recordStatus ?? '',
    lifecycleStage: account.lifecycleStage ?? '',
    ownerKind: resolveOwnerKind(account, source),
    ownerAccountId: restricted ? '' : (account.ownerAccountId ?? ''),
    ownerDisplayName: restricted ? '' : (account.ownerDisplayName ?? ''),
    leadDomain: restricted ? '' : (account.leadDomain ?? ''),
    leadEmail: restricted ? '' : (account.leadEmail ?? ''),
    createdAt: account.createdAt ?? '',
    lastActivityAt: account.lastActivityAt ?? '',
    nextFollowUpAt: account.nextFollowUpAt ?? ''
  }
}

function renderDuplicateHint(candidate: DuplicateCandidate, source: DownstreamRequestSource) {
  const account = candidateToAccount(candidate)
  const status = statusFromAccount(account, source)
  const restricted = status === 'OTHER_OWNER_LEAD' || status === 'RESTRICTED'
  return {
    archiveReason: restricted ? '' : (candidate.archiveReason ?? ''),
    archivedAt: restricted ? '' : (candidate.archivedAt ?? ''),
    crmAccountId: restricted ? '' : (candidate.crmAccountId ?? ''),
    displayName: candidate.displayName ?? '',
    lifecycleStage: candidate.lifecycleStage ?? '',
    ownerKind: resolveOwnerKind(account, source),
    ownerDisplayName: restricted ? '' : (candidate.ownerDisplayName ?? ''),
    matchedFields: candidate.matchedFields ?? [],
    confidence: candidate.confidence ?? ''
  }
}

function renderStatusSummary(status: ExtensionCrmStatus, displayName: string) {
  return {
    label: status,
    displayName,
    description:
      status === 'UNKNOWN' ? 'No visible CRM record was found.' : 'CRM status is available.',
    sensitivity: status === 'OTHER_OWNER_LEAD' || status === 'RESTRICTED' ? 'LOW' : 'LOW'
  }
}

function renderDeepLinks(account: CrmAccountView | null | undefined) {
  return {
    tenantWebCrmAccountUrl: account?.crmAccountId ? `/crm/accounts/${account.crmAccountId}` : ''
  }
}

function shouldExposeMatchedAccount(status: ExtensionCrmStatus): boolean {
  return ['CUSTOMER', 'OWNED_LEAD', 'POOL_LEAD', 'PROSPECT_CUSTOMER'].includes(status)
}

function candidateToAccount(
  candidate: DuplicateCandidate | null | undefined
): CrmAccountView | null {
  if (!candidate) {
    return null
  }

  return {
    crmAccountId: candidate.crmAccountId,
    archiveReason: candidate.archiveReason,
    archivedAt: candidate.archivedAt,
    displayName: candidate.displayName,
    lifecycleStage: candidate.lifecycleStage,
    ownerAccountId: candidate.ownerAccountId,
    ownerDisplayName: candidate.ownerDisplayName,
    recordStatus: candidate.recordStatus
  }
}

function resolveOwnerKind(account: CrmAccountView | null, source: DownstreamRequestSource): string {
  if (!account?.ownerAccountId) {
    return 'POOL'
  }
  return account.ownerAccountId === currentAccountId(source) ? 'SELF' : 'OTHER_OWNER'
}

function hasAction(actionContext: ExtensionActionContext, code: string): boolean {
  return actionContext.actionCodes.includes(code)
}

function currentAccountId(source: DownstreamRequestSource): string {
  return normalize(source.user?.aid) ?? normalize(source.user?.id) ?? ''
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized || undefined
}

function mergeActionCodes(...sources: Array<readonly string[] | undefined>): string[] {
  return [
    ...new Set(
      sources
        .flatMap((source) => source ?? [])
        .map((code) => code.trim())
        .filter(Boolean)
    )
  ]
}
