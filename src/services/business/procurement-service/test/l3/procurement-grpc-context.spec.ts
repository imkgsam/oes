import { status } from '@grpc/grpc-js'
import { ProcurementManagementGrpcController } from '../../src/interfaces/grpc/procurement-management.grpc.controller'
import { ProcurementQueryGrpcController } from '../../src/interfaces/grpc/procurement-query.grpc.controller'

function createManagementController() {
  return new ProcurementManagementGrpcController(
    {
      execute: jest.fn()
    } as never,
    {
      recordCommand: jest.fn()
    } as never,
    {
      run: jest.fn((_context, work: () => unknown) => work())
    } as never
  )
}

function createQueryController() {
  return new ProcurementQueryGrpcController({
    execute: jest.fn()
  } as never)
}

describe('procurement-service grpc context validation L3', () => {
  it('CreatePurchaseRequest / when tenant_id is missing / should reject with INVALID_ARGUMENT', async () => {
    const controller = createManagementController()

    await expect(
      controller.createPurchaseRequest({
        tenantId: '',
        operatorContext: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN',
          orgId: 'org-1'
        },
        traceContext: {
          traceId: 'trace-1',
          requestId: 'request-1'
        },
        auditContext: {
          auditId: 'audit-1',
          reason: 'create purchase request',
          source: 'procurement-workspace'
        },
        requestType: 1,
        lines: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })
  })

  it('CreatePurchaseRequest / when operator_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createPurchaseRequest({
        tenantId: 'tenant-1',
        traceContext: {
          traceId: 'trace-1',
          requestId: 'request-1'
        },
        auditContext: {
          auditId: 'audit-1',
          reason: 'create purchase request',
          source: 'procurement-workspace'
        },
        requestType: 1,
        lines: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('CreatePurchaseRequest / when trace_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createPurchaseRequest({
        tenantId: 'tenant-1',
        operatorContext: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN',
          orgId: 'org-1'
        },
        auditContext: {
          auditId: 'audit-1',
          reason: 'create purchase request',
          source: 'procurement-workspace'
        },
        requestType: 1,
        lines: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('CreatePurchaseRequest / when audit_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createPurchaseRequest({
        tenantId: 'tenant-1',
        operatorContext: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN',
          orgId: 'org-1'
        },
        traceContext: {
          traceId: 'trace-1',
          requestId: 'request-1'
        },
        requestType: 1,
        lines: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('SearchPurchaseRequests / when query operator_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createQueryController()

    await expect(
      controller.searchPurchaseRequests({
        tenantId: 'tenant-1',
        traceContext: {
          traceId: 'trace-1',
          requestId: 'request-1'
        },
        keyword: 'stationery'
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })
})
