import { status } from '@grpc/grpc-js'
import { FinanceManagementGrpcController } from '../../src/interfaces/grpc/finance-management.grpc.controller'
import { FinanceQueryGrpcController } from '../../src/interfaces/grpc/finance-query.grpc.controller'

function createManagementController() {
  return new FinanceManagementGrpcController(
    {
      execute: jest.fn()
    } as never,
    {
      recordCommand: jest.fn()
    } as never
  )
}

function createQueryController() {
  return new FinanceQueryGrpcController({
    execute: jest.fn()
  } as never)
}

describe('finance-service grpc context validation L3', () => {
  it('CreateFinancialAccount / when tenant_id is missing / should reject with INVALID_ARGUMENT', async () => {
    const controller = createManagementController()

    await expect(
      controller.createFinancialAccount({
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
          reason: 'create account',
          source: 'finance-workspace'
        },
        accountType: 1,
        accountName: 'Main Account',
        currencyCode: 'USD',
        accountIdentifier: '6222000012345678'
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })
  })

  it('CreateFinancialAccount / when operator_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createFinancialAccount({
        tenantId: 'tenant-1',
        traceContext: {
          traceId: 'trace-1',
          requestId: 'request-1'
        },
        auditContext: {
          auditId: 'audit-1',
          reason: 'create account',
          source: 'finance-workspace'
        },
        accountType: 1,
        accountName: 'Main Account',
        currencyCode: 'USD',
        accountIdentifier: '6222000012345678'
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('CreateFinancialAccount / when trace_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createFinancialAccount({
        tenantId: 'tenant-1',
        operatorContext: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN',
          orgId: 'org-1'
        },
        auditContext: {
          auditId: 'audit-1',
          reason: 'create account',
          source: 'finance-workspace'
        },
        accountType: 1,
        accountName: 'Main Account',
        currencyCode: 'USD',
        accountIdentifier: '6222000012345678'
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('CreateFinancialAccount / when audit_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createManagementController()

    await expect(
      controller.createFinancialAccount({
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
        accountType: 1,
        accountName: 'Main Account',
        currencyCode: 'USD',
        accountIdentifier: '6222000012345678'
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })

  it('GetFinancialAccount / when query operator_context is missing / should reject with UNAUTHENTICATED', async () => {
    const controller = createQueryController()

    await expect(
      controller.getFinancialAccount({
        tenantId: 'tenant-1',
        traceContext: {
          traceId: 'trace-1',
          requestId: 'request-1'
        },
        financialAccountId: 'account-1'
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.UNAUTHENTICATED
      }
    })
  })
})
