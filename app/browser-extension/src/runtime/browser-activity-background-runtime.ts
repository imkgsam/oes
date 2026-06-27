import type { AuthStorage } from '../auth/storage'
import { BrowserActivityApi } from './browser-activity-api'
import type { BrowserActivityUserActivity } from './browser-activity-collector'
import { BrowserActivityCollector } from './browser-activity-collector'
import {
  BrowserActivityPersistentOutboxStore,
  type BrowserActivityOutboxStore
} from './browser-activity-outbox'
import {
  createBrowserActivityExtensionSessionId,
  resolveCollectionContext,
  type BrowserActivityCollectionContext
} from './browser-activity-runtime'

const CONTENT_SCRIPT_ID = 'oes-browser-activity-page-observer'
const CONTENT_SCRIPT_FILE = 'browser-activity-page-observer.js'
const HEARTBEAT_INTERVAL_MS = 60_000
const VISIT_FLUSH_INTERVAL_MS = 30_000
const DEFAULT_CONTROL_POLL_INTERVAL_MS = 60_000
const MIN_CONTROL_POLL_INTERVAL_MS = 5_000

interface BrowserActivityDynamicScriptingApi {
  registerContentScripts?(scripts: Array<Record<string, unknown>>): Promise<void>
  unregisterContentScripts?(options: { ids: string[] }): Promise<void>
}

export interface BrowserActivityContentScriptRegistryPort {
  register(): Promise<void>
  unregister(): Promise<void>
}

export interface BrowserActivityTabSnapshot {
  id?: number
  title?: string
  url?: string
}

export interface BrowserActivitySchedulerPort {
  clearInterval(id: unknown): void
  setInterval(handler: () => void | Promise<void>, delayMs: number): unknown
}

export interface BrowserActivityBackgroundRuntimeOptions {
  api?: Pick<BrowserActivityApi, 'appendVisitSessions' | 'disconnect' | 'getAuditControl' | 'heartbeat'>
  collector?: BrowserActivityCollector
  contentScripts?: BrowserActivityContentScriptRegistryPort
  now?: () => number
  onCollectionActivated?: () => void | Promise<void>
  outbox?: BrowserActivityOutboxStore
  scheduler?: BrowserActivitySchedulerPort
  storage: AuthStorage
}

// BrowserActivityContentScriptRegistry dynamically observes page activity only while extension auth is active.
export class BrowserActivityContentScriptRegistry implements BrowserActivityContentScriptRegistryPort {
  async register(): Promise<void> {
    const scripting = globalThis.chrome?.scripting as BrowserActivityDynamicScriptingApi | undefined
    if (!scripting?.registerContentScripts) {
      return
    }

    await this.unregister()
    await scripting.registerContentScripts([
      {
        allFrames: false,
        id: CONTENT_SCRIPT_ID,
        js: [CONTENT_SCRIPT_FILE],
        matches: ['http://*/*', 'https://*/*'],
        persistAcrossSessions: false,
        runAt: 'document_idle'
      }
    ])
  }

  async unregister(): Promise<void> {
    const scripting = globalThis.chrome?.scripting as BrowserActivityDynamicScriptingApi | undefined
    if (!scripting?.unregisterContentScripts) {
      return
    }

    try {
      await scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] })
    } catch {
      // Chrome throws when the script id is not registered in this service-worker lifetime.
    }
  }
}

// BrowserActivityBackgroundRuntime owns authenticated tab observation, heartbeat, and summary upload.
export class BrowserActivityBackgroundRuntime {
  private activeContext: BrowserActivityCollectionContext | null = null
  private activeTab: { id: number; title: string; url: string } | null = null
  private controlContext: BrowserActivityCollectionContext | null = null
  private readonly api: Pick<BrowserActivityApi, 'appendVisitSessions' | 'disconnect' | 'getAuditControl' | 'heartbeat'>
  private readonly collector: BrowserActivityCollector
  private readonly contentScripts: BrowserActivityContentScriptRegistryPort
  private readonly now: () => number
  private readonly onCollectionActivated: () => void | Promise<void>
  private readonly outbox: BrowserActivityOutboxStore
  private readonly scheduler: BrowserActivitySchedulerPort
  private readonly storage: AuthStorage
  private controlTimer: unknown
  private heartbeatTimer: unknown
  private visitFlushTimer: unknown

