import { status } from '@grpc/grpc-js'
import {
  CreateFinancialAccountCommand,
  RecordAccountTransactionCommand,
  RegisterSupplierFinancialAccountCommand
} from '../application/commands/account-management.commands'
import {
  CreateFinancialAccountHandler,
  RecordAccountTransactionHandler,
  RegisterSupplierFinancialAccountHandler
} from '../application/commands/account-management.handlers'
import {
  AllocatePaymentToPayableCommand,
  ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeCommand,
  CreatePayableScheduleFromPurchaseOrderCommand,
  CreatePaymentRequestCommand,
  DecidePaymentRequestCommand,
  ExecutePaymentRequestCommand
} from '../application/commands/payment-management.commands'
import {
  AllocatePaymentToPayableHandler,
  ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeHandler,
  CreatePayableScheduleFromPurchaseOrderHandler,
  CreatePaymentRequestHandler,
  DecidePaymentRequestHandler,
  ExecutePaymentRequestHandler
} from '../application/commands/payment-management.handlers'
import {
  GetPayableScheduleQuery,
  SearchPayableSchedulesQuery,
  SearchPaymentAllocationsQuery,
  SearchPaymentExecutionsQuery,
  SearchPaymentRequestsQuery
} from '../application/queries/payment-query.queries'
import {
  GetPayableScheduleHandler,
  SearchPayableSchedulesHandler,
  SearchPaymentAllocationsHandler,
  SearchPaymentExecutionsHandler,
  SearchPaymentRequestsHandler
} from '../application/queries/payment-query.handlers'
import {
  AccountTransactionStatus,
  PaymentAllocationTargetType,
  PaymentRequestDecision,
  PaymentRequestSource
} from '../domain/models/finance-records'
import { InMemoryFinanceRepository } from '../infrastructure/repositories/in-memory/in-memory-finance.repository'
import { FinanceInMemoryStore } from '../infrastructure/store/finance-in-memory-store'

/** createHarness wires the in-memory phase 1B payable/payment runtime for behavior-first tests. */
function createHarness() {
  const store = new FinanceInMemoryStore()
  const repository = new InMemoryFinanceRepository(store)

  return {
    repository,
    createFinancialAccount: new CreateFinancialAccountHandler(repository),
    recordAccountTransaction: new RecordAccountTransactionHandler(repository),
    registerSupplierFinancialAccount: new RegisterSupplierFinancialAccountHandler(repository),
    createPayableSchedule: new CreatePayableScheduleFromPurchaseOrderHandler(repository),
    applyPayableAdjustment: new ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeHandler(
      repository
    ),
    createPaymentRequest: new CreatePaymentRequestHandler(repository),
    decidePaymentRequest: new DecidePaymentRequestHandler(repository),
    executePaymentRequest: new ExecutePaymentRequestHandler(repository),
    allocatePaymentToPayable: new AllocatePaymentToPayableHandler(repository),
    getPayableSchedule: new GetPayableScheduleHandler(repository),
    searchPayableSchedules: new SearchPayableSchedulesHandler(repository),
    searchPaymentRequests: new SearchPaymentRequestsHandler(repository),
    searchPaymentExecutions: new SearchPaymentExecutionsHandler(repository),
    searchPaymentAllocations: new SearchPaymentAllocationsHandler(repository)
  }
}

/** registerSupplierAccount seeds one supplier beneficiary account so payment requests stay on the contract-backed path. */
async function registerSupplierAccount(harness: ReturnType<typeof createHarness>) {
  return harness.registerSupplierFinancialAccount.execute(
    new RegisterSupplierFinancialAccountCommand({
      tenantId: 'tenant-1',
      supplierTenantPartyId: 'supplier-1',
      accountHolderName: 'Supplier One',
      accountProviderType: 'BANK',
      accountIdentifier: '6222555566667777',
      currencyCode: 'USD',
      isDefault: true
    })
  )
}

