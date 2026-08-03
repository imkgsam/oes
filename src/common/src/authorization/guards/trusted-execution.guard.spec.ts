const { Metadata } = require('@grpc/grpc-js')
const { TrustedExecutionGuard } = require('./trusted-execution.guard')

export {}

describe('TrustedExecutionGuard', () => {
  const workloadIdentity = {
    spiffeId: 'spiffe://local.oes/ns/oes/sa/api-gateway',
    certificateThumbprint: 'A'.repeat(43)
  }
  const verifiedToken = Object.freeze({
    issuer: 'https://auth.local.oes.example',
    audience: 'urn:oes:service:asset-service',
    subject: 'account-trusted',
    principalType: 'HUMAN',
    clientId: workloadIdentity.spiffeId,
    tenantId: 'tenant-trusted',
    permissionCodes: ['hr.employee.create'],
    tokenId: 'token-1',
    issuedAt: 1,
    notBefore: 1,
    expiresAt: 2,
    certificateThumbprint: workloadIdentity.certificateThumbprint,
    sessionId: 'session-1'
  })

  /** Builds one gRPC invocation whose body carries hostile legacy identity fields. */
  function contextFixture({ includeToken = true } = {}) {
    const metadata = new Metadata()
    if (includeToken) metadata.set('authorization', 'Bearer a.b.c')
    metadata.set('x-request-id', 'request-1')
    metadata.set('traceparent', '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01')
    const rpcData = {
      tenantId: 'body-tenant',
      operatorId: 'body-operator',
      accountId: 'body-account'
    }
    const call = { getAuthContext: jest.fn() }
    return {
      context: {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        getArgByIndex: jest.fn((index) => (index === 2 ? call : undefined)),
        switchToRpc: jest.fn(() => ({ getData: () => rpcData, getContext: () => metadata }))
      },
      rpcData
    }
  }

  it('derives BUSINESS authority from the verified token rather than body identity', async () => {
    const reflector = {
      getAll: jest.fn(() => [{ mode: 'BUSINESS', permissions: { all: ['hr.employee.create'] } }])
    }
    const verifier = { verify: jest.fn().mockResolvedValue(verifiedToken) }
    const workloadIdentityProvider = {
      getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue(workloadIdentity)
    }
    const trustedContextStore = { attach: jest.fn() }
    const { context, rpcData } = contextFixture()

    await expect(
      new TrustedExecutionGuard(
        reflector,
        verifier,
        workloadIdentityProvider,
        trustedContextStore,
        'urn:oes:service:asset-service'
      ).canActivate(context)
    ).resolves.toBe(true)

    expect(verifier.verify).toHaveBeenCalledWith({
      token: 'a.b.c',
      targetAudience: 'urn:oes:service:asset-service',
      workloadIdentity
    })
    expect(trustedContextStore.attach).toHaveBeenCalledWith(
      rpcData,
      expect.objectContaining({ subject: 'account-trusted', tenantId: 'tenant-trusted' })
    )
  })

  it('rejects a BUSINESS token that lacks its declared Code', async () => {
    const reflector = {
      getAll: jest.fn(() => [{ mode: 'BUSINESS', permissions: { all: ['hr.employee.create'] } }])
    }
    const verifier = {
      verify: jest.fn().mockResolvedValue({ ...verifiedToken, permissionCodes: [] })
    }
    const workloadIdentityProvider = {
      getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue(workloadIdentity)
    }
    const { context } = contextFixture()

    await expect(
      new TrustedExecutionGuard(
        reflector,
        verifier,
        workloadIdentityProvider,
        { attach: jest.fn() },
        'urn:oes:service:asset-service'
      ).canActivate(context)
    ).rejects.toThrow('Access denied')
  })

  it('allows delegated SELF_SERVICE only when the method explicitly opts in', async () => {
    const delegatedToken = {
      ...verifiedToken,
      principalType: 'DELEGATED',
      actor: { sub: 'assistant-1' },
      delegationId: 'delegation-1',
      permissionCodes: []
    }
    const verifier = { verify: jest.fn().mockResolvedValue(delegatedToken) }
    const workloadIdentityProvider = {
      getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue(workloadIdentity)
    }
    const trustedContextStore = { attach: jest.fn() }
    const { context, rpcData } = contextFixture()

    await expect(
      new TrustedExecutionGuard(
        { getAll: jest.fn(() => [{ mode: 'SELF_SERVICE', allowDelegated: true }]) },
        verifier,
        workloadIdentityProvider,
        trustedContextStore,
        'urn:oes:service:asset-service'
      ).canActivate(context)
    ).resolves.toBe(true)

    expect(trustedContextStore.attach).toHaveBeenCalledWith(
      rpcData,
      expect.objectContaining({
        subject: 'account-trusted',
        actor: 'assistant-1',
        delegationId: 'delegation-1'
      })
    )

    await expect(
      new TrustedExecutionGuard(
        { getAll: jest.fn(() => [{ mode: 'SELF_SERVICE', allowDelegated: false }]) },
        verifier,
        workloadIdentityProvider,
        trustedContextStore,
        'urn:oes:service:asset-service'
      ).canActivate(context)
    ).rejects.toThrow('Access denied')
  })

  it('requires the exact INTERNAL Code without accepting request-body identity', async () => {
    const reflector = {
      getAll: jest.fn(() => [
        {
          mode: 'INTERNAL',
          permissions: { all: ['asset.internal.avatar.resolve_public_url'] }
        }
      ])
    }
    const verifier = {
      verify: jest.fn().mockResolvedValue({
        ...verifiedToken,
        principalType: 'MACHINE',
        subject: 'gateway-workload',
        permissionCodes: ['asset.internal.avatar.resolve_public_url']
      })
    }
    const trustedContextStore = { attach: jest.fn() }
    const { context, rpcData } = contextFixture()

    await expect(
      new TrustedExecutionGuard(
        reflector,
        verifier,
        { getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue(workloadIdentity) },
        trustedContextStore,
        'urn:oes:service:asset-service'
      ).canActivate(context)
    ).resolves.toBe(true)

    expect(trustedContextStore.attach).toHaveBeenCalledWith(
      rpcData,
      expect.objectContaining({ subject: 'gateway-workload', tenantId: 'tenant-trusted' })
    )
    expect(trustedContextStore.attach).not.toHaveBeenCalledWith(
      rpcData,
      expect.objectContaining({ subject: 'body-operator', tenantId: 'body-tenant' })
    )
  })

  it.each([
    ['missing declaration', []],
    [
      'duplicate declaration',
      [
        { mode: 'SELF_SERVICE', allowDelegated: true },
        { mode: 'INTERNAL', permissions: { all: ['asset.internal.avatar.resolve_public_url'] } }
      ]
    ]
  ])('rejects %s before token verification', async (_label, declarations) => {
    const verifier = { verify: jest.fn() }
    const { context } = contextFixture()

    await expect(
      new TrustedExecutionGuard(
        { getAll: jest.fn(() => declarations) },
        verifier,
        { getVerifiedWorkloadIdentity: jest.fn() },
        { attach: jest.fn() },
        'urn:oes:service:asset-service'
      ).canActivate(context)
    ).rejects.toThrow('Access denied')
    expect(verifier.verify).not.toHaveBeenCalled()
  })

  it('rejects missing bearer authority without invoking workload verification', async () => {
    const workloadIdentityProvider = { getVerifiedWorkloadIdentity: jest.fn() }
    const { context } = contextFixture({ includeToken: false })

    await expect(
      new TrustedExecutionGuard(
        { getAll: jest.fn(() => [{ mode: 'SELF_SERVICE', allowDelegated: true }]) },
        { verify: jest.fn() },
        workloadIdentityProvider,
        { attach: jest.fn() },
        'urn:oes:service:asset-service'
      ).canActivate(context)
    ).rejects.toThrow('Access denied')
    expect(workloadIdentityProvider.getVerifiedWorkloadIdentity).not.toHaveBeenCalled()
  })
})
