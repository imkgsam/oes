import { Metadata } from '@grpc/grpc-js'
import {
  inboundExecutionTokenCredentialScope,
  ITEM_MASTER_INTERNAL_PERMISSION_CODES
} from '@oes/common/authorization'
import { WmsItemMasterTrustedGrpcExecutionProducer } from './wms-item-master-trusted-grpc-execution.producer'

/** Verifies WMS's target-profile producer maps missing deployment roots to the Item Master error family. */
describe('WMS Item Master producer', () => {
  it('preserves the verified HUMAN subject and tenant for the exact internal Code', async () => {
    const producer = new WmsItemMasterTrustedGrpcExecutionProducer({} as never)
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
        ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_STOCKABLE_ITEM,
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
      ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_STOCKABLE_ITEM,
      expect.any(Function)
    )
  })

  it('fails closed before exchange when deployment trust is unavailable', async () => {
    const issuer = process.env.AUTH_EXECUTION_ISSUER
    delete process.env.AUTH_EXECUTION_ISSUER
    await expect(
      new WmsItemMasterTrustedGrpcExecutionProducer({} as never).createMetadata(
        ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_STOCKABLE_ITEM,
        'tenant-1',
        'request-1',
        '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'
      )
    ).rejects.toThrow('ITEM_MASTER_CALLER_EXECUTION_CONTEXT_REQUIRED')
    if (issuer === undefined) delete process.env.AUTH_EXECUTION_ISSUER
    else process.env.AUTH_EXECUTION_ISSUER = issuer
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
