import { getRpcAuthorizationModeDeclaration } from '@oes/common/authorization'
import { PublicEntryShortLinkGrpcController } from '../../src/interfaces/grpc/public-entry-short-link.grpc.controller'
import { PublicEntryBusinessCardGrpcController } from '../../src/interfaces/grpc/public-entry-business-card.grpc.controller'

/** Verifies the frozen 19 HUMAN, one self-service, and three Gateway MACHINE declarations. */
describe('Public Entry trusted gRPC declarations', () => {
  it('classifies all 23 RPCs exactly once', () => {
    const shortLinkMethods = Object.getOwnPropertyNames(PublicEntryShortLinkGrpcController.prototype).filter((name) => name !== 'constructor')
    const businessCardMethods = Object.getOwnPropertyNames(PublicEntryBusinessCardGrpcController.prototype).filter((name) => name !== 'constructor')
    const methods = [...shortLinkMethods, ...businessCardMethods].filter((name) => !name.startsWith('_'))
    const declared = methods.filter((name) => getRpcAuthorizationModeDeclaration(PublicEntryShortLinkGrpcController.prototype, name) ?? getRpcAuthorizationModeDeclaration(PublicEntryBusinessCardGrpcController.prototype, name))
    expect(declared).toHaveLength(23)
    expect(getRpcAuthorizationModeDeclaration(PublicEntryBusinessCardGrpcController.prototype, 'getOwnBusinessCardPreview')).toEqual(expect.objectContaining({ mode: 'SELF_SERVICE', allowDelegated: false, sessionTerminal: 'WEB' }))
    for (const name of ['resolvePublicRedirect', 'renderPublicBusinessCard', 'generateBusinessCardVCard']) {
      const target = name === 'resolvePublicRedirect' ? PublicEntryShortLinkGrpcController.prototype : PublicEntryBusinessCardGrpcController.prototype
      expect(getRpcAuthorizationModeDeclaration(target, name)).toEqual(expect.objectContaining({ mode: 'BUSINESS', principalType: 'MACHINE' }))
    }
  })
})
