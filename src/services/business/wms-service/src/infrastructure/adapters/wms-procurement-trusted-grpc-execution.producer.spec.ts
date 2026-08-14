import { PROCUREMENT_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { WmsProcurementTrustedGrpcExecutionProducer } from './wms-procurement-trusted-grpc-execution.producer'

/** Verifies prepared WMS Procurement OBO fails before exchange without verified inbound HUMAN proof. */
describe('WMS Procurement producer', () => {
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
