import { status } from '@grpc/grpc-js'
import { CustomerManagementGrpcController } from '../../src/interfaces/grpc/customer-management.grpc.controller'
import { CustomerQueryGrpcController } from '../../src/interfaces/grpc/customer-query.grpc.controller'

function createManagementController() {
  return new CustomerManagementGrpcController(
    {
      execute: jest.fn()
    } as never,
    {
      recordCommand: jest.fn()
    } as never
  )
}

function createQueryController() {
  return new CustomerQueryGrpcController({
    execute: jest.fn()
  } as never)
}

describe('crm-service grpc context validation L3', () => {
  it('CreateCustomerAccount / when tenant_id is missing / should reject with INVALID_ARGUMENT', async () => {
    const controller = createManagementController()

    await expect(
      controller.createCustomerAccount({
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
          reason: 'create customer account',
          source: 'crm-workspace'
        },
        displayName: 'Acme CRM',
        tags: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })
  })

  it('CreateCustomerAccount / when operator_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createCustomerAccount({
        tenantId: 'tenant-1',
        traceContext: {
          traceId: 'trace-1',
          requestId: 'request-1'
        },
        auditContext: {
          auditId: 'audit-1',
          reason: 'create customer account',
          source: 'crm-workspace'
        },
        displayName: 'Acme CRM',
        tags: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('CreateCustomerAccount / when trace_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createCustomerAccount({
        tenantId: 'tenant-1',
        operatorContext: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN',
          orgId: 'org-1'
        },
        auditContext: {
          auditId: 'audit-1',
          reason: 'create customer account',
          source: 'crm-workspace'
        },
        displayName: 'Acme CRM',
        tags: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('CreateCustomerAccount / when audit_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createCustomerAccount({
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
        displayName: 'Acme CRM',
        tags: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('SearchSelectableCustomers / when query operator_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createQueryController()

    await expect(
      controller.searchSelectableCustomers({
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
