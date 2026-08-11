import { attachVerifiedExecution } from '@oes/common/authorization'
import { FinanceRpcContextValidator } from '../../src/interfaces/grpc/finance-rpc-context.validator'

/** Attaches only the facts a successful TrustedExecutionGuard exposes to Finance handlers. */
function trustedRequest(overrides: Record<string, unknown> = {}) {
  const request: Record<string, unknown> = {
    tenantId: 'forged-tenant',
    orgId: 'forged-org',
    operatorContext: { operatorId: 'forged-operator' },
    traceContext: { traceId: 'forged-trace', requestId: 'forged-request' },
    auditContext: { auditId: 'forged-audit', reason: 'forged', source: 'forged' },
    ...overrides
  }
  const context = attachVerifiedExecution(request, {
    verifiedExecutionToken: {
      issuer: 'https://auth.example.test',
      audience: 'urn:oes:service:finance-service',
      subject: 'account-1',
      principalType: 'HUMAN',
      clientId: 'spiffe://oes/gateway',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      permissionCodes: ['finance.financial_account.create'],
      tokenId: 'token-1',
      issuedAt: 1,
      notBefore: 1,
      expiresAt: 2,
      certificateThumbprint: 'A'.repeat(43),
      sessionId: 'session-1',
      sessionTerminal: 'WEB'
    },
    verifiedWorkloadIdentity: {
      spiffeId: 'spiffe://oes/gateway',
      certificateThumbprint: 'A'.repeat(43)
    }
  }) as { requestId?: string; traceId?: string }
  context.requestId = 'request-1'
  context.traceId = 'trace-1'
  return request
}

/** Verifies Finance uses only guard-attached execution facts after the token-only cutover. */
describe('finance-service trusted gRPC context L3', () => {
  it('derives query tenant, organization, operator, and correlation from verified execution instead of body fields', () => {
    expect(FinanceRpcContextValidator.assertQueryContext(trustedRequest())).toEqual({
      tenantId: 'tenant-1',
      orgId: 'org-1',
      operatorContext: { operatorId: 'account-1', operatorType: 'HUMAN', orgId: 'org-1' },
      traceContext: { requestId: 'request-1', traceId: 'trace-1' }
    })
  })

  it('derives method-owned audit data without accepting request audit fields', () => {
    expect(
      FinanceRpcContextValidator.assertManagementContext(trustedRequest(), 'CreateFinancialAccount')
    ).toMatchObject({
      auditContext: {
        auditId: 'request-1',
        reason: 'CreateFinancialAccount',
        source: 'trusted-execution'
      }
    })
  })

  it('fails closed when a controller is reached without guard-attached execution context', () => {
    expect(() => FinanceRpcContextValidator.assertQueryContext({ tenantId: 'tenant-1' })).toThrow(
      'Trusted execution context is required'
    )
  })

  it('fails closed when the verified token has no tenant claim', () => {
    const request = trustedRequest()
    const context = (request as Record<string, any>).__oesOperatorContext
    context.verifiedExecutionToken.tenantId = undefined
    expect(() => FinanceRpcContextValidator.assertQueryContext(request)).toThrow(
      'Finance request is invalid'
    )
  })
})
