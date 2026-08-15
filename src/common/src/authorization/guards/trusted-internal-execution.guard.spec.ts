const { Metadata } = require('@grpc/grpc-js')
const { TrustedInternalExecutionGuard } = require('./trusted-internal-execution.guard')

describe('TrustedInternalExecutionGuard', () => {
  const verifier = {
    verify: jest.fn().mockResolvedValue({
      issuer: 'https://auth.local.oes.example',
      audience: 'urn:oes:service:auth-service',
      subject: 'api-gateway',
      principalType: 'MACHINE',
      clientId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
      tenantId: 'SYSTEM',
      permissionCodes: ['auth.internal.external_api_key.exchange'],
      tokenId: 'token-1',
      issuedAt: 1,
      notBefore: 1,
      expiresAt: 2,
      certificateThumbprint: 'A'.repeat(43)
    })
  }
  const workloadIdentityProvider = {
    getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue({
      spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
      certificateThumbprint: 'A'.repeat(43)
    })
  }

  it('verifies the bearer token and attaches only verified execution facts', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValueOnce({
        mode: 'INTERNAL',
        permissions: { all: ['auth.internal.external_api_key.exchange'] }
      })
    }
    const metadata = new Metadata()
    metadata.set('authorization', 'Bearer a.b.c')
    metadata.set('x-request-id', 'request-1')
    metadata.set('traceparent', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01')
    const rpcData = {}
    const call = { getAuthContext: jest.fn() }
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgByIndex: jest.fn((index: number) => (index === 2 ? call : undefined)),
      switchToRpc: jest.fn(() => ({
        getData: () => rpcData,
        getContext: () => metadata
      }))
    }

    await expect(
      new TrustedInternalExecutionGuard(
        reflector,
        verifier,
        workloadIdentityProvider,
        'urn:oes:service:auth-service'
      ).canActivate(context)
    ).resolves.toBe(true)

    expect(verifier.verify).toHaveBeenCalledWith({
      token: 'a.b.c',
      targetAudience: 'urn:oes:service:auth-service',
      workloadIdentity: {
        spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
        certificateThumbprint: 'A'.repeat(43)
      }
    })
    expect(rpcData).toMatchObject({
      __oesOperatorContext: {
        verifiedExecutionToken: expect.objectContaining({
          subject: 'api-gateway'
        }),
        verifiedWorkloadIdentity: {
          spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
          certificateThumbprint: 'A'.repeat(43)
        }
      }
    })
  })

  it('fails closed when the token is missing', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValueOnce({
        mode: 'INTERNAL',
        permissions: { all: ['auth.internal.external_api_key.exchange'] }
      })
    }
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(() => ({
        getData: () => ({}),
        getContext: () => new Metadata()
      }))
    }

    await expect(
      new TrustedInternalExecutionGuard(
        reflector,
        verifier,
        workloadIdentityProvider,
        'urn:oes:service:auth-service'
      ).canActivate(context)
    ).rejects.toThrow('Access denied')
  })
})
