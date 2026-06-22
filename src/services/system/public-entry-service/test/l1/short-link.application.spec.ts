import { ShortLinkApplicationService } from '../../src/application/services/short-link-application.service'
import { InMemoryShortLinkRepository } from '../../src/infrastructure/repositories/in-memory-short-link.repository'
import { ShortCodeGenerator } from '../../src/domain/services/short-code-generator'
import { ShortLinkTargetResolverRegistry } from '../../src/application/services/short-link-target-resolver.registry'
import { QrCodeService } from '../../src/application/services/qr-code.service'

const operator = {
  operatorAccountId: 'acc_admin',
  operatorOrgId: 'org_001',
  traceId: 'trace_001'
}

// buildService creates an application service with in-memory dependencies for behavior tests.
function buildService() {
  const repository = new InMemoryShortLinkRepository()
  const resolverRegistry = new ShortLinkTargetResolverRegistry()
  const service = new ShortLinkApplicationService(
    repository,
    new ShortCodeGenerator(() => 0),
    resolverRegistry,
    new QrCodeService()
  )
  return { repository, resolverRegistry, service }
}

describe('ShortLinkApplicationService', () => {
  it('generates globally unique seven-character Base58-like short codes', async () => {
    const { service } = buildService()

    const first = await service.createShortLink({
      tenantId: 'tenant_001',
      displayName: 'Main product guide',
      target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://example.com/product' },
      entryPurpose: 'PRODUCT_GUIDE',
      sourcePlacement: 'SHOWROOM',
      operatorContext: operator
    })
    const second = await service.createShortLink({
      tenantId: 'tenant_002',
      displayName: 'Second product guide',
      target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://example.com/other' },
      entryPurpose: 'PRODUCT_GUIDE',
      sourcePlacement: 'SHOWROOM',
      operatorContext: operator
    })

    expect(first.shortLink.shortCode).toHaveLength(7)
    expect(second.shortLink.shortCode).toHaveLength(7)
    expect(first.shortLink.shortCode).not.toBe(second.shortLink.shortCode)
    expect(first.shortLink.shortCode).toMatch(/^[1-9A-HJ-NP-Za-km-z]{7}$/)
    expect(first.shortLink.publicUrl).toBe(`/c/${first.shortLink.shortCode}`)
  })

  it('rejects unsafe or non-https external URL targets', async () => {
    const { service } = buildService()

    await expect(
      service.createShortLink({
        tenantId: 'tenant_001',
        displayName: 'Unsafe target',
        target: { targetKind: 'EXTERNAL_URL', targetUrl: 'javascript:alert(1)' },
        entryPurpose: 'SECURITY_TEST',
        sourcePlacement: 'ADMIN',
        operatorContext: operator
      })
    ).rejects.toThrow('EXTERNAL_URL must use https')

    await expect(
      service.createShortLink({
        tenantId: 'tenant_001',
        displayName: 'HTTP target',
        target: { targetKind: 'EXTERNAL_URL', targetUrl: 'http://example.com' },
        entryPurpose: 'SECURITY_TEST',
        sourcePlacement: 'ADMIN',
        operatorContext: operator
      })
    ).rejects.toThrow('EXTERNAL_URL must use https')
  })

  it('validates INTERNAL_REF and EXTERNAL_URL target shapes', async () => {
    const { service } = buildService()

    await expect(
      service.createShortLink({
        tenantId: 'tenant_001',
        displayName: 'Missing resource',
        target: { targetKind: 'INTERNAL_REF', targetType: 'BUSINESS_CARD' } as any,
        entryPurpose: 'BUSINESS_CARD',
        sourcePlacement: 'MAIN_PROFILE',
        operatorContext: operator
      })
    ).rejects.toThrow('INTERNAL_REF requires targetType and targetResourceId')

    await expect(
      service.createShortLink({
        tenantId: 'tenant_001',
        displayName: 'Invalid external shape',
        target: {
          targetKind: 'EXTERNAL_URL',
          targetUrl: 'https://example.com',
          targetType: 'BUSINESS_CARD'
        } as any,
        entryPurpose: 'BUSINESS_CARD',
        sourcePlacement: 'MAIN_PROFILE',
        operatorContext: operator
      })
    ).rejects.toThrow('EXTERNAL_URL cannot include internal target fields')
  })

  it('migrates target without changing shortCode or publicUrl and records audit before and after', async () => {
    const { repository, service } = buildService()
    const created = await service.createShortLink({
      tenantId: 'tenant_001',
      displayName: 'Migrating link',
      target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://example.com/old' },
      entryPurpose: 'PRODUCT_GUIDE',
      sourcePlacement: 'SHOWROOM',
      operatorContext: operator
    })

    const migrated = await service.updateTarget({
      tenantId: 'tenant_001',
      shortLinkId: created.shortLink.id,
      target: {
        targetKind: 'INTERNAL_REF',
        targetType: 'BUSINESS_CARD',
        targetResourceId: 'card_001'
      },
      reason: 'Move to owned public page',
      operatorContext: operator
    })

    expect(migrated.publicUrl).toBe(created.shortLink.publicUrl)
    expect((await repository.getById('tenant_001', created.shortLink.id))?.shortCode).toBe(
      created.shortLink.shortCode
    )
    expect(repository.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'UPDATE_TARGET',
          before: expect.objectContaining({
            targetKind: 'EXTERNAL_URL',
            targetUrl: 'https://example.com/old'
          }),
          after: expect.objectContaining({
            targetKind: 'INTERNAL_REF',
            targetType: 'BUSINESS_CARD',
            targetResourceId: 'card_001'
          })
        })
      ])
    )
  })

  it('lists tenant short links across external URLs and internal references without a target-resource constraint', async () => {
    const { service } = buildService()
    const external = await service.createShortLink({
      tenantId: 'tenant_001',
      displayName: 'Supplier onboarding external entry',
      target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://supplier.example.com/onboarding' },
      entryPurpose: 'SUPPLIER_ONBOARDING',
      sourcePlacement: 'EMAIL',
      operatorContext: operator
    })
    const businessCard = await service.createShortLink({
      tenantId: 'tenant_001',
      displayName: 'Employee business card entry',
      target: {
        targetKind: 'INTERNAL_REF',
        targetType: 'BUSINESS_CARD',
        targetResourceId: 'card_001'
      },
      entryPurpose: 'BUSINESS_CARD',
      sourcePlacement: 'MAIN_PROFILE',
      operatorContext: operator
    })
    await service.createShortLink({
      tenantId: 'tenant_002',
      displayName: 'Other tenant entry',
      target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://other.example.com' },
      entryPurpose: 'OTHER',
      sourcePlacement: 'ADMIN',
      operatorContext: operator
    })

    await expect(
      service.listShortLinks({ tenantId: 'tenant_001', page: 1, pageSize: 20 })
    ).resolves.toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ id: businessCard.shortLink.id, targetKind: 'INTERNAL_REF' }),
        expect.objectContaining({ id: external.shortLink.id, targetKind: 'EXTERNAL_URL' })
      ]),
      page: 1,
      pageSize: 20,
      total: 2
    })

    await expect(
      service.listShortLinks({
        tenantId: 'tenant_001',
        page: 1,
        pageSize: 20,
        targetKind: 'EXTERNAL_URL'
      })
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ id: external.shortLink.id, targetKind: 'EXTERNAL_URL' })],
      total: 1
    })
  })

  it('aggregates VisitEvent stats without summary storage', async () => {
    const { repository, service } = buildService()
    const created = await service.createShortLink({
      tenantId: 'tenant_001',
      displayName: 'Stats link',
      target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://example.com/stats' },
      entryPurpose: 'PRODUCT_GUIDE',
      sourcePlacement: 'SHOWROOM',
      operatorContext: operator
    })
    await repository.recordVisit({
      id: 'visit_1',
      tenantId: 'tenant_001',
      shortLinkId: created.shortLink.id,
      visitedAt: new Date('2026-06-08T10:00:00Z'),
      userAgent: 'Mozilla/5.0',
      ipAddress: '203.0.113.10',
      detectedChannel: 'BROWSER',
      deviceType: 'DESKTOP',
      locale: 'en-US',
      referrer: 'https://ref.example',
      resultStatus: 'REDIRECTED'
    })
    await repository.recordVisit({
      id: 'visit_2',
      tenantId: 'tenant_001',
      shortLinkId: created.shortLink.id,
      visitedAt: new Date('2026-06-08T11:00:00Z'),
      userAgent: 'MicroMessenger',
      ipAddress: '203.0.113.11',
      detectedChannel: 'WECHAT',
      deviceType: 'MOBILE',
      locale: 'zh-CN',
      referrer: '',
      resultStatus: 'DISABLED'
    })

    await expect(
      service.getStats({ tenantId: 'tenant_002', shortLinkId: created.shortLink.id })
    ).rejects.toThrow('ShortLink not found')

    const stats = await service.getStats({
      tenantId: 'tenant_001',
      shortLinkId: created.shortLink.id
    })

    expect(stats).toMatchObject({
      shortLinkId: created.shortLink.id,
      totalVisits: 2,
      byResultStatus: { REDIRECTED: 1, DISABLED: 1 },
      byDetectedChannel: { BROWSER: 1, WECHAT: 1 },
      byDeviceType: { DESKTOP: 1, MOBILE: 1 },
      lastVisitedAt: '2026-06-08T11:00:00.000Z'
    })
  })

  it('generates a QR payload whose content is the public URL without creating a QR asset', async () => {
    const { repository, service } = buildService()
    const created = await service.createShortLink({
      tenantId: 'tenant_001',
      displayName: 'QR link',
      target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://example.com/qr' },
      entryPurpose: 'PRODUCT_GUIDE',
      sourcePlacement: 'SHOWROOM',
      operatorContext: operator
    })

    const qr = await service.generateQr({
      tenantId: 'tenant_001',
      shortLinkId: created.shortLink.id
    })

    expect(qr.content).toBe(created.shortLink.publicUrl)
    expect(qr.format).toBe('PNG')
    expect(qr.imageBase64.length).toBeGreaterThan(100)
    expect(repository.qrAssets).toHaveLength(0)
  })
})
