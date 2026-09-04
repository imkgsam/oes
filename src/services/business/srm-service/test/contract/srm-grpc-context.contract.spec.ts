import { attachVerifiedExecution } from '@oes/common/authorization'
import {
  SupplierRpcContextValidator,
  trustedTenantId
} from '../../src/interfaces/grpc/supplier-rpc-context.validator'

/** Builds one RPC execution context around an exact request object. */
function rpcContext(data: object) {
  return {
    switchToRpc: () => ({ getData: () => data })
  } as never
}

/** Attaches the same frozen verified HUMAN facts that the token guard supplies in production. */
function attachHuman(data: object, overrides: Record<string, unknown> = {}) {
  attachVerifiedExecution(data, {
    verifiedExecutionToken: {
      issuer: 'https://auth.example',
      audience: 'urn:oes:service:srm-service',
      subject: 'human-1',
      principalType: 'HUMAN',
      clientId: 'spiffe://oes/api-gateway',
      tenantId: 'tenant-1',
      permissionCodes: ['srm.supplier_profile.list'],
      tokenId: 'token-1',
      issuedAt: 1,
      notBefore: 1,
      expiresAt: 9999999999,
      certificateThumbprint: 'A'.repeat(43),
      sessionId: 'session-1',
      sessionTerminal: 'WEB',
      ...overrides
    },
    verifiedWorkloadIdentity: {
      spiffeId: 'spiffe://oes/api-gateway',
      certificateThumbprint: 'A'.repeat(43)
    }
  } as never)
}

/** Verifies SRM request context is claims-derived and rejects every retired body authority shape. */
describe('SRM verified RPC context Contract', () => {
  it('derives the exact tenant from verified HUMAN execution', () => {
    const data = { keyword: 'supplier' }
    attachHuman(data)
    expect(new SupplierRpcContextValidator().canActivate(rpcContext(data))).toBe(true)
    expect(trustedTenantId(data)).toBe('tenant-1')
  })

  it.each([
    ['tenantId', 'attacker-tenant'],
    ['tenant_id', 'attacker-tenant'],
    ['operatorContext', {}],
    ['operator_context', {}],
    ['traceContext', {}],
    ['trace_context', {}],
    ['auditContext', {}],
    ['audit_context', {}]
  ])('rejects retired body authority %s before it can be overwritten', (field, value) => {
    const data = { [field]: value }
    attachHuman(data)
    expect(() => new SupplierRpcContextValidator().canActivate(rpcContext(data))).toThrow()
  })

  it.each([
    ['MACHINE root', { principalType: 'MACHINE', sessionId: undefined }],
    ['DELEGATED subject', { principalType: 'DELEGATED' }],
    ['missing tenant', { tenantId: undefined }],
    ['SYSTEM tenant', { tenantId: 'SYSTEM' }],
    ['wildcard tenant', { tenantId: '*' }]
  ])('rejects %s as SRM tenant authority', (_label, overrides) => {
    const data = {}
    attachHuman(data, overrides)
    expect(() => new SupplierRpcContextValidator().canActivate(rpcContext(data))).toThrow()
  })
})