  constructor(options: BrowserActivityBackgroundRuntimeOptions) {
    this.api = options.api ?? new BrowserActivityApi()
    this.collector = options.collector ?? new BrowserActivityCollector()
    this.contentScripts = options.contentScripts ?? new BrowserActivityContentScriptRegistry()
    this.now = options.now ?? (() => Date.now())
    this.onCollectionActivated = options.onCollectionActivated ?? (() => undefined)
    this.outbox = options.outbox ?? new BrowserActivityPersistentOutboxStore()
    this.scheduler = options.scheduler ?? {
      clearInterval: (id) => globalThis.clearInterval(id as ReturnType<typeof globalThis.setInterval>),
      setInterval: (handler, delayMs) => globalThis.setInterval(() => {
        void handler()
      }, delayMs)
    }
    this.storage = options.storage
  }

  // restore aligns collection with the current extension auth session and clears collection when absent.
  async restore(): Promise<void> {
    const session = await this.storage.load()
    const context = resolveCollectionContext(session)
    if (!context) {
      await this.stopAllCollection()
      return
    }

    this.controlContext = context
    const control = await this.api.getAuditControl(context.accessToken)
    if (control.enabled) {
      await this.activateCollection(context)
      return
    }

    await this.suspendCollectionAndPollControl(context, control.nextPollAfterSeconds)
  }

  // recordForegroundTab starts a new authenticated foreground visit for auditable browser URLs.
  async recordForegroundTab(tab: BrowserActivityTabSnapshot): Promise<void> {
    if (!this.activeContext || !tab.id || !isAuditableUrl(tab.url)) {
      return
    }

    if (this.activeTab?.id === tab.id && this.activeTab.url === tab.url) {
      return
    }

    await this.flushActiveVisit()
    this.activeTab = { id: tab.id, title: tab.title ?? '', url: tab.url }
    this.collector.startVisit({
      occurredAtMs: this.now(),
      tabId: tab.id,
      title: tab.title ?? '',
      url: tab.url
    })
  }

  // recordUserActivity records only an activity timestamp and type, never page content or raw input.
  async recordUserActivity(input: BrowserActivityUserActivity): Promise<void> {
    if (!this.activeContext) {
      return
    }

    this.collector.recordUserActivity(input)
  }

  // flushActiveVisit finalizes and uploads the current authenticated foreground visit.
  async flushActiveVisit(): Promise<void> {
    await this.flushActiveVisitSegment({ continueTracking: false, upload: true })
  }

  // handleActiveTabRemoved finalizes the tracked visit when Chrome closes the foreground tab.
  async handleActiveTabRemoved(tabId: number): Promise<void> {
    if (this.activeTab?.id !== tabId) {
      return
    }
    await this.flushActiveVisit()
  }

  // handleWindowFocusLost closes the current foreground visit when the browser no longer has focus.
  async handleWindowFocusLost(): Promise<void> {
    await this.flushActiveVisit()
  }

  // persistActiveVisitBeforeSuspend stores the current visit locally without relying on network completion.
  async persistActiveVisitBeforeSuspend(): Promise<void> {
    await this.flushActiveVisitSegment({ continueTracking: false, upload: false })
  }

  // flushActiveVisitSegment uploads a completed slice and can continue tracking the same active tab.
  private async flushActiveVisitSegment(options: { continueTracking: boolean; upload: boolean }): Promise<void> {
    if (!this.activeContext || !this.activeTab) {
      return
    }

    const previousTab = this.activeTab
    const segmentEnd = {
      occurredAtMs: this.now(),
      tabId: previousTab.id
    }
    if (options.continueTracking) {
      this.collector.splitVisit(segmentEnd)
    } else {
      this.collector.endVisit(segmentEnd)
    }
    this.activeTab = options.continueTracking ? previousTab : null
    await this.flushPendingSummaries({ upload: options.upload })
  }

  // stopAuthenticatedCollection clears every local collection artifact without upload.
  async stopAuthenticatedCollection(): Promise<void> {
    await this.stopAllCollection({ disconnect: true })
  }

  // stopAllCollection clears both data-channel and control-channel runtime state.
  private async stopAllCollection(options: { disconnect?: boolean } = {}): Promise<void> {
    const context = this.activeContext ?? this.controlContext
    this.stopControlTimer()
    this.stopDataTimers()
    if (context && options.disconnect) {
      await this.disconnectPresence(context)
    }
    this.controlContext = null
    this.activeContext = null
    this.activeTab = null
    this.collector.stop()
    this.collector.discard()
    if (context) {
      await this.outbox.clear(context)
    }
    await this.contentScripts.unregister()
  }

  private async activateCollection(context: BrowserActivityCollectionContext): Promise<void> {
    this.stopControlTimer()
    this.activeContext = context
    this.controlContext = context
    this.collector.start(context)
    await this.contentScripts.register()
    if (await this.sendHeartbeat()) {
      this.startDataTimers()
      await this.drainOutbox(context)
      await this.onCollectionActivated()
    }
  }

