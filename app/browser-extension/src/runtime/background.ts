import { collectCurrentPageSignals } from './page-signals'
import { createCrmSearchPageAutomation } from './crm-search-automation'
import {
  createCrmOfficialSiteAutomation,
  type CrmOfficialSiteRenderOptions,
  type CrmOfficialSitePanelFailurePhase,
  type CrmOfficialSitePanelOutcome
} from './crm-official-site-automation'
import {
  annotateCrmSearchTabAfterActivation,
  renderCrmOfficialSitePanelAfterActivation
} from './background-tab-activation'
import { createDeferredTabTaskScheduler } from './background-tab-scheduler'
import { runBackgroundTask } from './background-task-runner'
import { refreshStoredExtensionAccessToken } from '../auth/access-token'
import { ExtensionAuthApi } from '../auth/api'
import { EXTENSION_AUTH_SESSION_STORAGE_KEY, ExtensionAuthStorage } from '../auth/storage'
import { ExtensionCrmApi } from '../side-panel/crm-api'
import { WorkspacePreferenceStore } from '../workspaces/workspace-preferences'
import { CRM_WORKSPACE_KEY } from '../workspaces/workspace-registry'
import {
  CrmLeadDraftCaptureFlow,
  CrmLeadDraftStore,
  type CrmLeadDraftContextMenuInfo
} from '../workspaces/crm-lead-drafts'
import { handleCrmLeadDraftContextMenuClick } from './crm-lead-draft-context-menu-flow'
import { BrowserActivityBackgroundRuntime } from './browser-activity-background-runtime'
import { registerBrowserActivityLifecycleEvents } from './browser-activity-lifecycle'
import {
  isCrmLeadDraftContextMenuId,
  registerCrmLeadDraftContextMenus,
  unregisterCrmLeadDraftContextMenus
} from './crm-lead-draft-context-menu'
import {
  ANNOTATE_CRM_SEARCH_PAGE_MESSAGE,
  BROWSER_ACTIVITY_RESTORE_COLLECTION_MESSAGE,
  BROWSER_ACTIVITY_STOP_COLLECTION_MESSAGE,
  COLLECT_CURRENT_PAGE_SIGNALS_MESSAGE,
  CRM_LEAD_DRAFT_STATE_CHANGED_MESSAGE,
  OPEN_CRM_WORKSPACE_MESSAGE,
  REFRESH_CRM_TAGS_MESSAGE,
  SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE,
  SET_CRM_SIDE_PANEL_ENABLED_MESSAGE,
  SET_CRM_WORKSPACE_RUNTIME_ENABLED_MESSAGE,
  SHOW_CRM_FLOATING_PANEL_MESSAGE,
  isBrowserActivityPageActivityMessage,
  isRuntimeRequest
} from './messages'
import {
  CRM_FLOATING_PANEL_PREFERENCE_KEY,
  CRM_SIDE_PANEL_PREFERENCE_KEY
} from '../workspaces/workspace-preferences'

const crmSearchPageAutomation = createCrmSearchPageAutomation()
const crmOfficialSiteAutomation = createCrmOfficialSiteAutomation()
const authApi = new ExtensionAuthApi()
const authStorage = new ExtensionAuthStorage()
const browserActivityRuntime = new BrowserActivityBackgroundRuntime({
  onCollectionActivated: recordBrowserActivityForCurrentActiveTab,
  storage: authStorage
})
registerBrowserActivityLifecycleEvents(browserActivityRuntime, undefined, runBackgroundTask, {
  onWindowFocusGained: () => recordBrowserActivityForCurrentActiveTab()
})
const workspacePreferences = new WorkspacePreferenceStore()
const crmLeadDraftStore = new CrmLeadDraftStore()

// Describes one tab-level floating-panel render failure for popup diagnostics.
interface FloatingPanelRenderFailure {
  error: string
  failurePhase?: CrmOfficialSitePanelFailurePhase
  tabId?: number
  url?: string
}

