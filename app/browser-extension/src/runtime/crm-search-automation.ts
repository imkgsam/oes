import { ExtensionAuthStorage } from '../auth/storage'
import type { AuthStorage } from '../auth/storage'
import type { StoredAuthSession } from '../auth/types'
import { refreshStoredExtensionAccessToken } from '../auth/access-token'
import { ExtensionAuthApi } from '../auth/api'
import { defaultTenantWebBaseUrl } from '../shared/tenant-web-url'
import { ExtensionCrmApi } from '../side-panel/crm-api'
import type { ResolveSearchResultsRequest } from '../side-panel/crm-types'
import { CRM_WORKSPACE_KEY } from '../workspaces/workspace-registry'
import { WorkspacePreferenceStore } from '../workspaces/workspace-preferences'
import {
  annotateCrmSearchResultsInCurrentDocument,
  clearCrmSearchResultsAnnotationsInCurrentDocument
} from './crm-page-annotations'
import { installCrmSearchAutoRequestInCurrentDocument } from './crm-search-page-observer'
import { collectCurrentPageSignals } from './page-signals'

type ScriptExecution = (options: {
  args?: unknown[]
  func: (...args: never[]) => unknown
  target: { tabId: number }
}) => Promise<Array<{ result?: unknown }>>

type CrmSearchApi = Pick<ExtensionCrmApi, 'resolveSearchResults'>
type ResolvedSearchCacheEntry = {
  expiresAt: number
  fingerprint: string
  results: unknown[]
}
type InFlightSearchResolve = {
  fingerprint: string
  promise: Promise<unknown[]>
}

const RESOLVED_SEARCH_CACHE_TTL_MS = 30_000
const THROTTLED_SEARCH_BACKOFF_MS = 60_000

export interface CrmSearchPageAutomationDependencies {
  api?: CrmSearchApi
  authStorage?: Pick<AuthStorage, 'load'>
  executeScript?: ScriptExecution
  tenantWebBaseUrl?: string
  workspacePreferences?: Pick<WorkspacePreferenceStore, 'isEnabled'>
}

export interface CrmSearchTabSnapshot {
  id?: number
  url?: string
}

export interface CrmSearchAnnotationOutcome {
  annotatedCount: number
  error?: string
  skipped: boolean
}

// Detects the search pages where OES CRM is allowed to run automatic read-only enrichment.
export function isSupportedSearchPageUrl(value: string | undefined): boolean {
  const url = parseGoogleSearchUrl(value)
  return Boolean(url && !isGoogleImageSearchTab(url))
}

// Detects Google Images tab variants so image-tab pages are cleared but never CRM-tagged.
function isGoogleImageSearchTabUrl(value: string | undefined): boolean {
  const url = parseGoogleSearchUrl(value)
  return Boolean(url && isGoogleImageSearchTab(url))
}

function parseGoogleSearchUrl(value: string | undefined): URL | null {
  if (!value) {
    return null
  }

  try {
    const url = new URL(value)
    if (!/^https?:$/.test(url.protocol) || !/(^|\.)google\./i.test(url.hostname) || url.pathname !== '/search') {
      return null
    }
    return url
  } catch {
    return null
  }
}

function isGoogleImageSearchTab(url: URL): boolean {
  return /^isch$/i.test(url.searchParams.get('tbm') ?? '') || url.searchParams.get('udm') === '2'
}

// Creates the background-owned CRM Google result annotator with injectable boundaries for tests.
export function createCrmSearchPageAutomation(dependencies: CrmSearchPageAutomationDependencies = {}) {
  const authStorage = dependencies.authStorage ?? new ExtensionAuthStorage()
  const authApi = new ExtensionAuthApi()
  const workspacePreferences = dependencies.workspacePreferences ?? new WorkspacePreferenceStore()
  const executeScript = dependencies.executeScript ?? executeChromeScript
  const tenantWebBaseUrl = dependencies.tenantWebBaseUrl ?? defaultTenantWebBaseUrl()
  const resolvedSearchCache = new Map<number, ResolvedSearchCacheEntry>()
  const inFlightSearchResolves = new Map<number, InFlightSearchResolve>()
  const throttledUntilByTab = new Map<number, number>()
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
      return isCrmWorkspaceEnabled(session, workspacePreferences)
    }
  })

  return {
    annotateTab: async (tab: CrmSearchTabSnapshot): Promise<CrmSearchAnnotationOutcome> => {
      if (!tab.id) {
        return { annotatedCount: 0, skipped: true }
      }

      if (isGoogleImageSearchTabUrl(tab.url)) {
        await clearTabAnnotations(executeScript, tab.id)
        return { annotatedCount: 0, skipped: true }
      }

      if (!isSupportedSearchPageUrl(tab.url)) {
        return { annotatedCount: 0, skipped: true }
      }

      const session = await authStorage.load()
      const enabled = await isCrmWorkspaceEnabled(session, workspacePreferences)
      if (!enabled) {
        return { annotatedCount: 0, skipped: true }
      }

      try {
        await executeScript({
          func: installCrmSearchAutoRequestInCurrentDocument as (...args: never[]) => unknown,
          target: { tabId: tab.id }
        })
        const [signalResult] = await executeScript({
          func: collectCurrentPageSignals as (...args: never[]) => unknown,
          target: { tabId: tab.id }
        })
        const searchResults = toSearchResultRequest(signalResult?.result)
        if (!searchResults?.results.length) {
          return { annotatedCount: 0, skipped: true }
        }

        const fingerprint = fingerprintSearchResults(searchResults)
        if ((throttledUntilByTab.get(tab.id) ?? 0) > Date.now()) {
          return { annotatedCount: 0, skipped: true }
        }
        const cached = resolvedSearchCache.get(tab.id)
        const resolvedResults = cached?.fingerprint === fingerprint && cached.expiresAt > Date.now()
          ? cached.results
          : await resolveAndCacheSearchResults(
            api,
            resolvedSearchCache,
            inFlightSearchResolves,
            throttledUntilByTab,
            tab.id,
            fingerprint,
            searchResults
          )
        const [annotationResult] = await executeScript({
          args: [
            {
              results: resolvedResults,
              tenantWebBaseUrl
            }
          ],
          func: annotateCrmSearchResultsInCurrentDocument as (...args: never[]) => unknown,
          target: { tabId: tab.id }
        })

        return {
          annotatedCount: extractAnnotatedCount(annotationResult?.result),
          skipped: false
        }
      } catch (caught) {
        return {
          annotatedCount: 0,
          error: caught instanceof Error ? caught.message : 'CRM search page annotation failed',
          skipped: true
        }
      }
    },
    clearTab: async (tab: CrmSearchTabSnapshot): Promise<{ removedCount: number; skipped: boolean }> => {
      if (!tab.id || (!isSupportedSearchPageUrl(tab.url) && !isGoogleImageSearchTabUrl(tab.url))) {
        return { removedCount: 0, skipped: true }
      }

      try {
        return {
          removedCount: await clearTabAnnotations(executeScript, tab.id),
          skipped: false
        }
      } catch {
        return { removedCount: 0, skipped: true }
      }
    }
  }
}

