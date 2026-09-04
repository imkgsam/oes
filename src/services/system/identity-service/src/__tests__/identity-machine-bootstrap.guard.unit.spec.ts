import { Metadata } from '@grpc/grpc-js'
import { ForbiddenException } from '@nestjs/common'
import { IdentityFoundationTrustedExecutionGuard } from '../modules/identity-trusted-execution.module'

function context(metadata = new Metadata()) {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    getArgByIndex: () => ({ call: true }),
    switchToRpc: () => ({ getContext: () => metadata, getData: () => ({}) })
  } as any
}

describe('Identity machine bootstrap admission', () => {
  const reflector = { getAllAndOverride: jest.fn(() => true) }
  const identity = { getVerifiedWorkloadIdentity: jest.fn() }
  const guard = new IdentityFoundationTrustedExecutionGuard(reflector as any, {} as any, identity as any)

  beforeEach(() => jest.clearAllMocks())

  it('admits only the exact verified Auth workload without Authorization metadata', async () => {
    identity.getVerifiedWorkloadIdentity.mockResolvedValue({ spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/auth-service' })
    await expect(guard.canActivate(context())).resolves.toBe(true)
  })

  it('rejects bearer metadata and any other verified workload', async () => {
    const bearer = new Metadata()
    bearer.set('authorization', 'Bearer opaque')
    await expect(guard.canActivate(context(bearer))).rejects.toBeInstanceOf(ForbiddenException)
    expect(identity.getVerifiedWorkloadIdentity).not.toHaveBeenCalled()

    identity.getVerifiedWorkloadIdentity.mockResolvedValue({ spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway' })
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(ForbiddenException)
  })
})
