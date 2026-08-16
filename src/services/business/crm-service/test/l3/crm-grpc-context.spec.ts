import { status } from '@grpc/grpc-js'
import { attachVerifiedExecution } from '@oes/common/authorization'
import { CustomerRpcContextValidator } from '../../src/interfaces/grpc/customer-rpc-context.validator'

/** Proves CRM derives application context only from private verified execution facts. */
describe('crm-service trusted grpc context validation L3', () => {
  it('derives tenant/operator/trace/audit from guard-attached facts', () => {
    const request = trustedRequest({ displayName: 'Acme CRM' })

    expect(CustomerRpcContextValidator.assertManagementContext(request)).toMatchObject({
      tenantId: 'tenant-1',
      operatorContext: { operatorId: 'operator-1', orgId: 'org-1' },
      traceContext: { traceId: 'trace-1', requestId: 'request-1' },
      auditContext: { auditId: 'token-1', reason: 'verified CRM command' }
    })
  })

  it('fails closed when private verified proof is missing', () => {
    expect(() => CustomerRpcContextValidator.assertQueryContext({})).toThrow(
      expect.objectContaining({
        definition: expect.objectContaining({ rpcStatus: status.UNAUTHENTICATED })
      })
    )
  })

  it.each([
    ['tenantId', 'attacker'],
    ['tenant_id', 'attacker'],
    ['operatorContext', {}],
    ['traceContext', {}],
    ['auditContext', {}],
    ['claimForCurrentUser', true],
    ['allowOwnerlessConversion', true]
  ])('rejects retired %s authority even when verified proof exists', (field, value) => {
    const request = trustedRequest({ [field]: value })

    expect(() => CustomerRpcContextValidator.assertManagementContext(request)).toThrow(
      expect.objectContaining({
        definition: expect.objectContaining({ rpcStatus: status.UNAUTHENTICATED })
      })
    )
  })
})

/** Attaches the request-private context normally produced by CRM's trusted guard. */
function trustedRequest<T extends object>(request: T): T {
  const authenticated = attachVerifiedExecution(request, {
    verifiedExecutionToken: {
      subject: 'operator-1',
      principalType: 'HUMAN',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      permissionCodes: ['crm.account.create'],
      tokenId: 'token-1'
    } as never,
    verifiedWorkloadIdentity: {
      spiffeId: 'spiffe://oes/api-gateway',
      certificateThumbprint: 'A'.repeat(43)
    }
  })
  Object.assign(authenticated as object, { requestId: 'request-1', traceId: 'trace-1' })
  return request
}
