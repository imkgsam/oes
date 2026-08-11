import 'reflect-metadata'
import { Test } from '@nestjs/testing'
import {
  getRpcAuthorizationModeDeclaration,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { FinanceManagementGrpcController } from '../../src/interfaces/grpc/finance-management.grpc.controller'
import { FinanceQueryGrpcController } from '../../src/interfaces/grpc/finance-query.grpc.controller'
import { AppModule } from '../../src/app.module'

const HUMAN_WEB = { principalType: 'HUMAN', sessionTerminal: 'WEB' }

/** Locks Finance's 27-RPC token-only declaration map and controller guard boundary. */
describe('finance trusted gRPC security L3', () => {
  const declarations = [
    [FinanceQueryGrpcController, 'getFinancialAccount', 'finance.financial_account.get_by_id'],
    [FinanceQueryGrpcController, 'searchFinancialAccounts', 'finance.financial_account.list'],
    [FinanceQueryGrpcController, 'searchAccountTransactions', 'finance.account_transaction.list'],
    [FinanceQueryGrpcController, 'getExchangeRate', 'finance.exchange_rate.get'],
    [FinanceQueryGrpcController, 'getReceivableSchedule', 'finance.receivable_schedule.get_by_id'],
    [FinanceQueryGrpcController, 'searchReceivableSchedules', 'finance.receivable_schedule.list'],
    [FinanceQueryGrpcController, 'getFinanceReleaseSignal', 'finance.finance_release_signal.get'],
    [FinanceQueryGrpcController, 'getPayableSchedule', 'finance.payable.read'],
    [FinanceQueryGrpcController, 'searchPayableSchedules', 'finance.payable.read'],
    [FinanceQueryGrpcController, 'searchPaymentRequests', 'finance.payable.read'],
    [FinanceQueryGrpcController, 'searchPaymentExecutions', 'finance.payable.read'],
    [FinanceQueryGrpcController, 'searchPaymentAllocations', 'finance.payment_allocation.list'],
    [FinanceManagementGrpcController, 'createFinancialAccount', 'finance.financial_account.create'],
    [
      FinanceManagementGrpcController,
      'updateFinancialAccountBasics',
      'finance.financial_account.update_basics'
    ],
    [
      FinanceManagementGrpcController,
      'importAccountTransactions',
      'finance.account_transaction.import'
    ],
    [
      FinanceManagementGrpcController,
      'recordAccountTransaction',
      'finance.account_transaction.record'
    ],
    [
      FinanceManagementGrpcController,
      'registerCustomerFinancialAccount',
      'finance.customer_financial_account.register'
    ],
    [FinanceManagementGrpcController, 'setExchangeRate', 'finance.exchange_rate.set'],
    [
      FinanceManagementGrpcController,
      'createReceivableScheduleFromSalesOrder',
      'finance.receivable_schedule.create_from_sales_order'
    ],
    [
      FinanceManagementGrpcController,
      'setFinanceReleaseSignal',
      'finance.finance_release_signal.set'
    ],
    [
      FinanceManagementGrpcController,
      'createPayableScheduleFromPurchaseOrder',
      'finance.payable.create_from_purchase_order'
    ],
    [
      FinanceManagementGrpcController,
      'applyPayableScheduleAdjustmentFromPurchaseOrderChange',
      'finance.payable.adjust_from_purchase_order_change'
    ],
    [FinanceManagementGrpcController, 'createPaymentRequest', 'finance.payment_request.create'],
    [FinanceManagementGrpcController, 'decidePaymentRequest', 'finance.payment_request.decide'],
    [FinanceManagementGrpcController, 'executePaymentRequest', 'finance.payment_execution.create'],
    [
      FinanceManagementGrpcController,
      'allocatePaymentToPayable',
      'finance.payment_allocation.create'
    ],
    [
      FinanceManagementGrpcController,
      'allocatePaymentToReceivable',
      'finance.payment_allocation.allocate_to_receivable'
    ]
  ] as const

  it('declares exactly 27 BUSINESS/HUMAN/WEB Finance methods with canonical all-code requirements', () => {
    expect(declarations).toHaveLength(27)
    expect(new Set(declarations.map(([, method]) => method)).size).toBe(27)
    for (const [controller, method, code] of declarations) {
      expect(getRpcAuthorizationModeDeclaration(controller.prototype, method)).toEqual({
        mode: 'BUSINESS',
        permissions: { all: [code] },
        ...HUMAN_WEB
      })
    }
  })

  it('places TrustedExecutionGuard on both Finance controller classes before handler execution', () => {
    for (const controller of [FinanceQueryGrpcController, FinanceManagementGrpcController]) {
      expect(Reflect.getMetadata('__guards__', controller)).toContain(TrustedExecutionGuard)
    }
  })

  it('compiles the production AppModule graph and resolves both guarded controller owners', async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile()
    expect(module.get(FinanceQueryGrpcController)).toBeInstanceOf(FinanceQueryGrpcController)
    expect(module.get(FinanceManagementGrpcController)).toBeInstanceOf(
      FinanceManagementGrpcController
    )
    await module.close()
  })

  it('fails compilation when a guarded controller owner omits the required trusted-execution provider', async () => {
    await expect(
      Test.createTestingModule({ providers: [TrustedExecutionGuard] }).compile()
    ).rejects.toThrow('ExecutionTokenVerifier')
  })
})