  private async suspendCollectionAndPollControl(
    context: BrowserActivityCollectionContext,
    nextPollAfterSeconds?: number
  ): Promise<void> {
    this.stopDataTimers()
    this.activeContext = null
    this.activeTab = null
    this.controlContext = context
    this.collector.stop()
    this.collector.discard()
    await this.outbox.clear(context)
    await this.contentScripts.unregister()
    this.startControlTimer(nextPollAfterSeconds)
  }

  private startDataTimers(): void {
    this.stopDataTimers()
    this.heartbeatTimer = this.scheduler.setInterval(async () => {
      await this.sendHeartbeat()
    }, HEARTBEAT_INTERVAL_MS)
    this.visitFlushTimer = this.scheduler.setInterval(
      () => this.flushActiveVisitSegment({ continueTracking: true, upload: true }),
      VISIT_FLUSH_INTERVAL_MS
    )
  }

  private stopDataTimers(): void {
    if (this.heartbeatTimer !== undefined) {
      this.scheduler.clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
    if (this.visitFlushTimer !== undefined) {
      this.scheduler.clearInterval(this.visitFlushTimer)
      this.visitFlushTimer = undefined
    }
  }

  private startControlTimer(nextPollAfterSeconds?: number): void {
    this.stopControlTimer()
    this.controlTimer = this.scheduler.setInterval(async () => {
      await this.pollAuditControl()
    }, toControlPollDelayMs(nextPollAfterSeconds))
  }

  private stopControlTimer(): void {
    if (this.controlTimer !== undefined) {
      this.scheduler.clearInterval(this.controlTimer)
      this.controlTimer = undefined
    }
  }

  private async pollAuditControl(): Promise<void> {
    const context = this.controlContext
    if (!context) {
      return
    }
    const control = await this.api.getAuditControl(context.accessToken)
    if (control.enabled) {
      await this.activateCollection(context)
      return
    }
    this.startControlTimer(control.nextPollAfterSeconds)
  }

  private async sendHeartbeat(): Promise<boolean> {
    if (!this.activeContext) {
      return false
    }

    const result = await this.api.heartbeat(this.activeContext.accessToken, {
      extensionSessionId: createBrowserActivityExtensionSessionId(this.activeContext),
      observedAt: new Date(this.now()).toISOString()
    })
    if (!result.accepted || !result.policyEnabled) {
      await this.suspendCollectionAndPollControl(this.activeContext)
      return false
    }
    return true
  }

  private async disconnectPresence(context: BrowserActivityCollectionContext): Promise<void> {
    try {
      await this.api.disconnect(context.accessToken, {
        extensionSessionId: createBrowserActivityExtensionSessionId(context),
        observedAt: new Date(this.now()).toISOString()
      })
    } catch {
      // Local logout still owns cleanup when the server already expired or the network is unavailable.
    }
  }

  private async flushPendingSummaries(options: { upload: boolean }): Promise<void> {
    if (!this.activeContext) {
      return
    }

    const sessions = this.collector.drain()
    if (!sessions.length) {
      return
    }

    const context = this.activeContext
    await this.outbox.enqueue({
      accountId: context.accountId,
      nowMs: this.now(),
      sessions,
      tenantId: context.tenantId
    })
    if (options.upload) {
      await this.drainOutbox(context)
    }
  }

  private async drainOutbox(context: BrowserActivityCollectionContext): Promise<void> {
    const entries = await this.outbox.list({
      accountId: context.accountId,
      tenantId: context.tenantId
    })
    for (const entry of entries) {
      try {
        const result = await this.api.appendVisitSessions(context.accessToken, { sessions: entry.sessions })
        if (!result.policyEnabled) {
          await this.outbox.clear(context)
          await this.suspendCollectionAndPollControl(context)
          return
        }
        await this.outbox.remove([entry.id])
      } catch {
        return
      }
    }
  }
}

// isAuditableUrl keeps browser-internal and extension pages out of browser activity facts.
function isAuditableUrl(rawUrl: string | undefined): rawUrl is string {
  if (!rawUrl) {
    return false
  }

  try {
    const url = new URL(rawUrl)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// toControlPollDelayMs applies the service-provided control cadence while preventing busy polling.
function toControlPollDelayMs(nextPollAfterSeconds: number | undefined): number {
  if (typeof nextPollAfterSeconds !== 'number' || !Number.isFinite(nextPollAfterSeconds) || nextPollAfterSeconds <= 0) {
    return DEFAULT_CONTROL_POLL_INTERVAL_MS
  }

  return Math.max(MIN_CONTROL_POLL_INTERVAL_MS, Math.round(nextPollAfterSeconds * 1000))
}
