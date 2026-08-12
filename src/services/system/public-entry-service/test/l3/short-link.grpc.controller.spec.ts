import {
  PublicEntryShortLinkGrpcController,
  toGrpcShortLinkTargetKind,
  toGrpcShortLinkStatus
} from '../../src/interfaces/grpc/public-entry-short-link.grpc.controller'
import { ShortLinkApplicationService } from '../../src/application/services/short-link-application.service'
import { PublicRedirectService } from '../../src/application/services/public-redirect.service'
import { InMemoryShortLinkRepository } from '../../src/infrastructure/repositories/in-memory-short-link.repository'
import { ShortCodeGenerator } from '../../src/domain/services/short-code-generator'
import { ShortLinkTargetResolverRegistry } from '../../src/application/services/short-link-target-resolver.registry'
import { QrCodeService } from '../../src/application/services/qr-code.service'
import { attachVerifiedExecution } from '@oes/common/authorization'

function human<T extends object>(request: T): T {
  attachVerifiedExecution(request, { verifiedExecutionToken: { tenantId: 'tenant_001', subject: 'acc_admin', orgId: 'org_001' } as any, verifiedWorkloadIdentity: {} as any })
  return request
}
function machine<T extends object>(request: T): T {
  attachVerifiedExecution(request, { verifiedExecutionToken: { subject: 'gateway-machine' } as any, verifiedWorkloadIdentity: {} as any })
  return request
}

// buildController wires the gRPC controller directly for transport mapping tests.
function buildController() {
  const repository = new InMemoryShortLinkRepository()
  const resolverRegistry = new ShortLinkTargetResolverRegistry()
  const appService = new ShortLinkApplicationService(
    repository,
    new ShortCodeGenerator(() => 0),
    resolverRegistry,
    new QrCodeService()
  )
  const redirectService = new PublicRedirectService(repository, resolverRegistry)
  return {
    controller: new PublicEntryShortLinkGrpcController(appService, redirectService),
    appService,
    repository
  }
}

describe('PublicEntryShortLinkGrpcController', () => {
  it('creates, updates status, resolves redirect, reads stats, and generates QR through contract shapes', async () => {
    const { controller, repository } = buildController()

    const created = await controller.createShortLink(human({
      displayName: 'Public catalog',
      target: {
        targetKind: toGrpcShortLinkTargetKind('EXTERNAL_URL'),
        targetUrl: 'https://example.com/catalog'
      },
      entryPurpose: 'CATALOG',
      sourcePlacement: 'NAVIGATION'
    } as any))

    expect(created.shortLink?.targetKind).toBe(toGrpcShortLinkTargetKind('EXTERNAL_URL'))
    expect(created.shortLink?.status).toBe(toGrpcShortLinkStatus('ACTIVE'))

    const redirect = await controller.resolvePublicRedirect(machine({
      shortCode: created.shortLink?.shortCode,
      userAgent: 'Mozilla/5.0',
      ipAddress: '203.0.113.10',
      acceptLanguage: 'en-US,en;q=0.9'
    } as any))
    expect(redirect.location).toBe('https://example.com/catalog')
    expect(repository.visitEvents).toHaveLength(1)

    const stats = await controller.getShortLinkStats(human({
      shortLinkId: created.shortLink?.id
    } as any))
    expect(stats.totalVisits).toBe(1)
    expect(stats.byResultStatus).toEqual([{ key: 'REDIRECTED', count: 1 }])

    const qr = await controller.generateShortLinkQr(human({
      shortLinkId: created.shortLink?.id
    } as any))
    expect(qr.content).toBe(created.shortLink?.publicUrl)
    expect(qr.format).toBe('PNG')

    const status = await controller.changeShortLinkStatus(human({
      shortLinkId: created.shortLink?.id,
      targetStatus: toGrpcShortLinkStatus('DISABLED'),
      reason: 'Pause public access'
    } as any))
    expect(status.status).toBe(toGrpcShortLinkStatus('DISABLED'))
  })

  it('rejects an unspecified status before any mutation', async () => {
    const { controller } = buildController()
    await expect(controller.changeShortLinkStatus(human({ shortLinkId: 'short-link-1', targetStatus: 0 } as any))).rejects.toThrow('ShortLink target status is invalid')
  })
})
