import {
  ManufacturingSpecStatus as ProtoManufacturingSpecStatus
} from '@oes/common/generated/mes_service'
import { ManufacturingSpecManagementGrpcController } from '../../src/interfaces/grpc/manufacturing-spec-management.grpc.controller'
import { ManufacturingSpecQueryGrpcController } from '../../src/interfaces/grpc/manufacturing-spec-query.grpc.controller'

/** buildQueryContext creates the generated gRPC query context used by ManufacturingSpec L3 tests. */
function buildQueryContext() {
  return {
    tenantId: 'tenant-1',
    orgId: 'org-1',
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

/** buildManagementContext creates the generated gRPC command context used by ManufacturingSpec L3 tests. */
function buildManagementContext() {
  return {
    ...buildQueryContext(),
    auditContext: {
      auditId: 'audit-1',
      reason: 'test',
      source: 'jest'
    },
    commandId: 'cmd-1'
  }
}

/** createRequestContextStore returns a minimal downstream context store stub for direct controller tests. */
function createRequestContextStore() {
  return {
    run: jest.fn((_context, work: () => Promise<unknown>) => work())
  }
}

/** specRecord returns one full application-layer ManufacturingSpec record for presenter tests. */
function specRecord() {
  return {
    manufacturingSpecId: 'spec-1',
    tenantId: 'tenant-1',
    orgId: 'org-1',
    specCode: 'WB-A100-HP',
    name: 'Wash Basin A100 High Pressure',
    revisionCode: 'R1',
    supersedesSpecId: null,
    productFamilyRef: {
      refType: 'PRODUCT_FAMILY',
      refId: 'pf-1',
      refCodeSnapshot: 'WB',
      displayNameSnapshot: 'Wash Basin'
    },
    itemRef: {
      itemId: 'item-1',
      itemCodeSnapshot: 'WB-A100',
      itemNameSnapshot: 'Wash Basin A100'
    },
    manufacturingAttributes: [
      {
        attributeKey: 'formingMethod',
        attributeValue: 'HIGH_PRESSURE',
        displayNameSnapshot: 'Forming method',
        valueDisplaySnapshot: 'High pressure'
      }
    ],
    routeIntentRef: {
      routeRefId: 'route-1',
      routeCodeSnapshot: 'ROUTE-HP',
      displayNameSnapshot: 'High pressure route'
    },
    status: 'DRAFT',
    effectiveFrom: '2026-05-05T00:00:00.000Z',
    effectiveTo: null,
    retiredAt: null,
    replacementSpecId: null,
    createdAt: '2026-05-05T00:00:00.000Z',
    updatedAt: '2026-05-05T00:00:00.000Z',
    version: 1
  }
}

describe('mes-service manufacturing spec grpc surface L3', () => {
  it('CreateManufacturingSpec / should seed downstream request context before invoking management service', async () => {
    const createManufacturingSpec = jest.fn().mockResolvedValue(specRecord())
    const requestContextStore = createRequestContextStore()
    const controller = new ManufacturingSpecManagementGrpcController(
      {
        createManufacturingSpec
      } as never,
      requestContextStore as never
    )

    await controller.createManufacturingSpec({
      ...buildManagementContext(),
      specCode: 'wb-a100-hp',
      name: 'Wash Basin A100 High Pressure',
      productFamilyRef: {
        refType: 1,
        refId: 'pf-1'
      },
      itemRef: {
        itemId: 'item-1'
      },
      manufacturingAttributes: [
        {
          attributeKey: 'formingMethod',
          attributeValue: 'HIGH_PRESSURE'
        }
      ],
      reason: 'create manufacturing spec'
    })

    expect(requestContextStore.run).toHaveBeenCalledWith(
      expect.objectContaining({
        internalServiceName: 'mes-service',
        requestId: 'request-1',
        traceId: 'trace-1',
        operatorContext: expect.objectContaining({
          operator_id: 'operator-1',
          operator_type: 'HUMAN',
          tenant_id: 'tenant-1',
          org_id: 'org-1',
          issuer: 'mes-service'
        })
      }),
      expect.any(Function)
    )
    expect(createManufacturingSpec).toHaveBeenCalled()
  })

  it('CreateManufacturingSpec / should map management payload and present DRAFT spec response', async () => {
    const createManufacturingSpec = jest.fn().mockResolvedValue(specRecord())
    const controller = new ManufacturingSpecManagementGrpcController(
      {
        createManufacturingSpec
      } as never,
      createRequestContextStore() as never
    )

    const response = await controller.createManufacturingSpec({
      ...buildManagementContext(),
      specCode: 'wb-a100-hp',
      name: 'Wash Basin A100 High Pressure',
      revisionCode: 'R1',
      productFamilyRef: {
        refType: 1,
        refId: 'pf-1',
        refCodeSnapshot: 'WB'
      },
      itemRef: {
        itemId: 'item-1',
        itemCodeSnapshot: 'WB-A100'
      },
      manufacturingAttributes: [
        {
          attributeKey: 'formingMethod',
          attributeValue: 'HIGH_PRESSURE'
        }
      ],
      routeIntentRef: {
        routeRefId: 'route-1',
        routeCodeSnapshot: 'ROUTE-HP'
      },
      effectiveFrom: '2026-05-05T00:00:00.000Z',
      reason: 'create manufacturing spec'
    })

    expect(createManufacturingSpec).toHaveBeenCalledWith(
      expect.objectContaining({
        specCode: 'wb-a100-hp',
        itemRef: expect.objectContaining({ itemId: 'item-1' }),
        manufacturingAttributes: [expect.objectContaining({ attributeKey: 'formingMethod' })]
      })
    )
    expect(response.manufacturingSpec?.specCode).toBe('WB-A100-HP')
    expect(response.manufacturingSpec?.status).toBe(ProtoManufacturingSpecStatus.MANUFACTURING_SPEC_STATUS_DRAFT)
  })

  it('ResolveManufacturingSpecsForMold / should map query filters and present unavailable refs', async () => {
    const resolveManufacturingSpecsForMold = jest.fn().mockResolvedValue({
      resolvedSpecs: [
        {
          manufacturingSpecId: 'spec-1',
          specCode: 'WB-A100-HP',
          name: 'Wash Basin A100 High Pressure',
          revisionCode: 'R1',
          productFamilyRef: {
            refType: 'PRODUCT_FAMILY',
            refId: 'pf-1'
          },
          itemRef: {
            itemId: 'item-1'
          },
          status: 'ACTIVE'
        }
      ],
      unavailableRefs: [
        {
          refType: 'MANUFACTURING_SPEC',
          refId: 'spec-draft',
          reasonCode: 'NOT_ACTIVE'
        }
      ]
    })
    const controller = new ManufacturingSpecQueryGrpcController({
      resolveManufacturingSpecsForMold
    } as never)

    const response = await controller.resolveManufacturingSpecsForMold({
      ...buildQueryContext(),
      moldDesignId: 'design-1',
      manufacturingSpecIds: ['spec-1', 'spec-draft']
    })

    expect(resolveManufacturingSpecsForMold).toHaveBeenCalledWith(
      expect.objectContaining({
        moldDesignId: 'design-1',
        manufacturingSpecIds: ['spec-1', 'spec-draft']
      })
    )
    expect(response.resolvedSpecs?.[0]?.status).toBe(
      ProtoManufacturingSpecStatus.MANUFACTURING_SPEC_STATUS_ACTIVE
    )
    expect(response.unavailableRefs?.[0]?.reasonCode).toBe('NOT_ACTIVE')
  })
})
