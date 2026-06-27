import { ExtensionAuthApi } from '../auth/api'
import { refreshStoredExtensionAccessToken } from '../auth/access-token'
import { ExtensionAuthStorage, type AuthStorage } from '../auth/storage'
import type { StoredAuthSession } from '../auth/types'
import { defaultTenantWebBaseUrl } from '../shared/tenant-web-url'
import { ExtensionCrmApi } from '../side-panel/crm-api'
import type { ExtensionCrmResolvedPage, ResolvePageContextRequest } from '../side-panel/crm-types'
import { CRM_WORKSPACE_KEY } from '../workspaces/workspace-registry'
import {
  CRM_FLOATING_PANEL_PREFERENCE_KEY,
  WorkspacePreferenceStore
} from '../workspaces/workspace-preferences'
import {
  clearCrmOfficialSitePanelInCurrentDocument,
  renderCrmOfficialSitePanelInCurrentDocument
} from './crm-official-site-panel'
import { collectCurrentPageSignals } from './page-signals'
import { isChromeTabUnavailableError } from './chrome-tab-errors'

type ScriptExecution = (options: {
  args?: unknown[]
  func: (...args: never[]) => unknown
  target: { tabId: number }
}) => Promise<Array<{ result?: unknown }>>

type CrmOfficialSiteApi = Pick<ExtensionCrmApi, 'resolvePageContext'>

export interface CrmOfficialSiteAutomationDependencies {
  api?: CrmOfficialSiteApi
  authStorage?: Pick<AuthStorage, 'load'>
  executeScript?: ScriptExecution
  tenantWebBaseUrl?: string
  workspacePreferences?: Pick<WorkspacePreferenceStore, 'isEnabled'> & Partial<Pick<WorkspacePreferenceStore, 'getPanelEnabled'>>
}

export interface CrmOfficialSiteTabSnapshot {
  id?: number
  url?: string
}

export interface CrmOfficialSiteRenderOptions {
  reopenClosedPanel?: boolean
}

// Identifies the official-site floating panel pipeline phase that produced a user-visible failure.
export type CrmOfficialSitePanelFailurePhase =
  | 'COLLECT_SIGNALS'
  | 'RESOLVE_PAGE_CONTEXT'
  | 'RENDER_PANEL'
  | 'CLEAR_PANEL'

// Captures whether one tab rendered, skipped for a normal reason, or failed with diagnostics.
export interface CrmOfficialSitePanelOutcome {
  error?: string
  failurePhase?: CrmOfficialSitePanelFailurePhase
  rendered: boolean
  skipped: boolean
}

// Detects normal customer website pages where the extension may show CRM context.
export function isSupportedOfficialSiteUrl(value: string | undefined): boolean {
  if (!value) {
    return false
  }

  try {
    const url = new URL(value)
    if (!/^https?:$/.test(url.protocol)) {
      return false
    }
    if (/(^|\.)google\.|(^|\.)bing\.|(^|\.)search\.yahoo\./i.test(url.hostname)) {
      return false
    }
    return true
  } catch {
    return false
  }
}