describe('finance-service payables and payments Unit', () => {
  it('CreatePayableScheduleFromPurchaseOrder / when one PO carries deposit, balance, installment, and term due lines / should create one payable truth with stable multi-line plan details', async () => {
    const harness = createHarness()

    const schedule = await harness.createPayableSchedule.execute(
      new CreatePayableScheduleFromPurchaseOrderCommand({
        tenantId: 'tenant-1',
        orgId: 'org-1',
        purchaseOrderId: 'po-1',
        purchaseOrderNo: 'PO-0001',
        procurementSnapshotReference: 'procurement-snapshot-1',
        supplierTenantPartyId: 'supplier-1',
        supplierSnapshot: 'Supplier One',
        currencyCode: 'USD',
        lines: [
          {
            lineType: 'DEPOSIT',
            sourceRef: 'po-1/deposit',
            dueDate: '2099-05-01',
            scheduledAmount: '200.00',
            sourcePurchaseOrderLineId: 'po-line-1'
          },
          {
            lineType: 'BALANCE',
            sourceRef: 'po-1/balance',
            dueDate: '2099-06-01',
            scheduledAmount: '500.00',
            sourcePurchaseOrderLineId: 'po-line-1'
          },
          {
            lineType: 'INSTALLMENT',
            sourceRef: 'po-1/installment-1',
            dueDate: '2099-07-01',
            scheduledAmount: '200.00',
            sourcePurchaseOrderLineId: 'po-line-2'
          },
          {
            lineType: 'TERM_DUE',
            sourceRef: 'po-1/term-due',
            dueDate: '2099-08-01',
            scheduledAmount: '100.00',
            sourcePurchaseOrderLineId: 'po-line-2'
          }
        ]
      })
    )

    const search = await harness.searchPayableSchedules.execute(
      new SearchPayableSchedulesQuery({
        tenantId: 'tenant-1',
        sourcePurchaseOrderId: 'po-1',
        page: 1,
        pageSize: 20
      })
    )

    expect(schedule.sourcePurchaseOrderId).toBe('po-1')
    expect(schedule.totalScheduledAmount).toBe('1000.00')
    expect(schedule.lines.map((line) => line.lineType)).toEqual([
      'DEPOSIT',
      'BALANCE',
      'INSTALLMENT',
      'TERM_DUE'
    ])
    expect(schedule.lines.map((line) => line.sourceRef)).toEqual([
      'po-1/deposit',
      'po-1/balance',
      'po-1/installment-1',
      'po-1/term-due'
    ])
    expect(search.total).toBe(1)
    expect(search.payableSchedules[0].sourcePurchaseOrderId).toBe('po-1')
  })

  it('GetPayableSchedule / SearchPayableSchedules / when a payable line is overdue and no valid request exists / should surface DUE_NO_REQUEST visibility without mutating the payable truth owner', async () => {
    const harness = createHarness()
    const schedule = await harness.createPayableSchedule.execute(
      new CreatePayableScheduleFromPurchaseOrderCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: 'po-due-1',
        purchaseOrderNo: 'PO-DUE-1',
        supplierTenantPartyId: 'supplier-1',
        supplierSnapshot: 'Supplier One',
        currencyCode: 'USD',
        lines: [
          {
            lineType: 'TERM_DUE',
            sourceRef: 'po-due-1/term',
            dueDate: '2000-01-01',
            scheduledAmount: '300.00'
          }
        ]
      })
    )

    const hydrated = await harness.getPayableSchedule.execute(
      new GetPayableScheduleQuery('tenant-1', schedule.id)
    )
    const search = await harness.searchPayableSchedules.execute(
      new SearchPayableSchedulesQuery({
        tenantId: 'tenant-1',
        requestGovernanceStatus: 'DUE_NO_REQUEST',
        overdueOnly: true,
        page: 1,
        pageSize: 20
      })
    )

    expect(hydrated.lines[0].requestGovernanceStatus).toBe('DUE_NO_REQUEST')
    expect(search.total).toBe(1)
    expect(search.payableSchedules[0].requestGovernanceStatusSummary).toBe('DUE_NO_REQUEST')
  })

  it('CreatePaymentRequest / when procurement and finance initiate requests / should enforce PO-backed normal path and the early-request reason rule', async () => {
    const harness = createHarness()
    const supplierAccount = await registerSupplierAccount(harness)
    const earlySchedule = await harness.createPayableSchedule.execute(
      new CreatePayableScheduleFromPurchaseOrderCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: 'po-early-1',
        purchaseOrderNo: 'PO-EARLY-1',
        supplierTenantPartyId: 'supplier-1',
        supplierSnapshot: 'Supplier One',
        currencyCode: 'USD',
        lines: [
          {
            lineType: 'DEPOSIT',
            sourceRef: 'po-early-1/deposit',
            dueDate: '2099-09-01',
            scheduledAmount: '200.00'
          }
        ]
      })
    )

    await expect(
      harness.createPaymentRequest.execute(
        new CreatePaymentRequestCommand({
          tenantId: 'tenant-1',
          requestSource: PaymentRequestSource.PROCUREMENT_INITIATED,
          supplierTenantPartyId: 'supplier-1',
          beneficiarySupplierFinancialAccountId: supplierAccount.id,
          currencyCode: 'USD',
          requestedAmount: '200.00',
          requestedLines: [
            {
              payableScheduleId: earlySchedule.id,
              payableScheduleLineId: earlySchedule.lines[0].id,
              requestedAmount: '200.00'
            }
          ]
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })

    const procurementInitiated = await harness.createPaymentRequest.execute(
      new CreatePaymentRequestCommand({
        tenantId: 'tenant-1',
        requestSource: PaymentRequestSource.PROCUREMENT_INITIATED,
        sourcePurchaseOrderId: 'po-early-1',
        supplierTenantPartyId: 'supplier-1',
        beneficiarySupplierFinancialAccountId: supplierAccount.id,
        currencyCode: 'USD',
        requestedAmount: '200.00',
        requestedLines: [
          {
            payableScheduleId: earlySchedule.id,
            payableScheduleLineId: earlySchedule.lines[0].id,
            requestedAmount: '200.00'
          }
        ],
        reason: 'Supplier requests deposit before production slot is reserved'
      })
    )

    const dueSchedule = await harness.createPayableSchedule.execute(
      new CreatePayableScheduleFromPurchaseOrderCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: 'po-due-finance-1',
        purchaseOrderNo: 'PO-DUE-FINANCE-1',
        supplierTenantPartyId: 'supplier-1',
        supplierSnapshot: 'Supplier One',
        currencyCode: 'USD',
        lines: [
          {
            lineType: 'TERM_DUE',
            sourceRef: 'po-due-finance-1/term',
            dueDate: '2000-01-02',
            scheduledAmount: '150.00'
          }
        ]
      })
    )

    const financeInitiated = await harness.createPaymentRequest.execute(
      new CreatePaymentRequestCommand({
        tenantId: 'tenant-1',
        requestSource: PaymentRequestSource.FINANCE_INITIATED,
        supplierTenantPartyId: 'supplier-1',
        beneficiarySupplierFinancialAccountId: supplierAccount.id,
        currencyCode: 'USD',
        requestedAmount: '150.00',
        requestedLines: [
          {
            payableScheduleId: dueSchedule.id,
            payableScheduleLineId: dueSchedule.lines[0].id,
            requestedAmount: '150.00'
          }
        ]
      })
    )

    const earlyScheduleHydrated = await harness.getPayableSchedule.execute(
      new GetPayableScheduleQuery('tenant-1', earlySchedule.id)
    )
    const requests = await harness.searchPaymentRequests.execute(
      new SearchPaymentRequestsQuery({
        tenantId: 'tenant-1',
        supplierTenantPartyId: 'supplier-1',
        page: 1,
        pageSize: 20
      })
    )

    expect(procurementInitiated.requestSource).toBe(PaymentRequestSource.PROCUREMENT_INITIATED)
    expect(procurementInitiated.reason).toContain('deposit')
    expect(earlyScheduleHydrated.lines[0].requestGovernanceStatus).toBe('EARLY_REQUEST')
    expect(financeInitiated.requestSource).toBe(PaymentRequestSource.FINANCE_INITIATED)
    expect(requests.total).toBe(2)
  })

  it('DecidePaymentRequest / ExecutePaymentRequest / when an approved request is executed / should record payment execution without auto-creating real account transactions', async () => {
    const harness = createHarness()
    const sourceAccount = await harness.createFinancialAccount.execute(
      new CreateFinancialAccountCommand({
        tenantId: 'tenant-1',
        accountType: 'BANK',
        accountName: 'Main Outflow Account',
        currencyCode: 'USD',
        accountIdentifier: '6222111100000001'
      })
    )
    const supplierAccount = await registerSupplierAccount(harness)
    const schedule = await harness.createPayableSchedule.execute(
      new CreatePayableScheduleFromPurchaseOrderCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: 'po-exec-1',
        purchaseOrderNo: 'PO-EXEC-1',
        supplierTenantPartyId: 'supplier-1',
        supplierSnapshot: 'Supplier One',
        currencyCode: 'USD',
        lines: [
          {
            lineType: 'TERM_DUE',
            sourceRef: 'po-exec-1/term',
            dueDate: '2000-01-03',
            scheduledAmount: '400.00'
          }
        ]
      })
    )
    const request = await harness.createPaymentRequest.execute(
      new CreatePaymentRequestCommand({
        tenantId: 'tenant-1',
        requestSource: PaymentRequestSource.FINANCE_INITIATED,
        supplierTenantPartyId: 'supplier-1',
        beneficiarySupplierFinancialAccountId: supplierAccount.id,
        currencyCode: 'USD',
        requestedAmount: '400.00',
        requestedLines: [
          {
            payableScheduleId: schedule.id,
            payableScheduleLineId: schedule.lines[0].id,
            requestedAmount: '400.00'
          }
        ]
      })
    )

    await harness.decidePaymentRequest.execute(
      new DecidePaymentRequestCommand({
        tenantId: 'tenant-1',
        paymentRequestId: request.id,
        decision: PaymentRequestDecision.APPROVED
      })
    )

    const executed = await harness.executePaymentRequest.execute(
      new ExecutePaymentRequestCommand({
        tenantId: 'tenant-1',
        paymentRequestId: request.id,
        sourceFinancialAccountId: sourceAccount.id,
        executedAmount: '400.00',
        currencyCode: 'USD',
        executedAt: '2026-04-28T10:00:00.000Z',
        executionReference: 'bank-batch-1',
        attachmentRefs: ['asset://proof-1']
      })
    )

    const hydrated = await harness.getPayableSchedule.execute(
      new GetPayableScheduleQuery('tenant-1', schedule.id)
    )
    const executions = await harness.searchPaymentExecutions.execute(
      new SearchPaymentExecutionsQuery({
        tenantId: 'tenant-1',
        paymentRequestId: request.id,
        page: 1,
        pageSize: 20
      })
    )
    const accountTransactions = await harness.repository.searchAccountTransactions({
      tenantId: 'tenant-1',
      page: 1,
      pageSize: 20
    })

    expect(executed.paymentRequest.status).toBe('EXECUTED')
    expect(executed.paymentExecution.status).toBe('RECORDED')
    expect(hydrated.totalExecutedAmount).toBe('400.00')
    expect(hydrated.totalAllocatedAmount).toBe('0.00')
    expect(hydrated.outstandingAmount).toBe('400.00')
    expect(executions.total).toBe(1)
    expect(accountTransactions.total).toBe(0)
  })

  it('AllocatePaymentToPayable / when both inflow and outflow transactions exist / should only accept OUTFLOW allocations against payable lines', async () => {
    const harness = createHarness()
    const sourceAccount = await harness.createFinancialAccount.execute(
      new CreateFinancialAccountCommand({
        tenantId: 'tenant-1',
        accountType: 'BANK',
        accountName: 'Disbursement Account',
        currencyCode: 'USD',
        accountIdentifier: '6222111100000002'
      })
    )
    const supplierAccount = await registerSupplierAccount(harness)
    const schedule = await harness.createPayableSchedule.execute(
      new CreatePayableScheduleFromPurchaseOrderCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: 'po-alloc-1',
        purchaseOrderNo: 'PO-ALLOC-1',
        supplierTenantPartyId: 'supplier-1',
        supplierSnapshot: 'Supplier One',
        currencyCode: 'USD',
        lines: [
          {
            lineType: 'TERM_DUE',
            sourceRef: 'po-alloc-1/term',
            dueDate: '2000-01-04',
            scheduledAmount: '180.00'
          }
        ]
      })
    )
    const request = await harness.createPaymentRequest.execute(
      new CreatePaymentRequestCommand({
        tenantId: 'tenant-1',
        requestSource: PaymentRequestSource.FINANCE_INITIATED,
        supplierTenantPartyId: 'supplier-1',
        beneficiarySupplierFinancialAccountId: supplierAccount.id,
        currencyCode: 'USD',
        requestedAmount: '180.00',
        requestedLines: [
          {
            payableScheduleId: schedule.id,
            payableScheduleLineId: schedule.lines[0].id,
            requestedAmount: '180.00'
          }
        ]
      })
    )

    await harness.decidePaymentRequest.execute(
      new DecidePaymentRequestCommand({
        tenantId: 'tenant-1',
        paymentRequestId: request.id,
        decision: PaymentRequestDecision.APPROVED
      })
    )

    const execution = await harness.executePaymentRequest.execute(
      new ExecutePaymentRequestCommand({
        tenantId: 'tenant-1',
        paymentRequestId: request.id,
        sourceFinancialAccountId: sourceAccount.id,
        executedAmount: '180.00',
        currencyCode: 'USD',
        executedAt: '2026-04-28T11:00:00.000Z'
      })
    )

    const inflow = await harness.recordAccountTransaction.execute(
      new RecordAccountTransactionCommand({
        tenantId: 'tenant-1',
        financialAccountId: sourceAccount.id,
        direction: 'INFLOW',
        amount: '180.00',
        currencyCode: 'USD',
        transactionTime: '2026-04-28T11:05:00.000Z',
        status: AccountTransactionStatus.CONFIRMED,
        externalReference: 'wrong-direction'
      })
    )

    await expect(
      harness.allocatePaymentToPayable.execute(
        new AllocatePaymentToPayableCommand({
          tenantId: 'tenant-1',
          accountTransactionId: inflow.id,
          paymentExecutionId: execution.paymentExecution.id,
          allocations: [
            {
              payableScheduleId: schedule.id,
              payableScheduleLineId: schedule.lines[0].id,
              allocatedAmount: '180.00'
            }
          ]
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })

    const outflow = await harness.recordAccountTransaction.execute(
      new RecordAccountTransactionCommand({
        tenantId: 'tenant-1',
        financialAccountId: sourceAccount.id,
        direction: 'OUTFLOW',
        amount: '180.00',
        currencyCode: 'USD',
        transactionTime: '2026-04-28T11:10:00.000Z',
        status: AccountTransactionStatus.CONFIRMED,
        externalReference: 'bank-outflow-1'
      })
    )

    await harness.allocatePaymentToPayable.execute(
      new AllocatePaymentToPayableCommand({
        tenantId: 'tenant-1',
        accountTransactionId: outflow.id,
        paymentExecutionId: execution.paymentExecution.id,
        allocations: [
          {
            payableScheduleId: schedule.id,
            payableScheduleLineId: schedule.lines[0].id,
            allocatedAmount: '180.00'
          }
        ]
      })
    )

    const hydrated = await harness.getPayableSchedule.execute(
      new GetPayableScheduleQuery('tenant-1', schedule.id)
    )
    const allocations = await harness.searchPaymentAllocations.execute(
      new SearchPaymentAllocationsQuery({
        tenantId: 'tenant-1',
        paymentExecutionId: execution.paymentExecution.id,
        targetType: PaymentAllocationTargetType.PAYABLE_SCHEDULE_LINE,
        targetScheduleId: schedule.id,
        page: 1,
        pageSize: 20
      })
    )

    expect(hydrated.status).toBe('PAID')
    expect(hydrated.lines[0].status).toBe('PAID')
    expect(hydrated.totalAllocatedAmount).toBe('180.00')
    expect(allocations.total).toBe(1)
    expect(allocations.paymentAllocations[0].targetType).toBe('PAYABLE_SCHEDULE_LINE')
  })

  it('ApplyPayableScheduleAdjustmentFromPurchaseOrderChange / when one change targets paid history and future open lines / should reject rewrites of paid lines while allowing add cancel and supersede on unexecuted lines', async () => {
    const harness = createHarness()
    const sourceAccount = await harness.createFinancialAccount.execute(
      new CreateFinancialAccountCommand({
        tenantId: 'tenant-1',
        accountType: 'BANK',
        accountName: 'Adjustment Disbursement Account',
        currencyCode: 'USD',
        accountIdentifier: '6222111100000003'
      })
    )
    const supplierAccount = await registerSupplierAccount(harness)
    const schedule = await harness.createPayableSchedule.execute(
      new CreatePayableScheduleFromPurchaseOrderCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: 'po-change-1',
        purchaseOrderNo: 'PO-CHANGE-1',
        supplierTenantPartyId: 'supplier-1',
        supplierSnapshot: 'Supplier One',
        currencyCode: 'USD',
        lines: [
          {
            lineType: 'DEPOSIT',
            sourceRef: 'po-change-1/deposit',
            dueDate: '2000-01-05',
            scheduledAmount: '100.00'
          },
          {
            lineType: 'BALANCE',
            sourceRef: 'po-change-1/balance',
            dueDate: '2099-10-01',
            scheduledAmount: '250.00'
          },
          {
            lineType: 'TERM_DUE',
            sourceRef: 'po-change-1/term',
            dueDate: '2099-11-01',
            scheduledAmount: '50.00'
          }
        ]
      })
    )
    const request = await harness.createPaymentRequest.execute(
      new CreatePaymentRequestCommand({
        tenantId: 'tenant-1',
        requestSource: PaymentRequestSource.FINANCE_INITIATED,
        supplierTenantPartyId: 'supplier-1',
        beneficiarySupplierFinancialAccountId: supplierAccount.id,
        currencyCode: 'USD',
        requestedAmount: '100.00',
        requestedLines: [
          {
            payableScheduleId: schedule.id,
            payableScheduleLineId: schedule.lines[0].id,
            requestedAmount: '100.00'
          }
        ]
      })
    )

    await harness.decidePaymentRequest.execute(
      new DecidePaymentRequestCommand({
        tenantId: 'tenant-1',
        paymentRequestId: request.id,
        decision: PaymentRequestDecision.APPROVED
      })
    )

    const execution = await harness.executePaymentRequest.execute(
      new ExecutePaymentRequestCommand({
        tenantId: 'tenant-1',
        paymentRequestId: request.id,
        sourceFinancialAccountId: sourceAccount.id,
        executedAmount: '100.00',
        currencyCode: 'USD',
        executedAt: '2026-04-28T12:00:00.000Z'
      })
    )
    const outflow = await harness.recordAccountTransaction.execute(
      new RecordAccountTransactionCommand({
        tenantId: 'tenant-1',
        financialAccountId: sourceAccount.id,
        direction: 'OUTFLOW',
        amount: '100.00',
        currencyCode: 'USD',
        transactionTime: '2026-04-28T12:05:00.000Z',
        status: AccountTransactionStatus.CONFIRMED
      })
    )

    await harness.allocatePaymentToPayable.execute(
      new AllocatePaymentToPayableCommand({
        tenantId: 'tenant-1',
        accountTransactionId: outflow.id,
        paymentExecutionId: execution.paymentExecution.id,
        allocations: [
          {
            payableScheduleId: schedule.id,
            payableScheduleLineId: schedule.lines[0].id,
            allocatedAmount: '100.00'
          }
        ]
      })
    )

    await expect(
      harness.applyPayableAdjustment.execute(
        new ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeCommand({
          tenantId: 'tenant-1',
          purchaseOrderId: 'po-change-1',
          purchaseOrderChangeId: 'po-change-1-rewrite-paid',
          adjustments: [
            {
              action: 'CANCEL_UNEXECUTED',
              targetSourceRef: 'po-change-1/deposit'
            }
          ]
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })

    const adjusted = await harness.applyPayableAdjustment.execute(
      new ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: 'po-change-1',
        purchaseOrderChangeId: 'po-change-1-open-adjustment',
        procurementSnapshotReference: 'procurement-snapshot-2',
        changeReason: 'Supplier split the remaining balance into new milestone plus term cancellation',
        adjustments: [
          {
            action: 'SUPERSEDE_UNEXECUTED',
            targetSourceRef: 'po-change-1/balance',
            newSourceRef: 'po-change-1/balance-revised',
            lineType: 'BALANCE',
            dueDate: '2099-10-15',
            scheduledAmount: '220.00'
          },
          {
            action: 'CANCEL_UNEXECUTED',
            targetSourceRef: 'po-change-1/term'
          },
          {
            action: 'ADD',
            newSourceRef: 'po-change-1/installment-2',
            lineType: 'INSTALLMENT',
            dueDate: '2099-10-25',
            scheduledAmount: '80.00'
          }
        ]
      })
    )

    const linesBySourceRef = new Map(adjusted.lines.map((line) => [line.sourceRef, line]))

    expect(linesBySourceRef.get('po-change-1/deposit')?.status).toBe('PAID')
    expect(linesBySourceRef.get('po-change-1/deposit')?.allocatedAmount).toBe('100.00')
    expect(linesBySourceRef.get('po-change-1/balance')?.status).toBe('CANCELLED')
    expect(linesBySourceRef.get('po-change-1/balance-revised')?.supersedesSourceRef).toBe(
      'po-change-1/balance'
    )
    expect(linesBySourceRef.get('po-change-1/term')?.status).toBe('CANCELLED')
    expect(linesBySourceRef.get('po-change-1/installment-2')?.scheduledAmount).toBe('80.00')
  })
})
