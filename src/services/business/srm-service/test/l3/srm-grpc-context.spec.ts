import { status } from '@grpc/grpc-js'
import { SupplierManagementGrpcController } from '../../src/interfaces/grpc/supplier-management.grpc.controller'
import { SupplierQueryGrpcController } from '../../src/interfaces/grpc/supplier-query.grpc.controller'

function createManagementController() {
  return new SupplierManagementGrpcController(
    {
      execute: jest.fn()
    } as never,
    {
      recordCommand: jest.fn()
    } as never
  )
}

function createQueryController() {
  return new SupplierQueryGrpcController({
    execute: jest.fn()
  } as never)
}

describe('srm-service grpc context validation L3', () => {
  it('CreateSupplierProfile / when tenant_id is missing / should reject with INVALID_ARGUMENT', async () => {
    const controller = createManagementController()

    await expect(
      controller.createSupplierProfile({
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
          reason: 'create supplier profile',
          source: 'srm-workspace'
        },
        displayName: 'Acme SRM',
        tags: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })
  })

  it('CreateSupplierProfile / when operator_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createSupplierProfile({
        tenantId: 'tenant-1',
        traceContext: {
          traceId: 'trace-1',
          requestId: 'request-1'
        },
        auditContext: {
          auditId: 'audit-1',
          reason: 'create supplier profile',
          source: 'srm-workspace'
        },
        displayName: 'Acme SRM',
        tags: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('CreateSupplierProfile / when trace_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createSupplierProfile({
        tenantId: 'tenant-1',
        operatorContext: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN',
          orgId: 'org-1'
        },
        auditContext: {
          auditId: 'audit-1',
          reason: 'create supplier profile',
          source: 'srm-workspace'
        },
        displayName: 'Acme SRM',
        tags: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('CreateSupplierProfile / when audit_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createSupplierProfile({
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
        displayName: 'Acme SRM',
        tags: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('SearchSuppliers / when query operator_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createQueryController()

    await expect(
      controller.searchSuppliers({
        tenantId: 'tenant-1',
        traceContext: {
          traceId: 'trace-1',
          requestId: 'request-1'
        },
        keyword: 'acme'
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })
})
