import { randomBytes } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { PublishSiteWebhookInput, SiteWebhookPublisher } from '../../application/ports/site-webhook-publisher.port'
import { signSiteWebhook } from '../../domain/security/site-webhook-signing'

export interface HttpSiteWebhookPublisherOptions {
  fetcher?: (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
    ok: boolean
    status: number
    text(): Promise<string>
  }>
  now?: () => Date
  nonce?: () => string
}

/** HttpSiteWebhookPublisher sends signed OES-to-runtime webhook notifications over HTTP POST. */
@Injectable()
export class HttpSiteWebhookPublisher implements SiteWebhookPublisher {
  constructor(private readonly options: HttpSiteWebhookPublisherOptions = {}) {}

  /** publish signs the frozen webhook payload and posts it to the configured Site Runtime endpoint. */
  async publish(input: PublishSiteWebhookInput): Promise<void> {
    if (!input.targetUrl) {
      throw new Error('webhook targetUrl is required')
    }
    if (!input.signingSecret) {
      throw new Error('webhook signingSecret is required')
    }

    const target = new URL(input.targetUrl)
    const body = JSON.stringify(input.payload)
    const timestamp = String((this.options.now?.() ?? new Date()).getTime())
    const nonce = this.options.nonce?.() ?? randomBytes(16).toString('base64url')
    const signed = signSiteWebhook({
      method: 'POST',
      path: target.pathname || '/',
      normalizedQuery: normalizeSearchParams(target.searchParams),
      body,
      siteId: input.siteId,
      eventId: input.eventId,
      timestamp,
      nonce,
      secret: input.signingSecret
    })
    const headers = {
      ...stringHeaders(input.headers),
      'content-type': 'application/json',
      'x-oes-site-id': input.siteId,
      'x-oes-event-id': input.eventId,
      'x-oes-timestamp': timestamp,
      'x-oes-nonce': nonce,
      'x-oes-signature': signed.signature
    }
    const response = await this.fetcher(input.targetUrl, {
      method: 'POST',
      headers,
      body
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`webhook dispatch failed with HTTP ${response.status}${text ? `: ${text}` : ''}`)
    }
  }

  /** fetcher returns the injected fetch implementation or the Node runtime fetch. */
  private fetcher(url: string, init: { method: string; headers: Record<string, string>; body: string }) {
    const fetcher = this.options.fetcher ?? globalThis.fetch
    if (!fetcher) {
      throw new Error('fetch is not available for webhook dispatch')
    }
    return fetcher(url, init)
  }
}

/** normalizeSearchParams serializes webhook URL query params with stable RFC3986 ordering. */
function normalizeSearchParams(searchParams: URLSearchParams): string {
  const pairs = Array.from(searchParams.entries())
  return pairs
    .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey === rightKey ? leftValue.localeCompare(rightValue) : leftKey.localeCompare(rightKey)
    )
    .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
    .join('&')
}

/** encodeRfc3986 encodes webhook query keys and values using strict percent escaping. */
function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  )
}

/** stringHeaders keeps only string-valued custom webhook headers before signing headers are applied. */
function stringHeaders(headers: Record<string, unknown>): Record<string, string> {
  return Object.entries(headers).reduce<Record<string, string>>((normalized, [key, value]) => {
    if (typeof value === 'string') {
      normalized[key] = value
    }
    return normalized
  }, {})
}
