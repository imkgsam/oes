import {
  SupplierOfferingStatus as ProtoSupplierOfferingStatus,
  SupplierStatus as ProtoSupplierStatus
} from '@oes/common/generated/srm_service'
import { SupplierManagementGrpcController } from '../../src/interfaces/grpc/supplier-management.grpc.controller'
import { SupplierQueryGrpcController } from '../../src/interfaces/grpc/supplier-query.grpc.controller'
import { SrmInternalQueryGrpcController } from '../../src/interfaces/grpc/srm-internal-query.grpc.controller'

/** Verifies SRM controllers consume only post-guard tenant context and preserve response mappings. */
describe('SRM gRPC surface Contract', () => {
  it('dispatches BUSINESS commands with the guard-derived tenant and audit wrapper', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: 'supplier-1',
      supplierNo: 'SUP-1',
      tenantId: 'tenant-1',
      displayName: 'Supplier',
      status: 'INACTIVE',
      tags: []
    })
    const recordCommand = jest.fn(async (_input, work) => work())
    const controller = new SupplierManagementGrpcController(
      { execute } as never,
      { recordCommand } as never
    )
    await expect(
      controller.createSupplierProfile({ tenantId: 'tenant-1', displayName: 'Supplier' } as never)
    ).resolves.toEqual({
      supplier: expect.objectContaining({ supplierId: 'supplier-1', tenantId: 'tenant-1' })
    })
    expect(execute.mock.calls[0][0]).toMatchObject({ tenantId: 'tenant-1' })
    expect(recordCommand).toHaveBeenCalledTimes(1)
  })

  it('dispatches BUSINESS queries with the guard-derived tenant', async () => {
    const execute = jest.fn().mockResolvedValue({ suppliers: [], total: 0, page: 1, pageSize: 20 })
    const controller = new SupplierQueryGrpcController({ execute } as never)
    await expect(
      controller.searchSuppliers({
        tenantId: 'tenant-1',
        status: ProtoSupplierStatus.SUPPLIER_STATUS_ACTIVE
      } as never)
    ).resolves.toEqual({ suppliers: [], total: 0, page: 1, pageSize: 20 })
    expect(execute.mock.calls[0][0]).toMatchObject({
      input: { tenantId: 'tenant-1', status: 'ACTIVE' }
    })
  })

  it('returns only the two narrow active INTERNAL projections', async () => {
    const execute = jest
      .fn()
      .mockResolvedValueOnce({ id: 'supplier-1', displayName: 'Supplier', status: 'ACTIVE' })
      .mockResolvedValueOnce({
        supplierOfferingId: 'offering-1',
        supplierId: 'supplier-1',
        itemId: 'item-1',
        status: 'ACTIVE'
      })
    const controller = new SrmInternalQueryGrpcController({ execute } as never)
    await expect(
      controller.resolveActiveSupplier({ tenantId: 'tenant-1', supplierId: 'supplier-1' } as never)
    ).resolves.toEqual({
      supplierId: 'supplier-1',
      displayName: 'Supplier',
      status: ProtoSupplierStatus.SUPPLIER_STATUS_ACTIVE
    })
    await expect(
      controller.resolveActiveSupplierOffering({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        itemId: 'item-1'
      } as never)
    ).resolves.toEqual({
      supplierOfferingId: 'offering-1',
      supplierId: 'supplier-1',
      itemId: 'item-1',
      status: ProtoSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE
    })
  })

  it('does not expose SupplierItemMapping or commercial term methods', () => {
    const surface = [
      SupplierQueryGrpcController,
      SupplierManagementGrpcController,
      SrmInternalQueryGrpcController
    ]
      .flatMap((controller) => Object.getOwnPropertyNames(controller.prototype))
      .join(' ')
    expect(surface).not.toMatch(/SupplierItemMapping|supplierItemMapping|price|moq|leadTime|terms/u)
  })
})
