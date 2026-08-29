import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { CollaborationTaskOutboxRelay } from './collaboration-task-outbox.relay'

/** Runs the Collaboration-owned outbox relay with overlap prevention, bounded backoff, and awaited shutdown. */
@Injectable()
export class CollaborationTaskOutboxWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CollaborationTaskOutboxWorker.name)
  private timer: NodeJS.Timeout | undefined
  private inFlight: Promise<void> | undefined
  private intervalMs = 0
  private failures = 0
  private nextRunAt = 0
  private stopped = true

  constructor(private readonly relay: CollaborationTaskOutboxRelay) {}

  /** Starts one immediate tick and a single bounded schedule after configuration is validated. */
  onModuleInit(): void {
    this.intervalMs = requiredInterval(process.env.COLLABORATION_OUTBOX_INTERVAL_MS)
    this.stopped = false
    this.timer = setInterval(() => this.startTick(), this.intervalMs)
    this.startTick()
  }

  /** Stops new ticks and waits for the one lease-holding relay call already in progress. */
  async onModuleDestroy(): Promise<void> {
    this.stopped = true
    if (this.timer) clearInterval(this.timer)
    this.timer = undefined
    await this.inFlight
  }

  /** Exposes one deterministic tick for focused component and task-owned runtime verification. */
  async runOnce(now = new Date()): Promise<void> {
    await this.relay.relayOnce(now)
  }

  /** Starts a tick only when no prior tick or failure backoff still owns this worker. */
  private startTick(): void {
    if (this.stopped || this.inFlight || Date.now() < this.nextRunAt) return
    const run = this.runOnce()
      .then(() => {
        this.failures = 0
        this.nextRunAt = Date.now() + this.intervalMs
      })
      .catch((error: unknown) => {
        this.failures += 1
        this.nextRunAt =
          Date.now() + Math.min(300_000, this.intervalMs * 2 ** Math.min(this.failures, 8))
        this.logger.error(`Collaboration outbox worker tick failed: ${safeErrorMessage(error)}`)
      })
      .finally(() => {
        if (this.inFlight === run) this.inFlight = undefined
      })
    this.inFlight = run
  }
}

/** Requires an explicit operational interval so production startup never invents relay cadence. */
function requiredInterval(value: string | undefined): number {
  const interval = Number(value)
  if (!Number.isSafeInteger(interval) || interval < 100 || interval > 300_000) {
    throw new Error('COLLABORATION_OUTBOX_INTERVAL_REQUIRED')
  }
  return interval
}

/** Reduces scheduling failures to a bounded operational message. */
function safeErrorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : 'unexpected relay failure').slice(0, 1_000)
}
