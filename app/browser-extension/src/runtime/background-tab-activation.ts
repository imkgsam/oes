import { isSupportedSearchPageUrl, type CrmSearchAnnotationOutcome } from './crm-search-automation'
import { isSupportedOfficialSiteUrl, type CrmOfficialSitePanelOutcome } from './crm-official-site-automation'
import { isChromeTabUnavailableError } from './chrome-tab-errors'

export type BackgroundCrmSearchAnnotationOutcome = CrmSearchAnnotationOutcome
export type BackgroundCrmOfficialSitePanelOutcome = CrmOfficialSitePanelOutcome

export interface BackgroundTabSnapshot {
  id?: number
  status?: string
  url?: string
}

export interface BackgroundTabActivationDependencies {
  annotateTab: (tab: BackgroundTabSnapshot) => Promise<BackgroundCrmSearchAnnotationOutcome>
  getTab: (tabId: number) => Promise<BackgroundTabSnapshot>
  retryDelaysMs?: number[]
  sleep?: (ms: number) => Promise<void>
}

export interface BackgroundOfficialSiteActivationDependencies {
  getTab: (tabId: number) => Promise<BackgroundTabSnapshot>
  renderTab: (tab: BackgroundTabSnapshot) => Promise<BackgroundCrmOfficialSitePanelOutcome>
  retryDelaysMs?: number[]
  sleep?: (ms: number) => Promise<void>
}

const DEFAULT_ACTIVATION_RETRY_DELAYS_MS = [0, 500, 1_500]

// Re-runs CRM search annotation after tab activation while Chrome is still filling tab URL/load state.
export async function annotateCrmSearchTabAfterActivation(
  tabId: number,
  dependencies: BackgroundTabActivationDependencies
): Promise<BackgroundCrmSearchAnnotationOutcome> {
  const retryDelaysMs = dependencies.retryDelaysMs ?? DEFAULT_ACTIVATION_RETRY_DELAYS_MS
  const sleep = dependencies.sleep ?? sleepFor
  let lastOutcome: BackgroundCrmSearchAnnotationOutcome = { annotatedCount: 0, skipped: true }

  for (const [index, delayMs] of retryDelaysMs.entries()) {
    if (delayMs > 0) {
      await sleep(delayMs)
    }

    const tab = await getTabSnapshot(tabId, dependencies.getTab)
    if (!tab) {
      return { annotatedCount: 0, skipped: true }
    }
    const outcome = await dependencies.annotateTab(tab)
    lastOutcome = outcome

    if (!shouldRetryActivationAnnotation(tab, outcome, index, retryDelaysMs.length)) {
      return outcome
    }
  }

  return lastOutcome
}

// Re-runs CRM official-site panel rendering after tab activation while Chrome is still filling tab URL/load state.
export async function renderCrmOfficialSitePanelAfterActivation(
  tabId: number,
  dependencies: BackgroundOfficialSiteActivationDependencies
): Promise<BackgroundCrmOfficialSitePanelOutcome> {
  const retryDelaysMs = dependencies.retryDelaysMs ?? DEFAULT_ACTIVATION_RETRY_DELAYS_MS
  const sleep = dependencies.sleep ?? sleepFor
  let lastOutcome: BackgroundCrmOfficialSitePanelOutcome = { rendered: false, skipped: true }

  for (const [index, delayMs] of retryDelaysMs.entries()) {
    if (delayMs > 0) {
      await sleep(delayMs)
    }

    const tab = await getTabSnapshot(tabId, dependencies.getTab)
    if (!tab) {
      return { rendered: false, skipped: true }
    }
    const outcome = await dependencies.renderTab(tab)
    lastOutcome = outcome

    if (!shouldRetryOfficialSitePanel(tab, outcome, index, retryDelaysMs.length)) {
      return outcome
    }
  }

  return lastOutcome
}

function shouldRetryActivationAnnotation(
  tab: BackgroundTabSnapshot,
  outcome: BackgroundCrmSearchAnnotationOutcome,
  attemptIndex: number,
  attemptCount: number
): boolean {
  if (attemptIndex >= attemptCount - 1 || !outcome.skipped || outcome.error) {
    return false
  }

  return !tab.url || tab.status !== 'complete' || isSupportedSearchPageUrl(tab.url)
}

function shouldRetryOfficialSitePanel(
  tab: BackgroundTabSnapshot,
  outcome: BackgroundCrmOfficialSitePanelOutcome,
  attemptIndex: number,
  attemptCount: number
): boolean {
  if (attemptIndex >= attemptCount - 1 || !outcome.skipped) {
    return false
  }

  return !tab.url || tab.status !== 'complete' || isSupportedOfficialSiteUrl(tab.url)
}

function sleepFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// getTabSnapshot converts expected tab lifecycle races into a skipped activation outcome.
async function getTabSnapshot(
  tabId: number,
  getTab: (tabId: number) => Promise<BackgroundTabSnapshot>
): Promise<BackgroundTabSnapshot | null> {
  try {
    return await getTab(tabId)
  } catch (caught) {
    if (isChromeTabUnavailableError(caught)) {
      return null
    }
    throw caught
  }
}
