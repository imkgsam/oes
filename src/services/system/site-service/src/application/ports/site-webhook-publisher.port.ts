export interface PublishSiteWebhookInput {
  targetUrl?: string | null
  signingSecret?: string | null
  siteId: string
  syncId: string
  eventId: string
  eventType: string
  publishVersion: number
  payload: Record<string, unknown>
  headers: Record<string, unknown>
  resent: boolean
  occurredAt: Date
}

export interface SiteWebhookPublisher {
  publish(input: PublishSiteWebhookInput): Promise<void>
}

export const SITE_WEBHOOK_PUBLISHER = Symbol('SITE_WEBHOOK_PUBLISHER')

/** NoopSiteWebhookPublisher keeps local development deterministic when no runtime webhook endpoint is configured. */
export class NoopSiteWebhookPublisher implements SiteWebhookPublisher {
  /** publish accepts the delivery command without performing external I/O. */
  async publish(_input: PublishSiteWebhookInput): Promise<void> {}
}
