import type { PageSignals, SearchResultSignals } from './page-signals'

export const OPEN_CRM_WORKSPACE_MESSAGE = 'oes.crm.openWorkspace'
export const COLLECT_CURRENT_PAGE_SIGNALS_MESSAGE = 'oes.crm.collectCurrentPageSignals'
export const SET_CRM_WORKSPACE_RUNTIME_ENABLED_MESSAGE = 'oes.crm.setRuntimeEnabled'
export const SET_CRM_SIDE_PANEL_ENABLED_MESSAGE = 'oes.crm.setSidePanelEnabled'
export const SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE = 'oes.crm.setFloatingPanelEnabled'
export const SHOW_CRM_FLOATING_PANEL_MESSAGE = 'oes.crm.showFloatingPanel'
export const ANNOTATE_CRM_SEARCH_PAGE_MESSAGE = 'oes.crm.annotateSearchPage'
export const REFRESH_CRM_TAGS_MESSAGE = 'oes.crm.refreshCrmTags'
export const CRM_LEAD_DRAFT_STATE_CHANGED_MESSAGE = 'oes.crm.leadDraftStateChanged'
export const BROWSER_ACTIVITY_PAGE_ACTIVITY_MESSAGE = 'oes.browserActivity.pageActivity'
export const BROWSER_ACTIVITY_RESTORE_COLLECTION_MESSAGE = 'oes.browserActivity.restoreCollection'
export const BROWSER_ACTIVITY_STOP_COLLECTION_MESSAGE = 'oes.browserActivity.stopCollection'

export type RuntimeRequest =
  | { type: typeof ANNOTATE_CRM_SEARCH_PAGE_MESSAGE }
  | { type: typeof BROWSER_ACTIVITY_RESTORE_COLLECTION_MESSAGE }
  | { type: typeof BROWSER_ACTIVITY_STOP_COLLECTION_MESSAGE }
  | { type: typeof OPEN_CRM_WORKSPACE_MESSAGE }
  | { type: typeof SHOW_CRM_FLOATING_PANEL_MESSAGE }
  | { type: typeof REFRESH_CRM_TAGS_MESSAGE }
  | { type: typeof COLLECT_CURRENT_PAGE_SIGNALS_MESSAGE }
  | { enabled: boolean; type: typeof SET_CRM_SIDE_PANEL_ENABLED_MESSAGE }
  | { enabled: boolean; type: typeof SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE }
  | { enabled: boolean; type: typeof SET_CRM_WORKSPACE_RUNTIME_ENABLED_MESSAGE }

export type RuntimeResponse =
  | { page: PageSignals; searchResults?: undefined }
  | { page?: undefined; searchResults: SearchResultSignals }
  | { error: string }

export type BrowserActivityPageActivityMessage = {
  kind: 'click' | 'keyboard' | 'mouse' | 'scroll'
  occurredAtMs: number
  type: typeof BROWSER_ACTIVITY_PAGE_ACTIVITY_MESSAGE
}

// Identifies CRM workspace runtime messages without accepting arbitrary page messages as commands.
export function isRuntimeRequest(value: unknown): value is RuntimeRequest {
  if (!value || typeof value !== 'object' || !('type' in value)) {
    return false
  }

  const type = (value as { type?: unknown }).type
  return (
    type === ANNOTATE_CRM_SEARCH_PAGE_MESSAGE ||
    type === BROWSER_ACTIVITY_RESTORE_COLLECTION_MESSAGE ||
    type === BROWSER_ACTIVITY_STOP_COLLECTION_MESSAGE ||
    type === OPEN_CRM_WORKSPACE_MESSAGE ||
    type === SHOW_CRM_FLOATING_PANEL_MESSAGE ||
    type === REFRESH_CRM_TAGS_MESSAGE ||
    type === COLLECT_CURRENT_PAGE_SIGNALS_MESSAGE ||
    type === SET_CRM_SIDE_PANEL_ENABLED_MESSAGE ||
    type === SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE ||
    type === SET_CRM_WORKSPACE_RUNTIME_ENABLED_MESSAGE
  )
}

// Identifies sanitized page activity messages emitted by the browser activity observer content script.
export function isBrowserActivityPageActivityMessage(value: unknown): value is BrowserActivityPageActivityMessage {
  if (!value || typeof value !== 'object' || !('type' in value)) {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    record.type === BROWSER_ACTIVITY_PAGE_ACTIVITY_MESSAGE &&
    typeof record.occurredAtMs === 'number' &&
    (record.kind === 'click' ||
      record.kind === 'keyboard' ||
      record.kind === 'mouse' ||
      record.kind === 'scroll')
  )
}
