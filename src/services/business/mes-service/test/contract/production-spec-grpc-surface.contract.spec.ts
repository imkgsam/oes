import { ProductionSpecStatus as ProtoProductionSpecStatus } from '@oes/common/generated/mes_service'
import { ProductionSpecManagementGrpcController } from '../../src/interfaces/grpc/production-spec-management.grpc.controller'
import { ProductionSpecQueryGrpcController } from '../../src/interfaces/grpc/production-spec-query.grpc.controller'
import { attachVerifiedExecution } from '@oes/common/authorization'

const trustedContext: Record<string, unknown> = {}
Object.assign(attachVerifiedExecution(trustedContext, { verifiedExecutionToken: { tenantId: 'tenant-1', orgId: 'org-1', subject: 'operator-1', principalType: 'HUMAN', permissionCodes: [] } as never, verifiedWorkloadIdentity: {} as never }), { requestId: 'request-1', traceId: 'trace-1' })
beforeAll(() => Object.assign(Object.prototype, trustedContext))
afterAll(() => { delete (Object.prototype as Record<string, unknown>).__oesOperatorContext })

/** buildQueryContext creates the generated gRPC query context used by ProductionSpec Contract tests. */
function buildQueryContext() {
  return {
    ...trustedContext,
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

/** buildManagementContext creates the generated gRPC command context used by ProductionSpec Contract tests. */
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

/** specRecord returns one full application-layer ProductionSpec record for presenter tests. */
function specRecord() {
  return {
    productionSpecId: 'spec-1',
    tenantId: 'tenant-1',
    orgId: 'org-1',
    specCode: 'WB-A100-HP',
    name: 'Wash Basin A100 High Pressure',
    revisionCode: 'R1',
    supersedesProductionSpecId: null,
    itemRef: {
      itemId: 'item-1',
      itemCodeSnapshot: 'WB-A100',
      itemNameSnapshot: 'Wash Basin A100'
    },
    status: 'DRAFT',
    effectiveFrom: '2026-05-05T00:00:00.000Z',
    effectiveTo: null,
    retiredAt: null,
    replacementProductionSpecId: null,
    createdAt: '2026-05-05T00:00:00.000Z',
    updatedAt: '2026-05-05T00:00:00.000Z',
    version: 1
  }
}

describe('mes-service production spec grpc surface Contract', () => {
  it('CreateProductionSpec / should seed downstream request context before invoking management service', async () => {
    const createProductionSpec = jest.fn().mockResolvedValue(specRecord())
    const requestContextStore = createRequestContextStore()
    const controller = new ProductionSpecManagementGrpcController(
      {
        createProductionSpec
      } as never,
      requestContextStore as never
    )

    await controller.createProductionSpec({
      ...buildManagementContext(),
      specCode: 'wb-a100-hp',
      name: 'Wash Basin A100 High Pressure',
      itemRef: {
        itemId: 'item-1'
      }
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
    expect(createProductionSpec).toHaveBeenCalled()
  })

  it('CreateProductionSpec / should map command payload and present DRAFT spec response', async () => {
    const createProductionSpec = jest.fn().mockResolvedValue(specRecord())
    const controller = new ProductionSpecManagementGrpcController(
      {
        createProductionSpec
      } as never,
      createRequestContextStore() as never
    )

    const response = await controller.createProductionSpec({
      ...buildManagementContext(),
      specCode: 'wb-a100-hp',
      name: 'Wash Basin A100 High Pressure',
      revisionCode: 'R1',
      itemRef: {
        itemId: 'item-1',
        itemCodeSnapshot: 'WB-A100'
      },
      effectiveFrom: '2026-05-05T00:00:00.000Z'
    })

    expect(createProductionSpec).toHaveBeenCalledWith(
      expect.objectContaining({
        specCode: 'wb-a100-hp',
        itemRef: expect.objectContaining({ itemId: 'item-1' })
      })
    )
    expect(response.productionSpec?.specCode).toBe('WB-A100-HP')
    expect(response.productionSpec?.status).toBe(ProtoProductionSpecStatus.PRODUCTION_SPEC_STATUS_DRAFT)
  })

  it('ResolveProductionSpecsForMold / should map query filters and present unavailable refs', async () => {
    const resolveProductionSpecsForMold = jest.fn().mockResolvedValue({
      resolvedSpecs: [
        {
          productionSpecId: 'spec-1',
          specCode: 'WB-A100-HP',
          name: 'Wash Basin A100 High Pressure',
          revisionCode: 'R1',
          itemRef: {
            itemId: 'item-1'
          },
          status: 'ACTIVE'
        }
      ],
      unavailableRefs: [
        {
          refId: 'spec-draft',
          reasonCode: 'NOT_ACTIVE'
        }
      ]
    })
    const controller = new ProductionSpecQueryGrpcController({
      resolveProductionSpecsForMold
    } as never)

    const response = await controller.resolveProductionSpecsForMold({
      ...buildQueryContext(),
      moldDesignId: 'design-1',
      productionSpecIds: ['spec-1', 'spec-draft']
    })

    expect(resolveProductionSpecsForMold).toHaveBeenCalledWith(
      expect.objectContaining({
        moldDesignId: 'design-1',
        productionSpecIds: ['spec-1', 'spec-draft']
      })
    )
    expect(response.resolvedSpecs?.[0]?.status).toBe(
      ProtoProductionSpecStatus.PRODUCTION_SPEC_STATUS_ACTIVE
    )
    expect(response.unavailableRefs?.[0]?.reasonCode).toBe('NOT_ACTIVE')
  })
})
