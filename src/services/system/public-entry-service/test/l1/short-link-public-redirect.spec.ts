import { PublicRedirectService } from '../../src/application/services/public-redirect.service'
import { ShortLinkApplicationService } from '../../src/application/services/short-link-application.service'
import { ShortLinkTargetResolverRegistry } from '../../src/application/services/short-link-target-resolver.registry'
import { QrCodeService } from '../../src/application/services/qr-code.service'
import { ShortCodeGenerator } from '../../src/domain/services/short-code-generator'
import { InMemoryShortLinkRepository } from '../../src/infrastructure/repositories/in-memory-short-link.repository'

const operator = {
  operatorAccountId: 'acc_admin',
  operatorOrgId: 'org_001',
  traceId: 'trace_001'
}

// buildRedirectService creates redirect dependencies with controllable resolver behavior.
function buildRedirectService() {
  const repository = new InMemoryShortLinkRepository()
  const resolverRegistry = new ShortLinkTargetResolverRegistry()
  const appService = new ShortLinkApplicationService(
    repository,
    new ShortCodeGenerator(() => 0),
    resolverRegistry,
    new QrCodeService()
  )
  const redirectService = new PublicRedirectService(repository, resolverRegistry)
  return { appService, redirectService, repository, resolverRegistry }
}

describe('PublicRedirectService', () => {
  it('redirects active EXTERNAL_URL links and records one REDIRECTED VisitEvent', async () => {
    const { appService, redirectService, repository } = buildRedirectService()
    const created = await appService.createShortLink({
      tenantId: 'tenant_001',
      displayName: 'External link',
      target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://example.com/public' },
      entryPurpose: 'PRODUCT_GUIDE',
      sourcePlacement: 'SHOWROOM',
      operatorContext: operator
    })

    const result = await redirectService.resolveVisit({
      shortCode: created.shortLink.shortCode,
      requestContext: {
        userAgent: 'Mozilla/5.0 iPhone',
        ipAddress: '203.0.113.10',
        acceptLanguage: 'en-US,en;q=0.9',
        referrer: 'https://ref.example',
        traceId: 'trace_public_001'
      }
    })

    expect(result).toEqual({ type: 'REDIRECT', location: 'https://example.com/public' })
    expect(repository.visitEvents).toHaveLength(1)
    expect(repository.visitEvents[0]).toMatchObject({
      shortLinkId: created.shortLink.id,
      resultStatus: 'REDIRECTED',
      detectedChannel: 'BROWSER',
      deviceType: 'MOBILE',
      locale: 'en-US'
    })
  })

  it.each([
    ['DISABLED', 'DISABLED'],
    ['ARCHIVED', 'ARCHIVED']
  ] as const)(
    'returns generic unavailable for %s links and records %s',
    async (status, resultStatus) => {
      const { appService, redirectService, repository } = buildRedirectService()
      const created = await appService.createShortLink({
        tenantId: 'tenant_001',
        displayName: `${status} link`,
        target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://example.com/public' },
        entryPurpose: 'PRODUCT_GUIDE',
        sourcePlacement: 'SHOWROOM',
        operatorContext: operator
      })
      await appService.changeStatus({
        tenantId: 'tenant_001',
        shortLinkId: created.shortLink.id,
        targetStatus: status,
        reason: 'Governed by admin',
        operatorContext: operator
      })

      await expect(
        redirectService.resolveVisit({
          shortCode: created.shortLink.shortCode,
          requestContext: { userAgent: 'Mozilla/5.0', ipAddress: '203.0.113.10' }
        })
      ).resolves.toEqual({ type: 'UNAVAILABLE' })
      expect(repository.visitEvents.at(-1)?.resultStatus).toBe(resultStatus)
    }
  )

  it('treats ACTIVE expired links as unavailable and records EXPIRED', async () => {
    const { appService, redirectService, repository } = buildRedirectService()
    const created = await appService.createShortLink({
      tenantId: 'tenant_001',
      displayName: 'Expired link',
      target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://example.com/public' },
      entryPurpose: 'PRODUCT_GUIDE',
      sourcePlacement: 'SHOWROOM',
      expiresAt: '2026-06-01T00:00:00.000Z',
      operatorContext: operator
    })

    const result = await redirectService.resolveVisit({
      shortCode: created.shortLink.shortCode,
      now: new Date('2026-06-08T00:00:00.000Z'),
      requestContext: { userAgent: 'Mozilla/5.0', ipAddress: '203.0.113.10' }
    })

    expect(result).toEqual({ type: 'UNAVAILABLE' })
    expect(repository.visitEvents.at(-1)?.resultStatus).toBe('EXPIRED')
  })

  it.each([
    [
      'REDIRECT',
      { type: 'REDIRECT', location: 'https://app.example/cards/card_001' },
      'REDIRECTED'
    ],
    ['UNAVAILABLE', { type: 'UNAVAILABLE' }, 'INVALID_TARGET'],
    ['NOT_FOUND', { type: 'UNAVAILABLE' }, 'INVALID_TARGET']
  ] as const)(
    'maps resolver %s for INTERNAL_REF links',
    async (resolverResult, publicResult, visitStatus) => {
      const { appService, redirectService, repository, resolverRegistry } = buildRedirectService()
      resolverRegistry.register('BUSINESS_CARD', {
        resolve: async () =>
          resolverResult === 'REDIRECT'
            ? {
                result: 'REDIRECT',
                redirectUrl: 'https://app.example/cards/card_001',
                resultTarget: 'business-card:web'
              }
            : { result: resolverResult, resultTarget: 'business-card:test' }
      })
      const created = await appService.createShortLink({
        tenantId: 'tenant_001',
        displayName: 'Internal link',
        target: {
          targetKind: 'INTERNAL_REF',
          targetType: 'BUSINESS_CARD',
          targetResourceId: 'card_001'
        },
        entryPurpose: 'BUSINESS_CARD',
        sourcePlacement: 'MAIN_PROFILE',
        operatorContext: operator
      })

      await expect(
        redirectService.resolveVisit({
          shortCode: created.shortLink.shortCode,
          requestContext: { userAgent: 'Mozilla/5.0', ipAddress: '203.0.113.10' }
        })
      ).resolves.toEqual(publicResult)
      expect(repository.visitEvents.at(-1)?.resultStatus).toBe(visitStatus)
    }
  )

  it('does not create VisitEvent for missing shortCode', async () => {
    const { redirectService, repository } = buildRedirectService()

    await expect(
      redirectService.resolveVisit({
        shortCode: 'missing',
        requestContext: { userAgent: 'Mozilla/5.0', ipAddress: '203.0.113.10' }
      })
    ).resolves.toEqual({ type: 'NOT_FOUND' })

    expect(repository.visitEvents).toHaveLength(0)
  })

  it('does not block redirect when VisitEvent persistence fails', async () => {
    const { appService, redirectService, repository } = buildRedirectService()
    const created = await appService.createShortLink({
      tenantId: 'tenant_001',
      displayName: 'Best effort link',
      target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://example.com/public' },
      entryPurpose: 'PRODUCT_GUIDE',
      sourcePlacement: 'SHOWROOM',
      operatorContext: operator
    })
    repository.failVisitWrites = true

    await expect(
      redirectService.resolveVisit({
        shortCode: created.shortLink.shortCode,
        requestContext: { userAgent: 'Mozilla/5.0', ipAddress: '203.0.113.10' }
      })
    ).resolves.toEqual({ type: 'REDIRECT', location: 'https://example.com/public' })
    expect(repository.visitEvents).toHaveLength(0)
  })
})
