import 'reflect-metadata'
import {
  AuthorizeBusinessRpc,
  AuthorizeInternalCall,
  AuthorizeSelfServiceRpc,
  getRpcAuthorizationModeDeclaration,
  RPC_AUTHORIZATION_MODE_METADATA_KEY
} from './declarations'

// Exercises declaration-only metadata primitives without invoking a server authorization path.
describe('trusted gRPC authorization declarations', () => {
  // Proves BUSINESS metadata is normalized and immutable for later runtime consumption.
  it('declares an immutable BUSINESS authorization mode with normalized permission codes', () => {
    class BusinessController {
      @AuthorizeBusinessRpc({ all: [' crm.lead.read '] })
      readLead(): void {}
    }

    const declaration = getRpcAuthorizationModeDeclaration(BusinessController.prototype, 'readLead')

    expect(declaration).toEqual({ mode: 'BUSINESS', permissions: { all: ['crm.lead.read'] } })
    expect(Object.isFrozen(declaration)).toBe(true)
    expect(RPC_AUTHORIZATION_MODE_METADATA_KEY).toBe('oes:trusted-execution:rpc-authorization-mode')
  })

  it('preserves an optional method-local BUSINESS principal constraint', () => {
    class BrowserController {
      @AuthorizeBusinessRpc(
        { all: ['browser_activity.policy.read'] },
        { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
      )
      getPolicy(): void {}
    }

    expect(getRpcAuthorizationModeDeclaration(BrowserController.prototype, 'getPolicy')).toEqual({
      mode: 'BUSINESS',
      permissions: { all: ['browser_activity.policy.read'] },
      principalType: 'HUMAN',
      sessionTerminals: ['WEB']
    })
  })

  // Proves the other two structural modes exist without selecting a service RPC mapping.
  it('declares SELF_SERVICE and INTERNAL modes without performing authorization', () => {
    class StructuralController {
      @AuthorizeSelfServiceRpc({ allowDelegated: false })
      getOwnProfile(): void {}

      @AuthorizeInternalCall({ all: ['asset.internal.site-media.resolve'] })
      resolveSiteMedia(): void {}
    }

    expect(
      getRpcAuthorizationModeDeclaration(StructuralController.prototype, 'getOwnProfile')
    ).toEqual({
      mode: 'SELF_SERVICE',
      allowDelegated: false
    })
    expect(
      getRpcAuthorizationModeDeclaration(StructuralController.prototype, 'resolveSiteMedia')
    ).toEqual({
      mode: 'INTERNAL',
      permissions: { all: ['asset.internal.site-media.resolve'] }
    })
  })

  // Proves invalid local metadata cannot silently become a declaration.
  it('rejects invalid declaration shapes before metadata is attached', () => {
    expect(() => AuthorizeBusinessRpc({ all: [], any: ['crm.lead.read'] } as never)).toThrow(
      'BUSINESS authorization must declare exactly one of all or any permission codes'
    )
    expect(() => AuthorizeInternalCall({ all: [] })).toThrow(
      'INTERNAL authorization all permission codes must be a non-empty array'
    )
    expect(() =>
      AuthorizeBusinessRpc({ all: ['crm.lead.read'] }, { sessionTerminals: [] })
    ).toThrow('trusted execution session terminals must be a non-empty array')
    expect(() =>
      AuthorizeBusinessRpc({ all: ['crm.lead.read'] }, { sessionTerminals: ['WEB', 'WEB'] })
    ).toThrow('trusted execution session terminals must not contain duplicates')
  })

  it('copies and freezes a normalized declaration array', () => {
    const terminals: Array<'WEB' | 'BROWSER_EXTENSION'> = ['WEB', 'BROWSER_EXTENSION']
    class StructuralController {
      @AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminals: terminals })
      own(): void {}
    }
    terminals.pop()

    const declaration = getRpcAuthorizationModeDeclaration(StructuralController.prototype, 'own')
    expect(declaration).toEqual({
      mode: 'SELF_SERVICE',
      allowDelegated: false,
      sessionTerminals: ['WEB', 'BROWSER_EXTENSION']
    })
    expect(
      Object.isFrozen((declaration as { sessionTerminals: readonly string[] }).sessionTerminals)
    ).toBe(true)
  })
})