// Summarizes one global floating-panel refresh across all browser tabs.
interface FloatingPanelRenderSummary {
  failedCount: number
  failures: FloatingPanelRenderFailure[]
  renderedCount: number
  skippedCount: number
}
const deferredSearchUpdateScheduler = createDeferredTabTaskScheduler<chrome.tabs.Tab>({
  runTask: (tab) => {
    runBackgroundTask(annotateCrmSearchTab(tab))
  }
})
const deferredOfficialSiteUpdateScheduler = createDeferredTabTaskScheduler<chrome.tabs.Tab>({
  runTask: (tab) => {
    if (!tab.id) {
      return
    }
    runBackgroundTask(renderCrmOfficialSitePanelAfterActivation(tab.id, {
      getTab: (updatedTabId) => chrome.tabs.get(updatedTabId),
      renderTab: renderCrmOfficialSitePanel
    }))
  }
})
const deferredSearchActivationScheduler = createDeferredTabTaskScheduler<chrome.tabs.Tab>({
  runTask: (tab) => {
    if (!tab.id) {
      return
    }
    runBackgroundTask(annotateCrmSearchTabAfterActivation(tab.id, {
      annotateTab: annotateCrmSearchTab,
      getTab: (activeTabId) => chrome.tabs.get(activeTabId)
    }))
  }
})
const deferredOfficialSiteActivationScheduler = createDeferredTabTaskScheduler<chrome.tabs.Tab>({
  runTask: (tab) => {
    if (!tab.id) {
      return
    }
    runBackgroundTask(renderCrmOfficialSitePanelAfterActivation(tab.id, {
      getTab: (activeTabId) => chrome.tabs.get(activeTabId),
      renderTab: renderCrmOfficialSitePanel
    }))
  }
})
const crmLeadDraftFlow = new CrmLeadDraftCaptureFlow({
  api: new ExtensionCrmApi({
    accessTokenProvider: async () => (await authStorage.load())?.accessToken,
    refreshAccessTokenProvider: async () => refreshStoredExtensionAccessToken({
      api: authApi,
      storage: authStorage
    }),
    workspaceEnabledProvider: async () => {
      const session = await authStorage.load()
      return session?.context
        ? workspacePreferences.isEnabled({
          accountId: session.context.account?.accountId,
          tenantId: session.context.tenant?.tenantId,
          workspaceKey: CRM_WORKSPACE_KEY
        })
        : false
    }
  }),
  onStateChanged: notifyCrmLeadDraftStateChanged,
  refreshCrmTags: annotateActiveCrmSearchPage,
  store: crmLeadDraftStore
})

runBackgroundTask(restoreBrowserActivityCollectionForActiveTab())

chrome.runtime.onInstalled.addListener(() => {
  runBackgroundTask(unregisterCrmContextMenu())
})

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-crm-workspace') {
    runBackgroundTask(openCrmWorkspaceForActiveTab())
  }
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (isCrmLeadDraftContextMenuId(info.menuItemId)) {
    runBackgroundTask(createCrmDraftFromContextMenu(info, tab))
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    const snapshot = { ...tab, id: tabId } as chrome.tabs.Tab
    deferredSearchUpdateScheduler.schedule(snapshot, 'crm-search-annotation')
    deferredOfficialSiteUpdateScheduler.schedule(snapshot, 'crm-official-site-panel')
    if (isActiveTabSnapshot(snapshot)) {
      runBackgroundTask(browserActivityRuntime.recordForegroundTab(snapshot))
    }
  }
})

chrome.tabs.onActivated.addListener(({ tabId }) => {
  deferredSearchActivationScheduler.schedule({ id: tabId }, 'crm-search-activation')
  deferredOfficialSiteActivationScheduler.schedule({ id: tabId }, 'crm-official-site-activation')
  runBackgroundTask(recordBrowserActivityForActivatedTab(tabId))
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (isBrowserActivityPageActivityMessage(message)) {
    void browserActivityRuntime.recordUserActivity({
      kind: message.kind,
      occurredAtMs: message.occurredAtMs
    })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ error: toErrorMessage(error) }))
    return true
  }

  if (!isRuntimeRequest(message)) {
    return false
  }

  if (message.type === ANNOTATE_CRM_SEARCH_PAGE_MESSAGE) {
    void annotateCrmSearchTab(sender.tab)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ error: toErrorMessage(error) }))
    return true
  }

  if (message.type === BROWSER_ACTIVITY_RESTORE_COLLECTION_MESSAGE) {
    void restoreBrowserActivityCollectionForActiveTab()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ error: toErrorMessage(error) }))
    return true
  }

  if (message.type === BROWSER_ACTIVITY_STOP_COLLECTION_MESSAGE) {
    void browserActivityRuntime.stopAuthenticatedCollection()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ error: toErrorMessage(error) }))
    return true
  }

  if (message.type === REFRESH_CRM_TAGS_MESSAGE) {
    void annotateActiveCrmSearchPage()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ error: toErrorMessage(error) }))
    return true
  }

  if (message.type === OPEN_CRM_WORKSPACE_MESSAGE) {
    void openCrmWorkspaceForActiveTab()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ error: toErrorMessage(error) }))
    return true
  }

  if (message.type === SET_CRM_WORKSPACE_RUNTIME_ENABLED_MESSAGE) {
    void setCrmRuntimeEnabled(message.enabled)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ error: toErrorMessage(error) }))
    return true
  }

  if (message.type === SET_CRM_SIDE_PANEL_ENABLED_MESSAGE) {
    void setCrmSidePanelEnabled(message.enabled)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ error: toErrorMessage(error) }))
    return true
  }

  if (message.type === SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE) {
    void setCrmFloatingPanelEnabled(message.enabled)
      .then((data) => sendResponse({ data, ok: true }))
      .catch((error) => sendResponse({ error: toErrorMessage(error) }))
    return true
  }

  if (message.type === SHOW_CRM_FLOATING_PANEL_MESSAGE) {
    void showActiveCrmOfficialSitePanel()
      .then((data) => sendResponse({ data, ok: true }))
      .catch((error) => sendResponse({ error: toErrorMessage(error) }))
    return true
  }

  if (message.type === COLLECT_CURRENT_PAGE_SIGNALS_MESSAGE) {
    void collectSignalsFromActiveTab()
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({ error: toErrorMessage(error) }))
    return true
  }

  return false
})

