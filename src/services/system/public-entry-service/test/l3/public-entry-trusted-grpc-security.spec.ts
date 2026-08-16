import { getRpcAuthorizationModeDeclaration } from '@oes/common/authorization'
import { PublicEntryShortLinkGrpcController } from '../../src/interfaces/grpc/public-entry-short-link.grpc.controller'
import { PublicEntryBusinessCardGrpcController } from '../../src/interfaces/grpc/public-entry-business-card.grpc.controller'
import { attachVerifiedExecution } from '@oes/common/authorization'
import { assertStatusPermission } from '../../src/interfaces/grpc/public-entry-short-link.grpc.controller'
import { ShortLinkStatus } from '@oes/common/generated/public_entry_service'

/** Verifies the frozen 19 HUMAN, one self-service, and three Gateway MACHINE declarations. */
describe('Public Entry trusted gRPC declarations', () => {
  it('classifies all 23 RPCs exactly once', () => {
    const shortLinkMethods = Object.getOwnPropertyNames(
      PublicEntryShortLinkGrpcController.prototype
    ).filter((name) => name !== 'constructor')
    const businessCardMethods = Object.getOwnPropertyNames(
      PublicEntryBusinessCardGrpcController.prototype
    ).filter((name) => name !== 'constructor')
    const methods = [...shortLinkMethods, ...businessCardMethods].filter(
      (name) => !name.startsWith('_')
    )
    const declared = methods.filter(
      (name) =>
        getRpcAuthorizationModeDeclaration(PublicEntryShortLinkGrpcController.prototype, name) ??
        getRpcAuthorizationModeDeclaration(PublicEntryBusinessCardGrpcController.prototype, name)
    )
    expect(declared).toHaveLength(23)
    expect(
      getRpcAuthorizationModeDeclaration(
        PublicEntryBusinessCardGrpcController.prototype,
        'getOwnBusinessCardPreview'
      )
    ).toEqual(
      expect.objectContaining({
        mode: 'SELF_SERVICE',
        allowDelegated: false,
        sessionTerminals: ['WEB']
      })
    )
    for (const name of [
      'resolvePublicRedirect',
      'renderPublicBusinessCard',
      'generateBusinessCardVCard'
    ]) {
      const target =
        name === 'resolvePublicRedirect'
          ? PublicEntryShortLinkGrpcController.prototype
          : PublicEntryBusinessCardGrpcController.prototype
      expect(getRpcAuthorizationModeDeclaration(target, name)).toEqual(
        expect.objectContaining({ mode: 'BUSINESS', principalType: 'MACHINE' })
      )
    }
  })

  it('admits status transitions with the three candidate Codes, then enforces exact binding', () => {
    for (const [status, code] of [
      [ShortLinkStatus.SHORT_LINK_STATUS_ACTIVE, 'public-entry.short-link.update'],
      [ShortLinkStatus.SHORT_LINK_STATUS_DISABLED, 'public-entry.short-link.disable'],
      [ShortLinkStatus.SHORT_LINK_STATUS_ARCHIVED, 'public-entry.short-link.archive']
    ] as const) {
      const request = {} as Record<string, unknown>
      attachVerifiedExecution(request, {
        verifiedExecutionToken: { permissionCodes: [code] } as any,
        verifiedWorkloadIdentity: {} as any
      })
      expect(() => assertStatusPermission(request, status)).not.toThrow()
      for (const wrong of [
        'public-entry.short-link.update',
        'public-entry.short-link.disable',
        'public-entry.short-link.archive'
      ].filter((candidate) => candidate !== code)) {
        const mismatch = {} as Record<string, unknown>
        attachVerifiedExecution(mismatch, {
          verifiedExecutionToken: { permissionCodes: [wrong] } as any,
          verifiedWorkloadIdentity: {} as any
        })
        expect(() => assertStatusPermission(mismatch, status)).toThrow(
          'ShortLink status permission mismatch'
        )
      }
    }
    const broad = {} as Record<string, unknown>
    attachVerifiedExecution(broad, {
      verifiedExecutionToken: {
        permissionCodes: ['public-entry.short-link.update', 'public-entry.short-link.disable']
      } as any,
      verifiedWorkloadIdentity: {} as any
    })
    expect(() => assertStatusPermission(broad, ShortLinkStatus.SHORT_LINK_STATUS_ACTIVE)).toThrow()
  })
})
