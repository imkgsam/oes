import type { AuthStorage } from '../auth/storage'
import type { StoredAuthSession } from '../auth/types'
import {
  createCaptureFromContextMenu,
  type CrmLeadDraftContextMenuInfo
} from '../workspaces/crm-lead-drafts'
import { isChromeTabUnavailableError } from './chrome-tab-errors'
import type { PageSignals, SearchResultSignals } from './page-signals'

export interface CrmLeadDraftContextMenuFlowOptions {
  authStorage: Pick<AuthStorage, 'load'>
  collectSignalsFromTab: (tabId: number) => Promise<
    | { page?: PageSignals; searchResults?: SearchResultSignals }
    | { error: string }
  >
  draftFlow: {
    beginCapture(identity: { accountId?: string; tenantId?: string | null }, capture: ReturnType<typeof createCaptureFromContextMenu>): Promise<unknown>
  }
  info: CrmLeadDraftContextMenuInfo
  openCrmWorkspace: (tab: chrome.tabs.Tab) => Promise<void>
  tab?: chrome.tabs.Tab
}

// Opens the side panel inside the context-menu user gesture before running asynchronous CRM draft work.
export async function handleCrmLeadDraftContextMenuClick(
  options: CrmLeadDraftContextMenuFlowOptions
): Promise<void> {
  if (!options.tab?.id) {
    throw new Error('Active tab is unavailable')
  }

  const openPromise = options.openCrmWorkspace(options.tab)
  await Promise.resolve()
  try {
    await openPromise
  } catch (caught) {
    if (isChromeTabUnavailableError(caught)) {
      return
    }
    throw caught
  }

  const session = await options.authStorage.load()
  assertSessionContext(session)

  const signals = await collectSignalsFromOpenTab(options.collectSignalsFromTab, options.tab.id)
  if (!signals) {
    return
  }
  if (!hasPageSignals(signals)) {
    return
  }

  await options.draftFlow.beginCapture(
    {
      accountId: session.context.account?.accountId,
      tenantId: session.context.tenant?.tenantId
    },
    createCaptureFromContextMenu({ info: options.info, page: signals.page })
  )
}

type StoredAuthSessionWithContext = StoredAuthSession & {
  context: NonNullable<StoredAuthSession['context']>
}

function assertSessionContext(session: StoredAuthSession | null): asserts session is StoredAuthSessionWithContext {
  if (!session?.context) {
    throw new Error('Extension session is missing')
  }
}

// hasPageSignals separates expected non-page contexts from real context-menu flow failures.
function hasPageSignals(
  signals: Awaited<ReturnType<CrmLeadDraftContextMenuFlowOptions['collectSignalsFromTab']>>
): signals is { page: PageSignals; searchResults?: SearchResultSignals } {
  return !('error' in signals) && Boolean(signals.page)
}

// collectSignalsFromOpenTab stops context-menu capture when Chrome has already closed the source tab.
async function collectSignalsFromOpenTab(
  collectSignalsFromTab: CrmLeadDraftContextMenuFlowOptions['collectSignalsFromTab'],
  tabId: number
): Promise<Awaited<ReturnType<CrmLeadDraftContextMenuFlowOptions['collectSignalsFromTab']>> | null> {
  try {
    return await collectSignalsFromTab(tabId)
  } catch (caught) {
    if (isChromeTabUnavailableError(caught)) {
      return null
    }
    throw caught
  }
}
