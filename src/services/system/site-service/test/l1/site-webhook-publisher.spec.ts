import { HttpSiteWebhookPublisher } from '../../src/infrastructure/adapters/http-site-webhook.publisher'

describe('site-service webhook publisher L1', () => {
  it('posts signed site.publish.available webhook with the dedicated webhook headers', async () => {
    const fetcher = jest.fn().mockResolvedValue({ ok: true, status: 202, text: async () => '' })
    const publisher = new HttpSiteWebhookPublisher({
      fetcher,
      now: () => new Date('2026-06-15T08:00:00.000Z'),
      nonce: () => 'nonce_webhook_a'
    })
    const payload = {
      event_id: 'event_a',
      site_id: 'site_a',
      event_type: 'site.publish.available',
      publish_version: 3,
      occurred_at: '2026-06-15T08:00:00.000Z'
    }

    await publisher.publish({
      targetUrl: 'https://runtime.example/oes/webhooks/site?z=2&a=1',
      signingSecret: 'webhook_secret_a',
      syncId: 'sync_a',
      siteId: 'site_a',
      eventId: 'event_a',
      eventType: 'site.publish.available',
      publishVersion: 3,
      payload,
      headers: {},
      resent: false,
      occurredAt: new Date('2026-06-15T08:00:00.000Z')
    })

    expect(fetcher).toHaveBeenCalledWith(
      'https://runtime.example/oes/webhooks/site?z=2&a=1',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'x-oes-site-id': 'site_a',
          'x-oes-event-id': 'event_a',
          'x-oes-timestamp': '1781510400000',
          'x-oes-nonce': 'nonce_webhook_a',
          'x-oes-signature': expect.stringMatching(/^v1=[a-f0-9]{64}$/)
        })
      })
    )
    const headers = fetcher.mock.calls[0][1].headers
    expect(headers).not.toHaveProperty('x-oes-client-id')
    expect(headers).not.toHaveProperty('x-oes-credential-id')
  })
})
