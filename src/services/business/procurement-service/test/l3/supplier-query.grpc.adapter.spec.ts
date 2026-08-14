import {
  PROCUREMENT_SRM_PREPARED_NOT_ACTIVATED,
  SupplierQueryGrpcAdapter
} from '../../src/infrastructure/adapters/supplier-query.grpc.adapter'

describe('SupplierQueryGrpcAdapter L3', () => {
  it('rejects both legacy wide SRM lookup paths before transport', async () => {
    const adapter = new SupplierQueryGrpcAdapter()
    await expect(adapter.getSupplierById('tenant-1', 'supplier-1')).rejects.toThrow(
      PROCUREMENT_SRM_PREPARED_NOT_ACTIVATED
    )
    await expect(
      adapter.getActiveSupplierOffering('tenant-1', 'supplier-1', 'item-1')
    ).rejects.toThrow(PROCUREMENT_SRM_PREPARED_NOT_ACTIVATED)
  })
})
