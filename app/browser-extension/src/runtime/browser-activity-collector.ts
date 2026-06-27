import type { BrowserActivityCollectionContext, BrowserActivityCollectorRuntimePort } from './browser-activity-runtime'

const ACTIVE_WINDOW_MS = 5 * 60 * 1000

export interface BrowserActivityCollectorOptions {
  now?: () => number
}

export interface BrowserActivityVisitStart {
  occurredAtMs?: number
  tabId: number
  title: string
  url: string
}

export interface BrowserActivityVisitEnd {
  occurredAtMs: number
  tabId: number
}

export interface BrowserActivityUserActivity {
  kind: 'click' | 'keyboard' | 'mouse' | 'scroll'
  occurredAtMs: number
}

export interface BrowserActivityVisitSummary {
  activeDurationSeconds: number
  clientVisitId: string
  domain: string
  dwellDurationSeconds: number
  endedAt: string
  extensionSessionId: string
  foregroundDurationSeconds: number
  idleDurationSeconds: number
  lastFlushedAt: string
  mergeKey: string
  pageTitle: string
  startedAt: string
  url: string
}

interface ActiveVisit {
  clientVisitId: string
  domain: string
  lastActivityAtMs: number
  pageTitle: string
  startedAtMs: number
  tabId: number
  url: string
}

interface AuthenticatedCollectorContext extends BrowserActivityCollectionContext {
  extensionSessionId: string
}

// BrowserActivityCollector converts authenticated browser tab observations into bounded visit summaries.
export class BrowserActivityCollector implements BrowserActivityCollectorRuntimePort {
  private readonly now: () => number
  private activeVisit: ActiveVisit | null = null
  private context: AuthenticatedCollectorContext | null = null
  private pendingSummaries: BrowserActivityVisitSummary[] = []
  private visitSequence = 0

  constructor(options: BrowserActivityCollectorOptions = {}) {
    this.now = options.now ?? (() => Date.now())
  }

  // start enables collection only after BrowserActivityRuntime has proven extension authentication.
  start(context: BrowserActivityCollectionContext): void {
    this.context = {
      ...context,
      extensionSessionId: `extension-session:${context.tenantId}:${context.accountId}`
    }
  }

  // stop closes the active in-memory visit but leaves already completed authenticated summaries pending.
  stop(): void {
    this.activeVisit = null
    this.context = null
  }

  // discard clears active and pending state without uploading historical browsing data.
  discard(): void {
    this.activeVisit = null
    this.context = null
    this.pendingSummaries = []
  }

  // startVisit begins tracking one tab URL only when collection is authenticated.
  startVisit(input: BrowserActivityVisitStart): void {
    if (!this.context) {
      return
    }

    const occurredAtMs = input.occurredAtMs ?? this.now()
    const domain = resolveDomain(input.url)
    this.activeVisit = {
      clientVisitId: createClientVisitId(++this.visitSequence),
      domain,
      lastActivityAtMs: occurredAtMs,
      pageTitle: input.title,
      startedAtMs: occurredAtMs,
      tabId: input.tabId,
      url: input.url
    }
  }

  // recordUserActivity updates active timing without retaining raw keyboard, mouse, click, or scroll details.
  recordUserActivity(input: BrowserActivityUserActivity): void {
    if (!this.activeVisit) {
      return
    }

    this.activeVisit.lastActivityAtMs = Math.max(
      this.activeVisit.lastActivityAtMs,
      input.occurredAtMs
    )
  }

  // endVisit finalizes one authenticated tab visit summary.
  endVisit(input: BrowserActivityVisitEnd): void {
    if (!this.context || !this.activeVisit || this.activeVisit.tabId !== input.tabId) {
      return
    }

    this.pendingSummaries.push(renderSummary(this.context, this.activeVisit, input.occurredAtMs))
    this.activeVisit = null
  }

  // splitVisit finalizes one segment and keeps the same tab active without inventing user activity.
  splitVisit(input: BrowserActivityVisitEnd): void {
    if (!this.context || !this.activeVisit || this.activeVisit.tabId !== input.tabId) {
      return
    }

    const previousVisit = this.activeVisit
    const segmentEndedAtMs = Math.max(input.occurredAtMs, previousVisit.startedAtMs)
    this.pendingSummaries.push(renderSummary(this.context, previousVisit, segmentEndedAtMs))
    this.activeVisit = {
      ...previousVisit,
      clientVisitId: createClientVisitId(++this.visitSequence),
      startedAtMs: segmentEndedAtMs
    }
  }

  // drain returns completed authenticated summaries and clears the local upload queue.
  drain(): BrowserActivityVisitSummary[] {
    const summaries = [...this.pendingSummaries]
    this.pendingSummaries = []
    return summaries
  }
}

// renderSummary converts a local visit into the service contract's duration fields.
function renderSummary(
  context: AuthenticatedCollectorContext,
  visit: ActiveVisit,
  endedAtMs: number
): BrowserActivityVisitSummary {
  const safeEndedAtMs = Math.max(endedAtMs, visit.startedAtMs)
  const dwellMs = safeEndedAtMs - visit.startedAtMs
  const activeUntilMs = Math.min(safeEndedAtMs, visit.lastActivityAtMs + ACTIVE_WINDOW_MS)
  const activeMs = Math.max(0, activeUntilMs - visit.startedAtMs)
  const idleMs = Math.max(0, dwellMs - activeMs)
  const endedAt = new Date(safeEndedAtMs).toISOString()

  return {
    activeDurationSeconds: toSeconds(activeMs),
    clientVisitId: visit.clientVisitId,
    domain: visit.domain,
    dwellDurationSeconds: toSeconds(dwellMs),
    endedAt,
    extensionSessionId: context.extensionSessionId,
    foregroundDurationSeconds: toSeconds(dwellMs),
    idleDurationSeconds: toSeconds(idleMs),
    lastFlushedAt: endedAt,
    mergeKey: `${context.accountId}:${visit.domain}:${visit.url}`,
    pageTitle: visit.pageTitle,
    startedAt: new Date(visit.startedAtMs).toISOString(),
    url: visit.url
  }
}

// resolveDomain extracts a URL host while keeping invalid URLs out of the upload queue.
function resolveDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

// toSeconds normalizes millisecond intervals into non-negative integer seconds.
function toSeconds(valueMs: number): number {
  return Math.max(0, Math.round(valueMs / 1000))
}

// createClientVisitId generates a collision-resistant id so backend upsert only deduplicates true retries.
function createClientVisitId(sequence: number): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) {
    return `visit-${uuid}`
  }

  return `visit-${Date.now().toString(36)}-${sequence}-${Math.random().toString(36).slice(2)}`
}
