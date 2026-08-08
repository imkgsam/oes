import { Metadata } from '@grpc/grpc-js'
import { TrustedExecutionGuard } from './trusted-execution.guard'

const AUDIENCE = 'urn:oes:service:asset-service'
const WORKLOAD = {
  spiffeId: 'spiffe://local.oes/ns/oes/sa/api-gateway',
  certificateThumbprint: 'A'.repeat(43)
}

/** Builds an RPC execution context that records whether controller-visible request data was attached. */
function guardFixture(declaration: unknown, verified: Record<string, unknown>) {
  const metadata = new Metadata()
  metadata.set('authorization', 'Bearer execution.token')
  const data = {}
  const reflector = { getAllAndOverride: jest.fn(() => declaration) }
  const verifier = { verify: jest.fn(async () => verified) }
  const workloadIdentityProvider = {
    getVerifiedWorkloadIdentity: jest.fn(async () => WORKLOAD)
  }
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    getArgByIndex: jest.fn(() => ({ getAuthContext: jest.fn() })),
    switchToRpc: jest.fn(() => ({ getContext: () => metadata, getData: () => data }))
  }

  return {
    context,
    data,
    verifier,
    workloadIdentityProvider,
    guard: new TrustedExecutionGuard(
      reflector as never,
      verifier as never,
      workloadIdentityProvider as never,
      AUDIENCE
    )
  }
}

/** Verifies every Asset RPC is rejected before controller data is exposed unless its exact token mode validates. */
describe('TrustedExecutionGuard', () => {
  it('fails closed when a protected gRPC handler has no authorization declaration', async () => {
    const fixture = guardFixture(undefined, { principalType: 'HUMAN', permissionCodes: [] })

    await expect(fixture.guard.canActivate(fixture.context as never)).rejects.toThrow(
      'Access denied'
    )
    expect(fixture.verifier.verify).not.toHaveBeenCalled()
    expect(fixture.data).toEqual({})
  })

  it.each([
    ['delegated', 'DELEGATED', []],
    ['coded human', 'HUMAN', ['asset.read']]
  ])(
    'rejects SELF_SERVICE %s tokens before controller execution',
    async (_name, principalType, permissionCodes) => {
      const fixture = guardFixture(
        { mode: 'SELF_SERVICE', allowDelegated: true },
        { principalType, permissionCodes }
      )

      await expect(fixture.guard.canActivate(fixture.context as never)).rejects.toThrow(
        'Access denied'
      )
      expect(fixture.data).toEqual({})
    }
  )

  it.each([
    ['wrong permission codes', { principalType: 'HUMAN', permissionCodes: ['asset.read'] }],
    ['wrong audience', new Error('ExecutionToken audience is invalid')],
    ['wrong certificate confirmation', new Error('ExecutionToken cnf is invalid')]
  ])('rejects BUSINESS %s before controller execution', async (_name, outcome) => {
    const fixture = guardFixture(
      { mode: 'BUSINESS', permissions: { all: ['asset.write'] } },
      outcome instanceof Error
        ? { principalType: 'HUMAN', permissionCodes: ['asset.write'] }
        : outcome
    )
    if (outcome instanceof Error) {
      fixture.verifier.verify.mockRejectedValueOnce(outcome)
    }

    await expect(fixture.guard.canActivate(fixture.context as never)).rejects.toThrow()
    expect(fixture.data).toEqual({})
  })
})
