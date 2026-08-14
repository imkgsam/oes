import {
  ProcurementReceivingExpectationGrpcAdapter,
  WMS_PROCUREMENT_PREPARED_NOT_ACTIVATED
} from '../../src/infrastructure/adapters/procurement-receiving-expectation.grpc.adapter'

/** Proves WMS no longer reuses Gateway BUSINESS lookup or any legacy authority fallback. */
describe('WMS Procurement receiving expectation adapter L3', () => {
  it('fails closed while WMS trusted inbound remains pending', async () => {
    await expect(
      new ProcurementReceivingExpectationGrpcAdapter().getReceivingExpectationById(
        'tenant-1',
        'expectation-1'
      )
    ).rejects.toThrow(WMS_PROCUREMENT_PREPARED_NOT_ACTIVATED)
  })
})
