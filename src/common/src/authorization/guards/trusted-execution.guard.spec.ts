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
  metadata.set('authorization', 'Bearer e30.e30.e30')
  metadata.set('x-request-id', 'request-1')
  metadata.set('x-trace-id', '0123456789abcdef0123456789abcdef')
  metadata.set('traceparent', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01')
  const data = {}
  const reflector = { getAllAndOverride: jest.fn(() => declaration) }
  const verifier = {
    verify: jest.fn(async () => ({
      issuer: 'https://auth.local.oes.example',
      audience: AUDIENCE,
      subject: 'account-1',
      clientId: WORKLOAD.spiffeId,
      tokenId: 'token-1',
      issuedAt: 1,
      notBefore: 1,
      expiresAt: 2,
      certificateThumbprint: WORKLOAD.certificateThumbprint,
      ...verified
    }))
  }
  const workloadIdentityProvider = {
    getVerifiedWorkloadIdentity: jest.fn(async () => WORKLOAD)
  }
  const handler = jest.fn()
  const context = {
    getHandler: jest.fn(() => handler),
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
    ['human', 'HUMAN', {}, []],
    ['delegated', 'DELEGATED', { actor: 'actor-1', delegationId: 'delegation-1' }, []]
  ])(
    'allows SELF_SERVICE %s tokens when the declaration admits the principal',
    async (_name, principalType, delegation, permissionCodes) => {
      const fixture = guardFixture(
        { mode: 'SELF_SERVICE', allowDelegated: true },
        { principalType, ...delegation, permissionCodes }
      )

      await expect(fixture.guard.canActivate(fixture.context as never)).resolves.toBe(true)
      expect(fixture.data).toHaveProperty('__oesOperatorContext.verifiedExecutionToken')
    }
  )

  it.each([
    ['delegated when disabled', { mode: 'SELF_SERVICE', allowDelegated: false }, 'DELEGATED'],
    ['machine', { mode: 'SELF_SERVICE', allowDelegated: true }, 'MACHINE'],
    ['coded human', { mode: 'SELF_SERVICE', allowDelegated: true }, 'HUMAN']
  ])(
    'rejects SELF_SERVICE %s before controller execution',
    async (_name, declaration, principalType) => {
      const fixture = guardFixture(declaration, {
        principalType,
        permissionCodes: principalType === 'HUMAN' ? ['asset.read'] : [],
        ...(principalType === 'DELEGATED' ? { actor: 'actor-1', delegationId: 'delegation-1' } : {})
      })

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

  it.each(['MACHINE', 'DELEGATED'] as const)(
    'rejects a Browser HUMAN-only BUSINESS declaration for %s before attachment',
    async (principalType) => {
      const fixture = guardFixture(
        {
          mode: 'BUSINESS',
          permissions: { all: ['browser_activity.policy.read'] },
          principalType: 'HUMAN',
          sessionTerminals: ['WEB', 'BROWSER_EXTENSION']
        },
        {
          principalType,
          permissionCodes: ['browser_activity.policy.read'],
          sessionTerminal: 'PDA'
        }
      )

      await expect(fixture.guard.canActivate(fixture.context as never)).rejects.toThrow(
        'Access denied'
      )
      expect(fixture.data).toEqual({})
    }
  )

  it('accepts exact membership in an immutable multi-terminal declaration', async () => {
    const declaration = Object.freeze({
      mode: 'BUSINESS' as const,
      permissions: Object.freeze({ all: Object.freeze(['crm.account.read']) }),
      principalType: 'HUMAN' as const,
      sessionTerminals: Object.freeze(['WEB', 'BROWSER_EXTENSION'] as const)
    })
    const fixture = guardFixture(declaration, {
      principalType: 'HUMAN',
      permissionCodes: ['crm.account.read'],
      sessionTerminal: 'BROWSER_EXTENSION'
    })

    await expect(fixture.guard.canActivate(fixture.context as never)).resolves.toBe(true)
    expect(fixture.data).toHaveProperty('__oesOperatorContext.requestId', 'request-1')
    expect(fixture.data).toHaveProperty(
      '__oesOperatorContext.traceId',
      '0123456789abcdef0123456789abcdef'
    )
  })
})
