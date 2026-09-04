import { status } from '@grpc/grpc-js'
import {
  attachVerifiedExecution,
  getAuthenticatedGrpcRequestContext
} from '@oes/common/authorization'
import { ProcurementRpcContextValidator } from '../../src/interfaces/grpc/procurement-rpc-context.validator'

/** Verifies Procurement context derives only from guard-established ET/mTLS facts. */
describe('procurement-service grpc context validation Contract', () => {
  it('derives tenant, org, operator, trace, and audit without mutating business payload', () => {
    const request = trustedRequest({ purchaseRequestId: 'pr-1' })

    expect(ProcurementRpcContextValidator.assertManagementContext(request)).toEqual({
      tenantId: 'tenant-1',
      operatorContext: {
        operatorId: 'operator-1',
        operatorType: 'HUMAN',
        orgId: 'org-1'
      },
      traceContext: { traceId: 'trace-1', requestId: 'request-1' },
      auditContext: {
        auditId: 'token-1',
        reason: 'verified procurement command',
        source: 'spiffe://oes/api-gateway'
      }
    })
    expect(request).toMatchObject({ purchaseRequestId: 'pr-1' })
    expect(request).not.toHaveProperty('tenantId')
  })

  it.each([
    ['tenantId', 'attacker'],
    ['tenant_id', 'attacker'],
    ['orgId', 'attacker'],
    ['org_id', 'attacker'],
    ['operatorContext', {}],
    ['operator_context', {}],
    ['traceContext', {}],
    ['trace_context', {}],
    ['auditContext', {}],
    ['audit_context', {}]
  ])('rejects retired body authority %s', (field, value) => {
    expect(() =>
      ProcurementRpcContextValidator.assertQueryContext(trustedRequest({ [field]: value }))
    ).toThrow()
  })

  it.each([
    ['missing verified execution', {}],
    ['MACHINE principal', trustedRequest({}, { principalType: 'MACHINE' })],
    ['wildcard tenant', trustedRequest({}, { tenantId: '*' })],
    ['SYSTEM tenant', trustedRequest({}, { tenantId: 'SYSTEM' })],
    ['missing subject', trustedRequest({}, { subject: '' })],
    ['missing request id', trustedRequest({}, {}, { requestId: '' })],
    ['missing trace id', trustedRequest({}, {}, { traceId: '' })]
  ])('rejects %s as UNAUTHENTICATED', (_label, request) => {
    try {
      ProcurementRpcContextValidator.assertQueryContext(request)
      throw new Error('expected trusted context rejection')
    } catch (error) {
      expect(error).toMatchObject({ definition: { rpcStatus: status.UNAUTHENTICATED } })
    }
  })
})

/** Attaches the same private verified context shape produced by the Common token guard. */
function trustedRequest(
  body: Record<string, unknown>,
  tokenOverrides: Record<string, unknown> = {},
  transportOverrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const request = { ...body }
  attachVerifiedExecution(request, {
    verifiedExecutionToken: {
      issuer: 'https://auth.example',
      audience: 'urn:oes:service:procurement-service',
      subject: 'operator-1',
      principalType: 'HUMAN',
      clientId: 'spiffe://oes/api-gateway',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      permissionCodes: [],
      tokenId: 'token-1',
      issuedAt: 1,
      notBefore: 1,
      expiresAt: 9999999999,
      certificateThumbprint: 'A'.repeat(43),
      sessionId: 'session-1',
      sessionTerminal: 'WEB',
      ...tokenOverrides
    } as never,
    verifiedWorkloadIdentity: {
      spiffeId: 'spiffe://oes/api-gateway',
      certificateThumbprint: 'A'.repeat(43)
    }
  })
  Object.assign(getAuthenticatedGrpcRequestContext(request) as object, {
    requestId: 'request-1',
    traceId: 'trace-1',
    ...transportOverrides
  })
  return request
}