type ChromeStorageWithChangeEvents = typeof chrome.storage & {
  onChanged?: {
    addListener?: (
      listener: (changes: Record<string, unknown>, areaName: string) => void
    ) => void
  }
}

const chromeStorageWithChangeEvents = globalThis.chrome?.storage as ChromeStorageWithChangeEvents | undefined

chromeStorageWithChangeEvents?.onChanged?.addListener?.((changes, areaName) => {
  if (areaName !== 'local' || !(EXTENSION_AUTH_SESSION_STORAGE_KEY in changes)) {
    return
  }

  runBackgroundTask(restoreBrowserActivityCollectionForActiveTab())
})

// Registers the user-triggered CRM workspace context menu for the extension runtime.
async function registerCrmContextMenu(): Promise<void> {
  await registerCrmLeadDraftContextMenus()
}

async function unregisterCrmContextMenu(): Promise<void> {
  await unregisterCrmLeadDraftContextMenus()
}

async function setCrmRuntimeEnabled(enabled: boolean): Promise<void> {
  await saveWorkspaceRuntimePreference(enabled)
  if (enabled) {
    await Promise.all([
      registerCrmContextMenu(),
      annotateActiveCrmSearchPage()
    ])
    return
  }

  await Promise.all([
    unregisterCrmContextMenu(),
    clearActiveCrmSearchPageAnnotations(),
    clearAllCrmOfficialSitePanels()
  ])
}

async function setCrmSidePanelEnabled(enabled: boolean): Promise<void> {
  await savePanelPreference(CRM_SIDE_PANEL_PREFERENCE_KEY, enabled)
  await chrome.sidePanel.setOptions({
    enabled,
    path: 'side-panel.html'
  })
  if (enabled) {
    await openCrmWorkspaceForActiveTab()
  }
}

async function setCrmFloatingPanelEnabled(enabled: boolean): Promise<FloatingPanelRenderSummary | undefined> {
  if (!enabled) {
    await savePanelPreference(CRM_FLOATING_PANEL_PREFERENCE_KEY, false)
    await clearAllCrmOfficialSitePanels()
    return undefined
  }

  await savePanelPreference(CRM_FLOATING_PANEL_PREFERENCE_KEY, true)
  try {
    await clearStoredFloatingPanelCloseState()
    const summary = await renderAllCrmOfficialSitePanels({ reopenClosedPanels: true })
    if (summary.failedCount > 0 && summary.renderedCount === 0) {
      throw new Error(summary.failures[0]?.error || 'CRM floating panel render failed')
    }
    return summary
  } catch (caught) {
    await savePanelPreference(CRM_FLOATING_PANEL_PREFERENCE_KEY, false)
    throw caught
  }
}

// Reopens the floating panel on the active site by clearing explicit close markers first.
async function showActiveCrmOfficialSitePanel(): Promise<CrmOfficialSitePanelOutcome> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    throw new Error('Active tab is unavailable')
  }

  const closedKeys = resolveClosedPanelStorageKeys(tab.url)
  if (closedKeys.length) {
    await chrome.storage.local.remove(closedKeys)
    await chrome.scripting.executeScript({
      args: [closedKeys],
      func: clearLegacyPanelCloseState as (...args: never[]) => unknown,
      target: { tabId: tab.id }
    })
  }

  await setCrmFloatingPanelPreference(true)
  const outcome = await renderCrmOfficialSitePanel(tab, { reopenClosedPanel: true })
  if (!outcome.rendered) {
    throw new Error(outcome.error || '当前页面未显示 Floating Panel：页面可能未被识别为 CRM 官网，或页面脚本注入被浏览器拦截。')
  }
  return outcome
}

