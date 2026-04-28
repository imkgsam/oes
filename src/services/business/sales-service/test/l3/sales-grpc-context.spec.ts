import { status } from '@grpc/grpc-js'
import { SalesManagementGrpcController } from '../../src/interfaces/grpc/sales-management.grpc.controller'
import { SalesQueryGrpcController } from '../../src/interfaces/grpc/sales-query.grpc.controller'

function createManagementController() {
  return new SalesManagementGrpcController(
    {
      execute: jest.fn()
    } as never,
    {
      recordCommand: jest.fn()
    } as never
  )
}

function createQueryController() {
  return new SalesQueryGrpcController({
    execute: jest.fn()
  } as never)
}

describe('sales-service grpc context validation L3', () => {
  it('CreateQuote / when tenant_id is missing / should reject with INVALID_ARGUMENT', async () => {
    const controller = createManagementController()

    await expect(
      controller.createQuote({
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
          reason: 'create quote',
          source: 'sales-workspace'
        },
        customerTenantPartyId: 'party-1',
        draftLines: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })
  })

  it('CreateQuote / when operator_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createQuote({
        tenantId: 'tenant-1',
        traceContext: {
          traceId: 'trace-1',
          requestId: 'request-1'
        },
        auditContext: {
          auditId: 'audit-1',
          reason: 'create quote',
          source: 'sales-workspace'
        },
        customerTenantPartyId: 'party-1',
        draftLines: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('CreateQuote / when trace_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createQuote({
        tenantId: 'tenant-1',
        operatorContext: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN',
          orgId: 'org-1'
        },
        auditContext: {
          auditId: 'audit-1',
          reason: 'create quote',
          source: 'sales-workspace'
        },
        customerTenantPartyId: 'party-1',
        draftLines: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('CreateQuote / when audit_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createQuote({
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
        customerTenantPartyId: 'party-1',
        draftLines: []
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('GetQuote / when query operator_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createQueryController()

    await expect(
      controller.getQuote({
        tenantId: 'tenant-1',
        traceContext: {
          traceId: 'trace-1',
          requestId: 'request-1'
        },
        quoteId: 'quote-1'
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })
})
