import { of } from 'rxjs'
import { SupplierOfferingStatus, SupplierStatus } from '@oes/common/generated/srm_service'
import { SupplierQueryGrpcAdapter } from '../../src/infrastructure/adapters/supplier-query.grpc.adapter'

/** createAdapter builds one SupplierQueryGrpcAdapter with mocked gRPC dependencies so enum normalization can be verified in isolation. */
function createAdapter(queryService: {
  getSupplier: jest.Mock
  listSupplierOfferingsBySupplier: jest.Mock
}) {
  const client = {
    getService: jest.fn().mockReturnValue(queryService)
  }
  const metadataFactory = {
    createInternalCallMetadata: jest.fn().mockReturnValue(undefined),
    createOperatorScopedMetadata: jest.fn().mockReturnValue(undefined)
  }
  const requestContextStore = {
    getContext: jest.fn().mockReturnValue(undefined)
  }

  const adapter = new SupplierQueryGrpcAdapter(
    client as never,
    metadataFactory as never,
    requestContextStore as never
  )
  adapter.onModuleInit()

  return adapter
}

describe('SupplierQueryGrpcAdapter L3', () => {
  it('getSupplierById / should normalize generated ACTIVE enum values into procurement ACTIVE supplier snapshots', async () => {
    const adapter = createAdapter({
      getSupplier: jest.fn().mockReturnValue(
        of({
          supplier: {
            supplierId: 'supplier-1',
            displayName: 'Acme Supplier',
            status: SupplierStatus.SUPPLIER_STATUS_ACTIVE
          }
        })
      ),
      listSupplierOfferingsBySupplier: jest.fn()
    })

    const supplier = await adapter.getSupplierById('tenant-1', 'supplier-1')

    expect(supplier).toEqual({
      supplierId: 'supplier-1',
      supplierDisplayName: 'Acme Supplier',
      status: 'ACTIVE'
    })
  })

  it('getActiveSupplierOffering / should normalize generated ACTIVE offering enums into procurement offering snapshots', async () => {
    const adapter = createAdapter({
      getSupplier: jest.fn(),
      listSupplierOfferingsBySupplier: jest.fn().mockReturnValue(
        of({
          offerings: [
            {
              supplierOfferingId: 'offering-1',
              supplierId: 'supplier-1',
              itemId: 'item-1',
              status: SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE
            }
          ]
        })
      )
    })

    const offering = await adapter.getActiveSupplierOffering('tenant-1', 'supplier-1', 'item-1')

    expect(offering).toEqual({
      supplierOfferingId: 'offering-1',
      supplierId: 'supplier-1',
      itemId: 'item-1',
      status: 'ACTIVE'
    })
  })
})