// Persists one workspace-owned panel preference for the signed-in browser-extension account.
async function savePanelPreference(panelKey: string, enabled: boolean): Promise<void> {
  const session = await authStorage.load()
  if (!session?.context) {
    return
  }

  await workspacePreferences.setPanelEnabled({
    accountId: session.context.account?.accountId,
    panelKey,
    tenantId: session.context.tenant?.tenantId,
    workspaceKey: CRM_WORKSPACE_KEY
  }, enabled)
}

async function setCrmFloatingPanelPreference(enabled: boolean): Promise<void> {
  await savePanelPreference(CRM_FLOATING_PANEL_PREFERENCE_KEY, enabled)
}

// Persists the CRM workspace runtime preference that controls search tags and CRM context menus.
async function saveWorkspaceRuntimePreference(enabled: boolean): Promise<void> {
  const session = await authStorage.load()
  if (!session?.context) {
    return
  }

  await workspacePreferences.setEnabled({
    accountId: session.context.account?.accountId,
    tenantId: session.context.tenant?.tenantId,
    workspaceKey: CRM_WORKSPACE_KEY
  }, enabled)
}

// Builds current-domain close-state keys, including the common www/non-www pair.
function resolveClosedPanelStorageKeys(rawUrl: string | undefined): string[] {
  if (!rawUrl) {
    return []
  }

  try {
    const url = new URL(rawUrl)
    const hostname = url.hostname
    const normalized = hostname.replace(/^www\./i, '')
    return Array.from(new Set([
      `oes-crm-panel-closed:page:${normalized}${url.pathname || '/'}`,
      `oes-crm-panel-closed:page:${hostname}${url.pathname || '/'}`,
      `oes-crm-panel-closed:record:${hostname}`,
      `oes-crm-panel-closed:record:${normalized}`,
      `oes-crm-panel-closed:${hostname}`,
      `oes-crm-panel-closed:${normalized}`,
      `oes-crm-panel-minimized:${hostname}`,
      `oes-crm-panel-minimized:${normalized}`
    ]))
  } catch {
    return []
  }
}

// Removes all extension-global explicit-close markers so the main popup can reopen floating panels.
async function clearStoredFloatingPanelCloseState(): Promise<void> {
  const values = await chrome.storage.local.get(null)
  const keys = Object.keys(values).filter((key) => key.startsWith('oes-crm-panel-closed:'))
  if (keys.length) {
    await chrome.storage.local.remove(keys)
  }
}

// Clears same-tab legacy close state written before extension-global storage completes.
function clearLegacyPanelCloseState(keys: string[]): void {
  try {
    for (const key of keys) {
      globalThis.sessionStorage?.removeItem(key)
      globalThis.localStorage?.removeItem(key)
    }
  } catch {
    // Page storage can be unavailable in privacy-restricted contexts.
  }
}

// Opens the CRM side panel for the active browser tab.
async function openCrmWorkspaceForActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  await openCrmWorkspace(tab)
}

async function openCrmWorkspace(tab?: chrome.tabs.Tab): Promise<void> {
  if (!tab?.id) {
    throw new Error('Active tab is unavailable')
  }

  const setOptionsPromise = chrome.sidePanel.setOptions({
    enabled: true,
    path: 'side-panel.html'
  })
  const openPromise = chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId })
  await setOptionsPromise
  await openPromise
}

async function collectSignalsFromActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    throw new Error('Active tab is unavailable')
  }

  return collectSignalsFromTab(tab.id)
}

async function collectSignalsFromTab(tabId: number) {
  const [result] = await chrome.scripting.executeScript({
    func: collectCurrentPageSignals,
    target: { tabId }
  })

  return result?.result ?? { error: 'Page signals are unavailable' }
}

// isActiveTabSnapshot reads Chrome's runtime active flag without depending on stale local type declarations.
function isActiveTabSnapshot(tab: chrome.tabs.Tab): boolean {
  return Boolean((tab as chrome.tabs.Tab & { active?: boolean }).active)
}

// recordBrowserActivityForActivatedTab resolves the latest Chrome tab snapshot before starting a visit.
async function recordBrowserActivityForActivatedTab(tabId: number): Promise<void> {
  const tab = await chrome.tabs.get(tabId)
  await browserActivityRuntime.recordForegroundTab(tab)
}

