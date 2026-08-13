import { attachVerifiedExecution } from '@oes/common/authorization'
import { SalesManagementGrpcController } from '../../src/interfaces/grpc/sales-management.grpc.controller'
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

  it.each([
    '["secret"]',
    '{"reason":"update"}',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature',
    'Bearer opaque-value',
    'api-key: opaque-value',
    'secret=opaque-value',
    'access_token=opaque-value',
    'refresh_token=opaque-value',
    'client_secret=opaque-value',
    'password=hunter2',
    '-----BEGIN PRIVATE KEY-----',
    'sk_live_51OpaqueSecretMaterial',
    'AKIAIOSFODNN7EXAMPLE',
    'person@example.com',
    '+86 138 0013 8000'
  ])('rejects restricted business reason material before it can become audit data', (reason) => {
    expect(() =>
      SalesRpcContextValidator.assertManagementContext(trustedRequest({ reason }), 'CreateQuote')
    ).toThrow('reason contains restricted material')
  })

  it('accepts a bounded ordinary business reason with Chinese and English punctuation', () => {
    expect(
      SalesRpcContextValidator.assertManagementContext(
        trustedRequest({ reason: '客户确认：调整交期，please publish the revised quote.' }),
        'PublishQuote'
      )
    ).toMatchObject({ auditContext: { reason: '客户确认：调整交期，please publish the revised quote.' } })
  })

  it('accepts ordinary identifiers without treating them as secret material', () => {
    expect(
      SalesRpcContextValidator.assertManagementContext(
        trustedRequest({ reason: 'order_id=SO-2026-08; accessibility review complete' }),
        'PublishQuote'
      )
    ).toMatchObject({ auditContext: { reason: 'order_id=SO-2026-08; accessibility review complete' } })
  })

  it('rejects a restricted reason before audit writing or command execution', async () => {
    const auditService = { recordCommand: jest.fn() }
    const commandBus = { execute: jest.fn() }
    const controller = new SalesManagementGrpcController(commandBus as never, auditService as never)

    await expect(
      controller.createQuote(
        trustedRequest({ reason: 'person@example.com', customerTenantPartyId: 'party-1', draftLines: [] }) as never
      )
    ).rejects.toThrow('reason contains restricted material')
    expect(auditService.recordCommand).not.toHaveBeenCalled()
    expect(commandBus.execute).not.toHaveBeenCalled()
  })

  it('fails closed without guard-attached execution context', () => {
    expect(() => SalesRpcContextValidator.assertQueryContext({ tenantId: 'tenant-1' })).toThrow('Trusted execution context is required')
  })
})