async function clearTabAnnotations(executeScript: ScriptExecution, tabId: number): Promise<number> {
  const [result] = await executeScript({
    func: clearCrmSearchResultsAnnotationsInCurrentDocument as (...args: never[]) => unknown,
    target: { tabId }
  })
  return extractRemovedCount(result?.result)
}

function hasAuthSave(storage: Pick<AuthStorage, 'load'>): storage is Pick<AuthStorage, 'load' | 'save'> {
  return typeof (storage as Partial<AuthStorage>).save === 'function'
}

async function resolveAndCacheSearchResults(
  api: CrmSearchApi,
  cache: Map<number, ResolvedSearchCacheEntry>,
  inFlight: Map<number, InFlightSearchResolve>,
  throttledUntilByTab: Map<number, number>,
  tabId: number,
  fingerprint: string,
  searchResults: ResolveSearchResultsRequest
): Promise<unknown[]> {
  const current = inFlight.get(tabId)
  if (current?.fingerprint === fingerprint) {
    return current.promise
  }

  let flight: InFlightSearchResolve
  const promise = api.resolveSearchResults(searchResults)
    .then((resolved) => {
      const results = ((resolved as { results?: unknown[] }).results ?? [])
      cache.set(tabId, {
        expiresAt: Date.now() + RESOLVED_SEARCH_CACHE_TTL_MS,
        fingerprint,
        results
      })
      return results
    })
    .catch((error) => {
      if (isThrottledError(error)) {
        throttledUntilByTab.set(tabId, Date.now() + THROTTLED_SEARCH_BACKOFF_MS)
      }
      throw error
    })
    .finally(() => {
      if (inFlight.get(tabId) === flight) {
        inFlight.delete(tabId)
      }
    })

  flight = { fingerprint, promise }
  inFlight.set(tabId, flight)
  return promise
}

function isThrottledError(value: unknown): boolean {
  const message = value instanceof Error ? value.message : String(value ?? '')
  return /ThrottlerException|Too Many Requests|\\b429\\b/i.test(message)
}

function fingerprintSearchResults(searchResults: ResolveSearchResultsRequest): string {
  return JSON.stringify({
    query: searchResults.query,
    results: searchResults.results.map((result) => ({
      domain: result.domain,
      title: result.title,
      url: result.url
    })),
    searchEngine: searchResults.searchEngine
  })
}

async function executeChromeScript(options: {
  args?: unknown[]
  func: (...args: never[]) => unknown
  target: { tabId: number }
}): Promise<Array<{ result?: unknown }>> {
  return chrome.scripting.executeScript(options)
}

async function isCrmWorkspaceEnabled(
  session: StoredAuthSession | null,
  workspacePreferences: Pick<WorkspacePreferenceStore, 'isEnabled'>
): Promise<boolean> {
  if (!session?.accessToken) {
    return false
  }

  return workspacePreferences.isEnabled({
    accountId: session.context?.account?.accountId,
    tenantId: session.context?.tenant?.tenantId,
    workspaceKey: CRM_WORKSPACE_KEY
  })
}

function toSearchResultRequest(value: unknown): ResolveSearchResultsRequest | null {
  if (!value || typeof value !== 'object' || !('searchResults' in value)) {
    return null
  }

  const searchResults = (value as { searchResults?: ResolveSearchResultsRequest }).searchResults
  if (!searchResults || !Array.isArray(searchResults.results)) {
    return null
  }

  return searchResults
}

function extractAnnotatedCount(value: unknown): number {
  if (value && typeof value === 'object' && 'annotatedCount' in value) {
    const count = Number((value as { annotatedCount?: unknown }).annotatedCount)
    return Number.isFinite(count) ? count : 0
  }

  return 0
}

function extractRemovedCount(value: unknown): number {
  if (value && typeof value === 'object' && 'removedCount' in value) {
    const count = Number((value as { removedCount?: unknown }).removedCount)
    return Number.isFinite(count) ? count : 0
  }

  return 0
}
