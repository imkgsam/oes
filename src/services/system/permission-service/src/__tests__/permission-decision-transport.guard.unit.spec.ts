import { Metadata } from '@grpc/grpc-js'
import { PERMISSION_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import {
  getPermissionDecisionCallerContext,
  PermissionDecisionTransportGuard
} from '../interfaces/guards/permission-decision-transport.guard'

describe('PermissionDecisionTransportGuard', () => {
  it('accepts the bootstrap method only from the exact transport-verified Auth workload', async () => {
    const request = {}
    const dependencies = guardDependencies({ mode: 'BOOTSTRAP' })
    const guard = createGuard(dependencies)

    await expect(guard.canActivate(rpcContext(request, new Metadata()) as never)).resolves.toBe(
      true
    )
    expect(dependencies.verifier.verify).not.toHaveBeenCalled()
    expect(getPermissionDecisionCallerContext(request)).toMatchObject({
      directWorkloadSpiffeId: 'spiffe://local.test/auth-service',
      certificateThumbprint: 'certificate-thumbprint'
    })
  })

  it('rejects bearer metadata on the mTLS-only bootstrap method', async () => {
    const request = {}
    const metadata = new Metadata()
    metadata.set('authorization', 'Bearer header.claims.signature')
    const dependencies = guardDependencies({ mode: 'BOOTSTRAP' })
    const guard = createGuard(dependencies)

    await expect(guard.canActivate(rpcContext(request, metadata) as never)).rejects.toThrow(
      'mTLS-only'
    )
  })

  it('requires an exact Permission-audience Token Code for protected principal resolution', async () => {
    const request = {}
    const metadata = new Metadata()
    metadata.set('authorization', 'Bearer header.claims.signature')
    metadata.set('x-request-id', 'request-1')
    metadata.set('traceparent', '00-11111111111111111111111111111111-2222222222222222-01')
    const dependencies = guardDependencies({
      mode: 'PROTECTED',
      permissionCode: PERMISSION_INTERNAL_PERMISSION_CODES.PRINCIPAL_AUTHORIZATION_RESOLVE
    })
    const guard = createGuard(dependencies)

    await expect(guard.canActivate(rpcContext(request, metadata) as never)).resolves.toBe(true)
    expect(getPermissionDecisionCallerContext(request)).toMatchObject({
      requestId: 'request-1',
      traceId: '11111111111111111111111111111111',
      verifiedExecutionToken: {
        subject: 'human-1',
        principalType: 'HUMAN',
        tenantId: 'tenant-1'
      }
    })
  })

  it('rejects a protected decision Token that contains any additional Code', async () => {
    const request = {}
    const metadata = new Metadata()
    metadata.set('authorization', 'Bearer header.claims.signature')
    const dependencies = guardDependencies({
      mode: 'PROTECTED',
      permissionCode: PERMISSION_INTERNAL_PERMISSION_CODES.PRINCIPAL_AUTHORIZATION_RESOLVE
    })
    dependencies.verifier.verify.mockResolvedValue({
      ...verifiedToken(),
      permissionCodes: [
        PERMISSION_INTERNAL_PERMISSION_CODES.PRINCIPAL_AUTHORIZATION_RESOLVE,
        'permission.internal.another.resolve'
      ]
    })
    const guard = createGuard(dependencies)

    await expect(guard.canActivate(rpcContext(request, metadata) as never)).rejects.toThrow(
      'exact Permission decision Code'
    )
  })
})

// Builds one guard with exact immutable Auth and Permission audience configuration.
function createGuard(dependencies: ReturnType<typeof guardDependencies>) {
  return new PermissionDecisionTransportGuard(
    dependencies.reflector as never,
    dependencies.verifier as never,
    dependencies.workloadIdentityProvider as never,
    'spiffe://local.test/auth-service',
    'urn:oes:service:permission-service'
  )
}

// Builds injectable transport dependencies for one declared decision trust mode.
function guardDependencies(declaration: unknown) {
  return {
    reflector: { getAllAndOverride: jest.fn().mockReturnValue(declaration) },
    verifier: { verify: jest.fn().mockResolvedValue(verifiedToken()) },
    workloadIdentityProvider: {
      getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue({
        spiffeId: 'spiffe://local.test/auth-service',
        certificateThumbprint: 'certificate-thumbprint'
      })
    }
  }
}

// Builds one verified Permission-audience ExecutionToken claim set without bearer plaintext.
function verifiedToken() {
  return {
    issuer: 'https://auth.local.test',
    audience: 'urn:oes:service:permission-service',
    subject: 'human-1',
    principalType: 'HUMAN' as const,
    clientId: 'spiffe://local.test/auth-service',
    tenantId: 'tenant-1',
    permissionCodes: [PERMISSION_INTERNAL_PERMISSION_CODES.PRINCIPAL_AUTHORIZATION_RESOLVE],
    tokenId: 'token-1',
    issuedAt: 1,
    notBefore: 1,
    expiresAt: 2,
    certificateThumbprint: 'certificate-thumbprint',
    sessionId: 'session-1',
    authzVersion: 'source-authz-v1'
  }
}

// Builds the minimal Nest RPC execution context consumed by the transport guard.
function rpcContext(request: object, metadata: Metadata) {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    getArgByIndex: (index: number) => (index === 2 ? { transportCall: true } : undefined),
    switchToRpc: () => ({
      getData: () => request,
      getContext: () => metadata
    })
  }
}
