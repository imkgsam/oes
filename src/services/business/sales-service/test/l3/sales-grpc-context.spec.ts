import { attachVerifiedExecution } from '@oes/common/authorization'
import { SalesRpcContextValidator } from '../../src/interfaces/grpc/sales-rpc-context.validator'

/** Attaches only the facts exposed by TrustedExecutionGuard to Sales handlers. */
function trustedRequest(overrides: Record<string, unknown> = {}) {
  const request = { tenantId: 'forged-tenant', operatorContext: { operatorId: 'forged' }, ...overrides }
  const context = attachVerifiedExecution(request, {
    verifiedExecutionToken: {
      issuer: 'https://auth.example.test', audience: 'urn:oes:service:sales-service', subject: 'operator-1', principalType: 'HUMAN', clientId: 'spiffe://oes/gateway', tenantId: 'tenant-1', orgId: 'org-1', permissionCodes: ['sales.quote.create'], tokenId: 'token-1', issuedAt: 1, notBefore: 1, expiresAt: 2, certificateThumbprint: 'A'.repeat(43), sessionId: 'session-1', sessionTerminal: 'WEB'
    },
    verifiedWorkloadIdentity: { spiffeId: 'spiffe://oes/gateway', certificateThumbprint: 'A'.repeat(43) }
  }) as { requestId?: string; traceId?: string }
  context.requestId = 'request-1'; context.traceId = 'trace-1'; return request
}

/** Verifies Sales derives tenant, operator, trace, and audit authority from trusted ET claims. */
describe('sales-service trusted gRPC context L3', () => {
  it('ignores forged body identity and derives query context from verified execution', () => {
    expect(SalesRpcContextValidator.assertQueryContext(trustedRequest())).toEqual({
      tenantId: 'tenant-1', orgId: 'org-1',
      operatorContext: { operatorId: 'operator-1', operatorType: 'HUMAN', orgId: 'org-1' },
      traceContext: { requestId: 'request-1', traceId: 'trace-1' }
    })
  })

  it('derives trusted audit identity while retaining only a bounded business reason', () => {
    expect(SalesRpcContextValidator.assertManagementContext(trustedRequest({ reason: ' customer requested update ' }), 'CreateQuote')).toMatchObject({
      auditContext: { auditId: 'request-1', reason: 'customer requested update', source: 'trusted-execution' }
    })
  })

  it('fails closed without guard-attached execution context', () => {
    expect(() => SalesRpcContextValidator.assertQueryContext({ tenantId: 'tenant-1' })).toThrow('Trusted execution context is required')
  })
})