// Creates the background-owned CRM official-site floating panel automation.
export function createCrmOfficialSiteAutomation(dependencies: CrmOfficialSiteAutomationDependencies = {}) {
  const authStorage = dependencies.authStorage ?? new ExtensionAuthStorage()
  const authApi = new ExtensionAuthApi()
  const workspacePreferences = dependencies.workspacePreferences ?? new WorkspacePreferenceStore()
  const executeScript = dependencies.executeScript ?? executeChromeScript
  const tenantWebBaseUrl = dependencies.tenantWebBaseUrl ?? defaultTenantWebBaseUrl()
  const api = dependencies.api ?? new ExtensionCrmApi({
    accessTokenProvider: async () => (await authStorage.load())?.accessToken,
    refreshAccessTokenProvider: hasAuthSave(authStorage)
      ? async () => refreshStoredExtensionAccessToken({
        api: authApi,
        storage: authStorage
      })
      : undefined,
    workspaceEnabledProvider: async () => {
      const session = await authStorage.load()
      return isCrmFloatingPanelEnabled(session, workspacePreferences)
    }
  })

  return {
    renderTab: async (
      tab: CrmOfficialSiteTabSnapshot,
      options: CrmOfficialSiteRenderOptions = {}
    ): Promise<CrmOfficialSitePanelOutcome> => {
      if (!tab.id || !isSupportedOfficialSiteUrl(tab.url)) {
        return { rendered: false, skipped: true }
      }

      const session = await authStorage.load()
      const enabled = await isCrmFloatingPanelEnabled(session, workspacePreferences)
      if (!enabled) {
        return { rendered: false, skipped: true }
      }

      let pageContext: ResolvePageContextRequest | null
      try {
        const [signalResult] = await executeScript({
          func: collectCurrentPageSignals as (...args: never[]) => unknown,
          target: { tabId: tab.id }
        })
        pageContext = toPageContextRequest(signalResult?.result)
      } catch (caught) {
        if (isChromeTabUnavailableError(caught)) {
          return skipUnavailableTabAfterFailure(executeScript, tab.id)
        }
        return clearAndReportFailure(executeScript, tab.id, caught, 'COLLECT_SIGNALS')
      }

      if (!pageContext) {
        return clearOrReportUnsupportedPage(executeScript, tab.id)
      }

      let resolvedPage: unknown
      try {
        resolvedPage = await api.resolvePageContext(pageContext)
      } catch (caught) {
        return clearAndReportFailure(executeScript, tab.id, caught, 'RESOLVE_PAGE_CONTEXT')
      }

      if (!shouldRenderPanel(resolvedPage)) {
        return clearOrReportUnsupportedPage(executeScript, tab.id)
      }
      const renderablePage = withOfficialSitePageFallbacks(resolvedPage, pageContext.page)

      try {
        const [renderResult] = await executeScript({
          args: [{
            reopenClosedPanel: options.reopenClosedPanel === true,
            resolvedPage: renderablePage,
            tenantWebBaseUrl
          }],
          func: renderCrmOfficialSitePanelInCurrentDocument as (...args: never[]) => unknown,
          target: { tabId: tab.id }
        })

        return extractPanelOutcome(renderResult?.result)
      } catch (caught) {
        if (isChromeTabUnavailableError(caught)) {
          return skipUnavailableTabAfterFailure(executeScript, tab.id)
        }
        return clearAndReportFailure(executeScript, tab.id, caught, 'RENDER_PANEL')
      }
    },
    clearTab: async (tab: CrmOfficialSiteTabSnapshot): Promise<{ removedCount: number; skipped: boolean }> => {
      if (!tab.id || !isSupportedOfficialSiteUrl(tab.url)) {
        return { removedCount: 0, skipped: true }
      }

      const removedCount = await safeClearTabPanel(executeScript, tab.id)
      return { removedCount, skipped: false }
    }
  }
}

// Converts expected Chrome tab lifecycle races into a normal skipped render.
async function skipUnavailableTabAfterFailure(
  executeScript: ScriptExecution,
  tabId: number
): Promise<CrmOfficialSitePanelOutcome> {
  try {
    await safeClearTabPanel(executeScript, tabId)
  } catch {
    // Cleanup must not convert an already-closed tab into a user-visible failure.
  }
  return { rendered: false, skipped: true }
}

// Clears stale panel UI for unsupported pages while preserving real cleanup failures.
async function clearOrReportUnsupportedPage(
  executeScript: ScriptExecution,
  tabId: number
): Promise<CrmOfficialSitePanelOutcome> {
  try {
    await clearTabPanel(executeScript, tabId)
    return { rendered: false, skipped: true }
  } catch (caught) {
    if (isChromeTabUnavailableError(caught)) {
      return { rendered: false, skipped: true }
    }
    return failedPanelOutcome(caught, 'CLEAR_PANEL')
  }
}

// Reports the original render pipeline failure after a best-effort panel cleanup.
async function clearAndReportFailure(
  executeScript: ScriptExecution,
  tabId: number,
  error: unknown,
  phase: CrmOfficialSitePanelFailurePhase
): Promise<CrmOfficialSitePanelOutcome> {
  try {
    await safeClearTabPanel(executeScript, tabId)
  } catch {
    // Keep the original failure visible; cleanup is secondary diagnostic context.
  }
  return failedPanelOutcome(error, phase)
}

// Builds the diagnostic outcome that the background runtime can aggregate and surface.
function failedPanelOutcome(
  error: unknown,
  phase: CrmOfficialSitePanelFailurePhase
): CrmOfficialSitePanelOutcome {
  return {
    error: toErrorMessage(error),
    failurePhase: phase,
    rendered: false,
    skipped: false
  }
}

function hasAuthSave(storage: Pick<AuthStorage, 'load'>): storage is Pick<AuthStorage, 'load' | 'save'> {
  return typeof (storage as Partial<AuthStorage>).save === 'function'
}

