import { describe, expect, it, vi } from 'vitest'

import { resolveShortLinkRedirectUrl } from './short-link-redirect.vue'

// Verifies the SPA fallback resolver delegates ShortLink target ownership back to the gateway.
describe('public ShortLink redirect fallback', () => {
  it('resolves a followed gateway redirect using a non-HTML request', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      redirected: true,
      status: 200,
      url: 'http://localhost:5771/public/business-cards/card_001'
    })

    await expect(resolveShortLinkRedirectUrl('ABC123', fetcher)).resolves.toBe(
      'http://localhost:5771/public/business-cards/card_001'
    )
    expect(fetcher).toHaveBeenCalledWith('/c/ABC123', {
      headers: { Accept: '*/*' }
    })
  })

  it('resolves a manual redirect location when the fetcher exposes one', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      headers: new Headers({
        location: 'http://localhost:5771/public/business-cards/card_001'
      }),
      redirected: false,
      status: 302,
      url: 'http://localhost:5771/c/ABC123'
    })

    await expect(resolveShortLinkRedirectUrl('ABC123', fetcher)).resolves.toBe(
      'http://localhost:5771/public/business-cards/card_001'
    )
  })

  it('returns null when the ShortLink service does not produce a redirect', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      headers: new Headers(),
      redirected: false,
      status: 404,
      url: 'http://localhost:5771/c/missing'
    })

    await expect(resolveShortLinkRedirectUrl('missing', fetcher)).resolves.toBeNull()
  })
})
