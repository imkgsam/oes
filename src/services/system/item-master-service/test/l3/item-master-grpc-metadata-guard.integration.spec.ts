import { ExecutionContext } from '@nestjs/common'
import { attachVerifiedExecution } from '@oes/common/authorization'
import { ItemMasterRpcContextGuard } from '../../src/interfaces/grpc/item-master-rpc-context.guard'

/** Verifies Item Master derives tenant authority only from an already verified ExecutionToken. */
describe('Item Master verified execution tenant context L3', () => {
  const guard = new ItemMasterRpcContextGuard()

  it('overwrites any caller body tenant with the verified ExecutionToken tenant', () => {
    const data = { tenantId: 'forged-body-tenant', itemId: 'item-1' }
    attach(data, 'tenant-verified')

    expect(guard.canActivate(context(data))).toBe(true)
    expect(data.tenantId).toBe('tenant-verified')
  })

  it('fails closed when verified execution or its tenant is absent', () => {
    expect(() => guard.canActivate(context({ itemId: 'item-1' }))).toThrow()
    const data = { itemId: 'item-1' }
    attach(data, undefined)
    expect(() => guard.canActivate(context(data))).toThrow()
  })
})

/** Attaches the same immutable verifier output consumed by the runtime guard chain. */
function attach(data: object, tenantId: string | undefined): void {
  attachVerifiedExecution(data, {
    verifiedExecutionToken: {
      issuer: 'https://auth.example',
      audience: 'urn:oes:service:item-master-service',
      subject: 'subject-1',
      principalType: 'HUMAN',
      clientId: 'spiffe://oes/api-gateway',
      tenantId,
      permissionCodes: ['item_master.item.list'],
      tokenId: 'token-1',
      issuedAt: 1,
      notBefore: 1,
      expiresAt: 2,
      certificateThumbprint: 'A'.repeat(43),
      sessionId: 'session-1',
      sessionTerminal: 'WEB'
    },
    verifiedWorkloadIdentity: {
      spiffeId: 'spiffe://oes/api-gateway',
      certificateThumbprint: 'A'.repeat(43)
    }
  })
}

/** Builds the minimal RPC execution context required by the tenant mapping guard. */
function context(data: object): ExecutionContext {
  return { switchToRpc: () => ({ getData: () => data }) } as ExecutionContext
}
