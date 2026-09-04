import { ExecutionTokenGrpcController } from '../../../../src/interfaces/grpc/execution-token.grpc.controller'

/** Proves the generated STS RPC maps only proto target fields while trusted context remains outside the request body. */
describe('ExecutionTokenGrpcController', () => {
  it('obtains workload and execution facts solely through the trusted context port', async () => {
    const exchange = { exchange: jest.fn().mockResolvedValue({ accessToken: 'signed', tokenType: 'Bearer', expiresAtUnixSeconds: 300, expiresInSeconds: 300, kid: 'key', grantedPermissionCodes: ['AUTH.READ'], grantedAudience: 'urn:oes:service:permission-service' }) }
    const context = { resolve: jest.fn().mockResolvedValue({ workloadIdentity: { spiffeId: 'spiffe://local.oes/gateway', certificateThumbprint: 'A'.repeat(43) }, execution: { subject: 'account', principalType: 'HUMAN', tenantId: 'tenant', permissionCodes: ['AUTH.READ'] } }) }
    const controller = new ExecutionTokenGrpcController(exchange as any, { jwks: jest.fn() } as any, context)
    await expect(controller.exchangeExecutionToken({ targetAudience: 'urn:oes:service:permission-service', requestedPermissionCodes: ['AUTH.READ'] }, undefined, { peer: 'verified-only' })).resolves.toMatchObject({ accessToken: 'signed', grantedAudience: 'urn:oes:service:permission-service' })
    expect(context.resolve).toHaveBeenCalledWith({ peer: 'verified-only' }, { targetAudience: 'urn:oes:service:permission-service', requestedPermissionCodes: ['AUTH.READ'] })
    expect(exchange.exchange).toHaveBeenCalledWith(expect.objectContaining({ workloadIdentity: expect.any(Object), execution: expect.any(Object) }))
  })
})