// restoreBrowserActivityCollectionForActiveTab starts collection and immediately tracks the current active page.
async function restoreBrowserActivityCollectionForActiveTab(): Promise<void> {
  await browserActivityRuntime.restore()
  await recordBrowserActivityForCurrentActiveTab()
}

// recordBrowserActivityForCurrentActiveTab tracks the active page only when the audit data channel is enabled.
async function recordBrowserActivityForCurrentActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    await browserActivityRuntime.recordForegroundTab(tab)
  }
}

async function createCrmDraftFromContextMenu(info: CrmLeadDraftContextMenuInfo, tab?: chrome.tabs.Tab): Promise<void> {
  await handleCrmLeadDraftContextMenuClick({
    authStorage,
    collectSignalsFromTab,
    draftFlow: crmLeadDraftFlow,
    info,
    openCrmWorkspace,
    tab
  })
}

async function annotateActiveCrmSearchPage(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  await annotateCrmSearchTab(tab)
}

async function annotateCrmSearchTab(tab?: chrome.tabs.Tab) {
  return crmSearchPageAutomation.annotateTab({
    id: tab?.id,
    url: tab?.url
  })
}

async function renderActiveCrmOfficialSitePanel(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  await renderCrmOfficialSitePanel(tab)
}

async function renderCrmOfficialSitePanel(tab?: chrome.tabs.Tab, options: CrmOfficialSiteRenderOptions = {}) {
  await clearLegacyFloatingPanelCloseState(tab)
  return crmOfficialSiteAutomation.renderTab({
    id: tab?.id,
    url: tab?.url
  }, options)
}

async function renderAllCrmOfficialSitePanels(
  options: { reopenClosedPanels?: boolean } = {}
): Promise<FloatingPanelRenderSummary> {
  const tabs = await chrome.tabs.query({})
  const outcomes = await Promise.all(tabs.map(async (tab) => {
    return {
      outcome: await renderCrmOfficialSitePanel(tab, {
        reopenClosedPanel: options.reopenClosedPanels === true
      }),
      tab
    }
  }))
  return summarizeFloatingPanelRender(outcomes)
}

// Aggregates per-tab render outcomes without treating unsupported pages as failures.
function summarizeFloatingPanelRender(
  outcomes: Array<{ outcome: CrmOfficialSitePanelOutcome; tab: chrome.tabs.Tab }>
): FloatingPanelRenderSummary {
  return outcomes.reduce<FloatingPanelRenderSummary>((summary, { outcome, tab }) => {
    if (outcome.rendered) {
      summary.renderedCount += 1
    }
    if (outcome.skipped) {
      summary.skippedCount += 1
    }
    if (outcome.error) {
      summary.failedCount += 1
      summary.failures.push({
        error: outcome.error,
        failurePhase: outcome.failurePhase,
        tabId: tab.id,
        url: tab.url
      })
    }
    return summary
  }, {
    failedCount: 0,
    failures: [],
    renderedCount: 0,
    skippedCount: 0
  })
}

async function clearActiveCrmSearchPageAnnotations(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  await crmSearchPageAutomation.clearTab({
    id: tab?.id,
    url: tab?.url
  })
}

async function clearActiveCrmOfficialSitePanel(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  await crmOfficialSiteAutomation.clearTab({
    id: tab?.id,
    url: tab?.url
  })
}

async function clearAllCrmOfficialSitePanels(): Promise<void> {
  const tabs = await chrome.tabs.query({})
  await Promise.all(tabs.map((tab) => crmOfficialSiteAutomation.clearTab({
    id: tab.id,
    url: tab.url
  })))
}

async function clearLegacyFloatingPanelCloseState(tab?: chrome.tabs.Tab): Promise<void> {
  if (!tab?.id) {
    return
  }

  const closedKeys = resolveClosedPanelStorageKeys(tab.url)
  if (!closedKeys.length) {
    return
  }

  try {
    await chrome.scripting.executeScript({
      args: [closedKeys],
      func: clearLegacyPanelCloseState as (...args: never[]) => unknown,
      target: { tabId: tab.id }
    })
  } catch {
    // Some tabs cannot run extension scripts; rendering will skip or clear them normally.
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Runtime request failed'
}

// Broadcasts local CRM Lead draft storage changes to any open extension views.
async function notifyCrmLeadDraftStateChanged(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({ type: CRM_LEAD_DRAFT_STATE_CHANGED_MESSAGE })
  } catch {
    // The background flow must continue when no side panel is currently listening.
  }
}
