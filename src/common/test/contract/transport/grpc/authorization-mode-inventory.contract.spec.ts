import {
  buildGrpcAuthorizationModeInventory,
  type GrpcAuthorizationModeInventoryEntry
} from '../../../../src/transport/grpc/authorization-mode-inventory'

// Exercises only structural inventory checks, leaving real service classifications untouched.
describe('gRPC authorization mode inventory', () => {
  // Proves a future service owner can supply one explicit declaration per RPC.
  it('indexes one declaration per logical RPC without assigning service semantics', () => {
    const entries: readonly GrpcAuthorizationModeInventoryEntry[] = [
      {
        rpcId: 'asset-service.SiteMediaService/ResolveSiteMedia',
        declarations: [
          { mode: 'INTERNAL', permissions: { all: ['asset.internal.site-media.resolve'] } }
        ]
      },
      {
        rpcId: 'identity-service.ProfileService/GetOwnProfile',
        declarations: [{ mode: 'SELF_SERVICE', allowDelegated: false }]
      }
    ]

    expect(buildGrpcAuthorizationModeInventory(entries)).toEqual({
      'asset-service.SiteMediaService/ResolveSiteMedia': {
        mode: 'INTERNAL',
        permissions: { all: ['asset.internal.site-media.resolve'] }
      },
      'identity-service.ProfileService/GetOwnProfile': {
        mode: 'SELF_SERVICE',
        allowDelegated: false
      }
    })
  })

  // Proves the checker rejects gaps and conflicts instead of inferring an authorization mode.
  it('rejects a missing or duplicate declaration rather than choosing a mode', () => {
    expect(() =>
      buildGrpcAuthorizationModeInventory([{ rpcId: 'example.Service/Missing', declarations: [] }])
    ).toThrow('example.Service/Missing must declare exactly one RPC authorization mode; found 0')
    expect(() =>
      buildGrpcAuthorizationModeInventory([
        {
          rpcId: 'example.Service/Duplicate',
          declarations: [
            { mode: 'BUSINESS', permissions: { all: ['example.read'] } },
            { mode: 'INTERNAL', permissions: { all: ['example.internal.read'] } }
          ]
        }
      ])
    ).toThrow('example.Service/Duplicate must declare exactly one RPC authorization mode; found 2')
  })
})
