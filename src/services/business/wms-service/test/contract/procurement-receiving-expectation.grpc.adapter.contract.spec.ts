import { Metadata } from '@grpc/grpc-js'
import { PROCUREMENT_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { of } from 'rxjs'
import { ProcurementReceivingExpectationGrpcAdapter } from '../../src/infrastructure/adapters/procurement-receiving-expectation.grpc.adapter'

/** Proves WMS uses only Procurement's narrow receipt projection with HUMAN_OBO metadata. */
describe('WMS Procurement receiving expectation adapter Contract', () => {
  it('calls only ResolveReceivingExpectationForReceipt with no body tenant', async () => {
    const rpc = jest.fn(() =>
      of({
        receivingExpectationId: 'expectation-1',
        purchaseOrderId: 'po-1',
        purchaseOrderLineId: 'pol-1',
        targetWarehouseId: 'wh-1',
        openQuantity: '4',
        status: 1
      })
    )
    const producer = { createMetadata: jest.fn(async () => new Metadata()) }
    const adapter = new ProcurementReceivingExpectationGrpcAdapter(
      { internalQuery: () => ({ resolveReceivingExpectationForReceipt: rpc }) } as never,
      producer as never,
      { getContext: () => ({ requestId: 'request-1', traceId: 'trace-1' }) } as never
    )
    adapter.onModuleInit()
    await expect(
      adapter.getReceivingExpectationById('tenant-1', 'expectation-1')
    ).resolves.toMatchObject({
      receivingExpectationId: 'expectation-1',
      purchaseOrderId: 'po-1',
      targetWarehouseId: 'wh-1'
    })
    expect(rpc).toHaveBeenCalledWith(
      { receivingExpectationId: 'expectation-1' },
      expect.any(Metadata)
    )
    expect(producer.createMetadata).toHaveBeenCalledWith(
      PROCUREMENT_INTERNAL_PERMISSION_CODES.RESOLVE_RECEIVING_EXPECTATION_FOR_RECEIPT,
      'tenant-1',
      'request-1',
      'trace-1'
    )
  })
})
