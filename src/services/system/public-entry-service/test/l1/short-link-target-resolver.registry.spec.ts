import { ShortLinkTargetResolverRegistry } from '../../src/application/services/short-link-target-resolver.registry'

describe('ShortLinkTargetResolverRegistry', () => {
  it('resolves REDIRECT, UNAVAILABLE, and NOT_FOUND responses from registered target owners', async () => {
    const registry = new ShortLinkTargetResolverRegistry()
    registry.register('BUSINESS_CARD', {
      resolve: async ({ targetResourceId }) => {
        if (targetResourceId === 'missing')
          return { result: 'NOT_FOUND', resultTarget: 'business-card:not-found' }
        if (targetResourceId === 'disabled')
          return { result: 'UNAVAILABLE', resultTarget: 'business-card:unavailable' }
        return { result: 'REDIRECT', redirectUrl: `https://app.example/cards/${targetResourceId}` }
      }
    })

    await expect(
      registry.resolve({
        tenantId: 'tenant_001',
        targetType: 'BUSINESS_CARD',
        targetResourceId: 'card_001',
        requestContext: { userAgent: 'Mozilla/5.0' }
      })
    ).resolves.toEqual({ result: 'REDIRECT', redirectUrl: 'https://app.example/cards/card_001' })
    await expect(
      registry.resolve({
        tenantId: 'tenant_001',
        targetType: 'BUSINESS_CARD',
        targetResourceId: 'disabled',
        requestContext: {}
      })
    ).resolves.toEqual({ result: 'UNAVAILABLE', resultTarget: 'business-card:unavailable' })
    await expect(
      registry.resolve({
        tenantId: 'tenant_001',
        targetType: 'BUSINESS_CARD',
        targetResourceId: 'missing',
        requestContext: {}
      })
    ).resolves.toEqual({ result: 'NOT_FOUND', resultTarget: 'business-card:not-found' })
  })

  it('returns UNAVAILABLE for unsupported targetType and invalid resolver REDIRECT results', async () => {
    const registry = new ShortLinkTargetResolverRegistry()

    await expect(
      registry.resolve({
        tenantId: 'tenant_001',
        targetType: 'UNSUPPORTED',
        targetResourceId: 'res_001',
        requestContext: {}
      })
    ).resolves.toEqual({ result: 'UNAVAILABLE', resultTarget: 'resolver:unsupported-target-type' })

    registry.register('BROKEN', {
      resolve: async () => ({ result: 'REDIRECT' }) as any
    })
    await expect(
      registry.resolve({
        tenantId: 'tenant_001',
        targetType: 'BROKEN',
        targetResourceId: 'res_001',
        requestContext: {}
      })
    ).resolves.toEqual({ result: 'UNAVAILABLE', resultTarget: 'resolver:invalid-result' })
  })

  it('permits local development HTTP loopback redirects but still rejects non-loopback HTTP redirects', async () => {
    const registry = new ShortLinkTargetResolverRegistry()
    registry.register('LOCAL_CARD', {
      resolve: async () => ({
        result: 'REDIRECT',
        redirectUrl: 'http://localhost:5771/public/business-cards/card_001',
        resultTarget: 'business-card:web'
      })
    })
    registry.register('PLAIN_HTTP_CARD', {
      resolve: async () => ({
        result: 'REDIRECT',
        redirectUrl: 'http://example.com/public/business-cards/card_001',
        resultTarget: 'business-card:web'
      })
    })

    await expect(
      registry.resolve({
        tenantId: 'tenant_001',
        targetType: 'LOCAL_CARD',
        targetResourceId: 'card_001',
        requestContext: {}
      })
    ).resolves.toEqual({
      result: 'REDIRECT',
      redirectUrl: 'http://localhost:5771/public/business-cards/card_001',
      resultTarget: 'business-card:web'
    })
    await expect(
      registry.resolve({
        tenantId: 'tenant_001',
        targetType: 'PLAIN_HTTP_CARD',
        targetResourceId: 'card_001',
        requestContext: {}
      })
    ).resolves.toEqual({ result: 'UNAVAILABLE', resultTarget: 'resolver:invalid-result' })
  })
})
