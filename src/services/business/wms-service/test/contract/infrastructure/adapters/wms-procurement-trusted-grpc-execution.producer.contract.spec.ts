import { Metadata } from '@grpc/grpc-js'
import {
  inboundExecutionTokenCredentialScope,
  PROCUREMENT_INTERNAL_PERMISSION_CODES
} from '@oes/common/authorization'
import { WmsProcurementTrustedGrpcExecutionProducer } from '../../../../src/infrastructure/adapters/wms-procurement-trusted-grpc-execution.producer'

/** Verifies prepared WMS Procurement OBO fails before exchange without verified inbound HUMAN proof. */
describe('WMS Procurement producer', () => {
  it('preserves the verified HUMAN subject and tenant for the exact receipt-resolution Code', async () => {
    const producer = new WmsProcurementTrustedGrpcExecutionProducer({} as never)
    let current: Record<string, unknown> | undefined
    const caller = {
      forInternalCall: jest.fn(async (_code, callback) => {
        current = (producer as any).context.requireCurrent()
        return callback(new Metadata())
      })
    }
    jest.spyOn(producer as any, 'getCaller').mockReturnValue(caller)
    const request = {}
    inboundExecutionTokenCredentialScope.prepare(request, 'opaque-current-hop-token', humanToken())
    await inboundExecutionTokenCredentialScope.runPrepared(request, () =>
      producer.createMetadata(
        PROCUREMENT_INTERNAL_PERMISSION_CODES.RESOLVE_RECEIVING_EXPECTATION_FOR_RECEIPT,
        'tenant-1',
        'request-1',
        '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'
      )
    )
    expect(current).toMatchObject({
      subject: 'human-1',
      principalType: 'HUMAN',
      tenantId: 'tenant-1',
      sessionId: 'session-1',
      sessionTerminal: 'WEB'
    })
    expect(caller.forInternalCall).toHaveBeenCalledWith(
      PROCUREMENT_INTERNAL_PERMISSION_CODES.RESOLVE_RECEIVING_EXPECTATION_FOR_RECEIPT,
      expect.any(Function)
    )
  })

  it('fails closed before exchange when no WMS trusted inbound scope exists', async () => {
    await expect(
      new WmsProcurementTrustedGrpcExecutionProducer({} as never).createMetadata(
        PROCUREMENT_INTERNAL_PERMISSION_CODES.RESOLVE_RECEIVING_EXPECTATION_FOR_RECEIPT,
        'tenant-1',
        'request-1',
        '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'
      )
    ).rejects.toThrow('PROCUREMENT_CALLER_EXECUTION_CONTEXT_REQUIRED')
  })
})

/** Builds one verified current-hop HUMAN token for OBO scope tests. */
function humanToken() {
  return {
    subject: 'human-1',
    principalType: 'HUMAN',
    clientId: 'spiffe://oes/api-gateway',
    tenantId: 'tenant-1',
    orgId: 'org-1',
    permissionCodes: ['wms.receipt.manage'],
    tokenId: 'token-1',
    issuedAt: 1,
    notBefore: 1,
    expiresAt: 9999999999,
    certificateThumbprint: 'A'.repeat(43),
    issuer: 'https://auth.example',
    audience: 'urn:oes:service:wms-service',
    sessionId: 'session-1',
    sessionTerminal: 'WEB'
  } as never
}
