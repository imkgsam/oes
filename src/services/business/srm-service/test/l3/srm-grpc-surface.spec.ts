import {
  CreateSupplierProfileRequest,
  ListSupplierOfferingsByItemRequest,
  SearchSuppliersRequest,
  SupplierOfferingStatus as ProtoSupplierOfferingStatus,
  SupplierStatus as ProtoSupplierStatus,
  UpsertSupplierOfferingRequest
} from '@oes/common/generated/srm_service'
import { SupplierManagementGrpcController } from '../../src/interfaces/grpc/supplier-management.grpc.controller'
import { SupplierQueryGrpcController } from '../../src/interfaces/grpc/supplier-query.grpc.controller'

/** buildQueryContext creates the explicit tenant/operator/trace shape frozen by the query contract. */
function buildQueryContext(): Pick<SearchSuppliersRequest, 'tenantId' | 'operatorContext' | 'traceContext'> {
  return {
    tenantId: 'tenant-1',
    operatorContext: {
      operatorId: 'operator-1',
      operatorType: 'HUMAN',
      orgId: 'org-1'
    },
    traceContext: {
      traceId: 'trace-1',
      requestId: 'request-1'
    }
  }
}

/** buildManagementContext creates the explicit tenant/operator/trace/audit shape frozen by the management contract. */
function buildManagementContext(): Pick<
  CreateSupplierProfileRequest,
  'tenantId' | 'operatorContext' | 'traceContext' | 'auditContext'
> {
  return {
    ...buildQueryContext(),
    auditContext: {
      auditId: 'audit-1',
      reason: 'test',
      source: 'jest'
    }
  }
}

describe('srm-service grpc surface L3', () => {
  const requestContextStore = {
    run: jest.fn((_context, work: () => unknown) => work())
  }

  it('CreateSupplierProfile / should dispatch the management command through the audit wrapper and present the supplier response', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: 'supplier-1',
      supplierNo: 'CA-0001',
      tenantId: 'tenant-1',
      displayName: 'Acme SRM',
      status: 'INACTIVE',
      supplierCategory: null,
      tags: ['priority'],
      partyBinding: null
    })
    const recordCommand = jest.fn(async (_meta, work) => work())
    const controller = new SupplierManagementGrpcController(
      { execute } as never,
      { recordCommand } as never,
      requestContextStore as never
    )

    const response = await controller.createSupplierProfile({
      ...buildManagementContext(),
      displayName: 'Acme SRM',
      supplierCategory: 'EXPORT',
      tags: ['priority']
    })

    expect(recordCommand).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(1)
    expect(response).toEqual({
      supplier: expect.objectContaining({
        supplierId: 'supplier-1',
        supplierNo: 'CA-0001',
        tenantId: 'tenant-1',
        displayName: 'Acme SRM'
      })
    })
  })

  it('UpsertSupplierOffering / should dispatch the offering command and present the supplier offering response', async () => {
    const execute = jest.fn().mockResolvedValue({
      supplierOfferingId: 'offering-1',
      tenantId: 'tenant-1',
      supplierId: 'supplier-1',
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Raw Material',
      status: 'ACTIVE'
    })
    const recordCommand = jest.fn(async (_meta, work) => work())
    const controller = new SupplierManagementGrpcController(
      { execute } as never,
      { recordCommand } as never,
      requestContextStore as never
    )

    const response = await controller.upsertSupplierOffering({
      ...buildManagementContext(),
      supplierId: 'supplier-1',
      itemId: 'item-1',
      targetStatus: ProtoSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE
    } satisfies UpsertSupplierOfferingRequest)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(response).toEqual({
      offering: expect.objectContaining({
        supplierOfferingId: 'offering-1',
        supplierId: 'supplier-1',
        itemId: 'item-1',
        itemCode: 'RM-001',
        itemName: 'Raw Material',
        status: ProtoSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE
      })
    })
  })

  it('SearchSuppliers / should dispatch the query and present the supplier directory page', async () => {
    const execute = jest.fn().mockResolvedValue({
      suppliers: [
        {
          id: 'supplier-1',
          supplierNo: 'CA-0001',
          tenantId: 'tenant-1',
          displayName: 'Acme SRM',
          status: 'ACTIVE',
          supplierCategory: 'EXPORT',
          tags: ['priority'],
          partyBinding: {
            supplierPartyBindingId: 'binding-1',
            supplierId: 'supplier-1',
            tenantId: 'tenant-1',
            tenantPartyId: 'party-1',
            bindingStatus: 'ACTIVE',
            partyDisplayName: 'Acme Trading'
          }
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    const controller = new SupplierQueryGrpcController({ execute } as never)

    const response = await controller.searchSuppliers({
      ...buildQueryContext(),
      keyword: 'acme',
      status: ProtoSupplierStatus.SUPPLIER_STATUS_ACTIVE,
      tenantPartyId: 'party-1',
      page: 1,
      pageSize: 20
    } satisfies SearchSuppliersRequest)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(response).toEqual({
      suppliers: [
        expect.objectContaining({
          supplierId: 'supplier-1',
          displayName: 'Acme SRM',
          status: ProtoSupplierStatus.SUPPLIER_STATUS_ACTIVE,
          partyBinding: expect.objectContaining({
            tenantPartyId: 'party-1'
          })
        })
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
  })

  it('ListSupplierOfferingsByItem / should dispatch the query and present the offering page', async () => {
    const execute = jest.fn().mockResolvedValue({
      offerings: [
        {
          supplierOfferingId: 'offering-1',
          tenantId: 'tenant-1',
          supplierId: 'supplier-1',
          itemId: 'item-1',
          itemCode: 'RM-001',
          itemName: 'Raw Material',
          status: 'ACTIVE'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    const controller = new SupplierQueryGrpcController({ execute } as never)

    const response = await controller.listSupplierOfferingsByItem({
      ...buildQueryContext(),
      itemId: 'item-1',
      status: ProtoSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE,
      page: 1,
      pageSize: 20
    } satisfies ListSupplierOfferingsByItemRequest)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(response).toEqual({
      offerings: [
        expect.objectContaining({
          supplierOfferingId: 'offering-1',
          itemId: 'item-1',
          status: ProtoSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE
        })
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
  })

  it('controller surface / should not expose any SupplierItemMapping method in phase 1', () => {
    const managementMethods = Object.getOwnPropertyNames(SupplierManagementGrpcController.prototype)
    const queryMethods = Object.getOwnPropertyNames(SupplierQueryGrpcController.prototype)

    expect(managementMethods.join(' ')).not.toContain('SupplierItemMapping')
    expect(managementMethods.join(' ')).not.toContain('supplierItemMapping')
    expect(queryMethods.join(' ')).not.toContain('SupplierItemMapping')
    expect(queryMethods.join(' ')).not.toContain('supplierItemMapping')
  })
})