async function executeChromeScript(options: {
  args?: unknown[]
  func: (...args: never[]) => unknown
  target: { tabId: number }
}): Promise<Array<{ result?: unknown }>> {
  return chrome.scripting.executeScript(options)
}

async function isCrmFloatingPanelEnabled(
  session: StoredAuthSession | null,
  workspacePreferences: Pick<WorkspacePreferenceStore, 'isEnabled'> & Partial<Pick<WorkspacePreferenceStore, 'getPanelEnabled'>>
): Promise<boolean> {
  if (!session?.accessToken) {
    return false
  }

  const identity = {
    accountId: session.context?.account?.accountId,
    panelKey: CRM_FLOATING_PANEL_PREFERENCE_KEY,
    tenantId: session.context?.tenant?.tenantId,
    workspaceKey: CRM_WORKSPACE_KEY
  }
  const panelEnabled = await workspacePreferences.getPanelEnabled?.(identity)
  return panelEnabled === true
}

function toPageContextRequest(value: unknown): ResolvePageContextRequest | null {
  if (!value || typeof value !== 'object' || !('page' in value)) {
    return null
  }

  const page = (value as ResolvePageContextRequest).page
  if (!page || page.pageKind !== 'OFFICIAL_SITE') {
    return null
  }

  return { page }
}

function shouldRenderPanel(value: unknown): value is ExtensionCrmResolvedPage {
  if (!value || typeof value !== 'object') {
    return false
  }

  const resolved = value as ExtensionCrmResolvedPage
  return resolved.status !== 'UNKNOWN' || hasVisibleCrmHint(resolved)
}

// Preserves the live browser page identity when the CRM resolver returns only account status data.
function withOfficialSitePageFallbacks(
  resolvedPage: ExtensionCrmResolvedPage,
  page: ResolvePageContextRequest['page']
): ExtensionCrmResolvedPage {
  const fallbackCrmAccountId = resolveVisibleCrmAccountId(resolvedPage)
  return {
    ...resolvedPage,
    deepLinks: {
      ...resolvedPage.deepLinks,
      tenantWebCrmAccountUrl: resolvedPage.deepLinks?.tenantWebCrmAccountUrl ||
        (fallbackCrmAccountId ? `/crm/accounts/${encodeURIComponent(fallbackCrmAccountId)}` : '')
    },
    domain: resolvedPage.domain || page.domain,
    title: resolvedPage.title || page.title,
    url: resolvedPage.url || page.url
  }
}

// Resolves a visible CRM account id that can back the Open OES action without exposing restricted records.
function resolveVisibleCrmAccountId(resolvedPage: ExtensionCrmResolvedPage): string {
  if (resolvedPage.matchedAccount?.crmAccountId) {
    return resolvedPage.matchedAccount.crmAccountId
  }

  return resolvedPage.duplicateHints?.find((hint) => hint.crmAccountId)?.crmAccountId ?? ''
}

// Detects extension-safe CRM hints that still represent a visible record when legacy status is unknown.
function hasVisibleCrmHint(resolved: ExtensionCrmResolvedPage): boolean {
  if (resolved.matchedAccount?.crmAccountId || resolved.matchedAccount?.displayName) {
    return true
  }

  return Boolean(
    resolved.duplicateHints?.some((hint) =>
      Boolean(hint.crmAccountId || hint.displayName || hint.ownerKind)
    )
  )
}

async function clearTabPanel(executeScript: ScriptExecution, tabId: number): Promise<number> {
  const [result] = await executeScript({
    func: clearCrmOfficialSitePanelInCurrentDocument as (...args: never[]) => unknown,
    target: { tabId }
  })

  if (result?.result && typeof result.result === 'object' && 'removedCount' in result.result) {
    const count = Number((result.result as { removedCount?: unknown }).removedCount)
    return Number.isFinite(count) ? count : 0
  }

  return 0
}

// safeClearTabPanel treats panel cleanup as best-effort because tabs can close between async steps.
async function safeClearTabPanel(executeScript: ScriptExecution, tabId: number): Promise<number> {
  try {
    return await clearTabPanel(executeScript, tabId)
  } catch (caught) {
    if (isChromeTabUnavailableError(caught)) {
      return 0
    }
    throw caught
  }
}

function extractPanelOutcome(value: unknown): CrmOfficialSitePanelOutcome {
  if (value && typeof value === 'object') {
    const result = value as { rendered?: unknown; skipped?: unknown }
    return {
      rendered: result.rendered === true,
      skipped: result.skipped === true
    }
  }

  return { rendered: false, skipped: true }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || 'CRM floating panel failed')
}
