import { status } from '@grpc/grpc-js'
import {
  CreateFinancialAccountCommand,
  ImportAccountTransactionsCommand,
  RecordAccountTransactionCommand,
  RegisterCustomerFinancialAccountCommand,
  SetExchangeRateCommand,
  UpdateFinancialAccountBasicsCommand
} from '../application/commands/account-management.commands'
import {
  CreateFinancialAccountHandler,
  ImportAccountTransactionsHandler,
  RecordAccountTransactionHandler,
  RegisterCustomerFinancialAccountHandler,
  SetExchangeRateHandler,
  UpdateFinancialAccountBasicsHandler
} from '../application/commands/account-management.handlers'
import {
  AllocatePaymentToReceivableCommand
} from '../application/commands/payment-management.commands'
import {
  AllocatePaymentToReceivableHandler
} from '../application/commands/payment-management.handlers'
import {
  CreateReceivableScheduleFromSalesOrderCommand,
  SetFinanceReleaseSignalCommand
} from '../application/commands/receivable-management.commands'
import {
  CreateReceivableScheduleFromSalesOrderHandler,
  SetFinanceReleaseSignalHandler
} from '../application/commands/receivable-management.handlers'
import {
  GetExchangeRateQuery,
  GetFinancialAccountQuery,
  SearchAccountTransactionsQuery,
  SearchFinancialAccountsQuery
} from '../application/queries/account-query.queries'
import {
  GetExchangeRateHandler,
  GetFinancialAccountHandler,
  SearchAccountTransactionsHandler,
  SearchFinancialAccountsHandler
} from '../application/queries/account-query.handlers'
import {
  SearchPaymentAllocationsQuery
} from '../application/queries/payment-query.queries'
import {
  SearchPaymentAllocationsHandler
} from '../application/queries/payment-query.handlers'
import {
  GetFinanceReleaseSignalQuery,
  GetReceivableScheduleQuery,
  SearchReceivableSchedulesQuery
} from '../application/queries/receivable-query.queries'
import {
  GetFinanceReleaseSignalHandler,
  GetReceivableScheduleHandler,
  SearchReceivableSchedulesHandler
} from '../application/queries/receivable-query.handlers'
import {
  AccountTransactionStatus,
  FinanceReleaseStatus
} from '../domain/models/finance-records'
import { InMemoryFinanceRepository } from '../infrastructure/repositories/in-memory/in-memory-finance.repository'
import { FinanceInMemoryStore } from '../infrastructure/store/finance-in-memory-store'

function createHarness() {
  const store = new FinanceInMemoryStore()
  const repository = new InMemoryFinanceRepository(store)

  return {
    repository,
    createFinancialAccount: new CreateFinancialAccountHandler(repository),
    updateFinancialAccountBasics: new UpdateFinancialAccountBasicsHandler(repository),
    importAccountTransactions: new ImportAccountTransactionsHandler(repository),
    recordAccountTransaction: new RecordAccountTransactionHandler(repository),
    registerCustomerFinancialAccount: new RegisterCustomerFinancialAccountHandler(repository),
    setExchangeRate: new SetExchangeRateHandler(repository),
    createReceivableSchedule: new CreateReceivableScheduleFromSalesOrderHandler(repository),
    setFinanceReleaseSignal: new SetFinanceReleaseSignalHandler(repository),
    allocatePaymentToReceivable: new AllocatePaymentToReceivableHandler(repository),
    getFinancialAccount: new GetFinancialAccountHandler(repository),
    searchFinancialAccounts: new SearchFinancialAccountsHandler(repository),
    searchAccountTransactions: new SearchAccountTransactionsHandler(repository),
    getExchangeRate: new GetExchangeRateHandler(repository),
    getReceivableSchedule: new GetReceivableScheduleHandler(repository),
    searchReceivableSchedules: new SearchReceivableSchedulesHandler(repository),
    getFinanceReleaseSignal: new GetFinanceReleaseSignalHandler(repository),
    searchPaymentAllocations: new SearchPaymentAllocationsHandler(repository)
  }
}

describe('finance-service behavior Unit', () => {
  it('GetFinancialAccount / when balance snapshot and mixed-status transactions exist / should calculate balance from snapshot plus confirmed transactions only', async () => {
    const harness = createHarness()

    const account = await harness.createFinancialAccount.execute(
      new CreateFinancialAccountCommand({
        tenantId: 'tenant-1',
        orgId: 'org-1',
        accountType: 'BANK',
        accountName: 'Main Collection Account',
        currencyCode: 'USD',
        institutionName: 'Bank of OES',
        accountIdentifier: '6222000012345678',
        openingBalance: '100.00',
        openingBalanceAsOf: '2026-04-01T00:00:00.000Z'
      })
    )

    await harness.recordAccountTransaction.execute(
      new RecordAccountTransactionCommand({
        tenantId: 'tenant-1',
        financialAccountId: account.id,
        direction: 'INFLOW',
        amount: '75.00',
        currencyCode: 'USD',
        transactionTime: '2026-04-02T00:00:00.000Z',
        status: AccountTransactionStatus.CONFIRMED,
        externalReference: 'bank-credit-1'
      })
    )

    await harness.recordAccountTransaction.execute(
      new RecordAccountTransactionCommand({
        tenantId: 'tenant-1',
        financialAccountId: account.id,
        direction: 'OUTFLOW',
        amount: '15.00',
        currencyCode: 'USD',
        transactionTime: '2026-04-03T00:00:00.000Z',
        status: AccountTransactionStatus.CONFIRMED,
        externalReference: 'bank-debit-1'
      })
    )

    await harness.recordAccountTransaction.execute(
      new RecordAccountTransactionCommand({
        tenantId: 'tenant-1',
        financialAccountId: account.id,
        direction: 'INFLOW',
        amount: '20.00',
        currencyCode: 'USD',
        transactionTime: '2026-04-04T00:00:00.000Z',
        status: AccountTransactionStatus.DRAFT,
        externalReference: 'draft-credit'
      })
    )

    const hydrated = await harness.getFinancialAccount.execute(
      new GetFinancialAccountQuery('tenant-1', account.id)
    )
    const search = await harness.searchFinancialAccounts.execute(
      new SearchFinancialAccountsQuery({
        tenantId: 'tenant-1',
        keyword: 'Main',
        page: 1,
        pageSize: 20
      })
    )

    expect(hydrated.currentBalance).toBe('160.00')
    expect(search.financialAccounts[0].currentBalance).toBe('160.00')
  })

  it('ImportAccountTransactions / when duplicate and invalid rows exist / should keep accepted, duplicate, and failed counts in the import batch summary', async () => {
    const harness = createHarness()
    const account = await harness.createFinancialAccount.execute(
      new CreateFinancialAccountCommand({
        tenantId: 'tenant-1',
        accountType: 'BANK',
        accountName: 'Import Account',
        currencyCode: 'USD',
        accountIdentifier: '6222000099999999'
      })
    )

    const imported = await harness.importAccountTransactions.execute(
      new ImportAccountTransactionsCommand({
        tenantId: 'tenant-1',
        financialAccountId: account.id,
        sourceType: 'CSV_IMPORT',
        sourceBatchReference: 'statement-apr-2026',
        fileAssetId: 'asset-1',
        attachmentRef: 'attachment-1',
        importedBy: 'operator-1',
        transactions: [
          {
            direction: 'INFLOW',
            amount: '50.00',
            currencyCode: 'USD',
            transactionTime: '2026-04-05T00:00:00.000Z',
            externalReference: 'dup-1',
            counterpartyName: 'Customer A'
          },
          {
            direction: 'INFLOW',
            amount: '50.00',
            currencyCode: 'USD',
            transactionTime: '2026-04-05T00:00:00.000Z',
            externalReference: 'dup-1',
            counterpartyName: 'Customer A'
          },
          {
            direction: 'OUTFLOW',
            amount: '',
            currencyCode: 'USD',
            transactionTime: '2026-04-06T00:00:00.000Z'
          },
          {
            direction: 'INFLOW',
            amount: '25.00',
            currencyCode: 'USD',
            transactionTime: '2026-04-07T00:00:00.000Z',
            externalReference: 'unique-2'
          }
        ]
      })
    )

    const transactions = await harness.searchAccountTransactions.execute(
      new SearchAccountTransactionsQuery({
        tenantId: 'tenant-1',
        financialAccountId: account.id,
        page: 1,
        pageSize: 20
      })
    )

    expect(imported.batch.totalRows).toBe(4)
    expect(imported.batch.acceptedCount).toBe(2)
    expect(imported.batch.duplicateCount).toBe(1)
    expect(imported.batch.failedCount).toBe(1)
    expect(imported.accountTransactionIds).toHaveLength(2)
    expect(transactions.total).toBe(2)
  })

  it('RegisterCustomerFinancialAccount / when a new default account is registered / should keep customer payment accounts separate from company financial accounts', async () => {
    const harness = createHarness()

    const registered = await harness.registerCustomerFinancialAccount.execute(
      new RegisterCustomerFinancialAccountCommand({
        tenantId: 'tenant-1',
        customerTenantPartyId: 'customer-1',
        accountHolderName: 'Customer One',
        accountProviderType: 'BANK',
        accountIdentifier: '6222333344445555',
        currencyCode: 'USD',
        isDefault: true
      })
    )

    expect(registered.customerTenantPartyId).toBe('customer-1')
    expect(registered.accountIdentifierMasked).toContain('5555')
    expect(registered.isDefault).toBe(true)
  })

  it('AllocatePaymentToReceivable / when one inflow is split across multiple lines and a second inflow completes the schedule / should keep partial, paid, and unallocated states consistent', async () => {
    const harness = createHarness()
    const account = await harness.createFinancialAccount.execute(
      new CreateFinancialAccountCommand({
        tenantId: 'tenant-1',
        accountType: 'BANK',
        accountName: 'Collection Account',
        currencyCode: 'USD',
        accountIdentifier: '6222111100000001'
      })
    )

    const schedule = await harness.createReceivableSchedule.execute(
      new CreateReceivableScheduleFromSalesOrderCommand({
        tenantId: 'tenant-1',
        orgId: 'org-1',
        salesOrderId: 'sales-order-1',
        customerTenantPartyId: 'customer-1',
        customerSnapshot: 'Customer One',
        currencyCode: 'USD',
        salesExchangeRateSnapshot: 'USD/CNY@7.1000',
        lines: [
          {
            dueDate: '2026-05-01',
            scheduledAmount: '60.00',
            sourceSalesOrderLineId: 'sol-1'
          },
          {
            dueDate: '2026-05-15',
            scheduledAmount: '40.00',
            sourceSalesOrderLineId: 'sol-2'
          }
        ]
      })
    )

    const firstInflow = await harness.recordAccountTransaction.execute(
      new RecordAccountTransactionCommand({
        tenantId: 'tenant-1',
        financialAccountId: account.id,
        direction: 'INFLOW',
        amount: '70.00',
        currencyCode: 'USD',
        transactionTime: '2026-04-10T00:00:00.000Z',
        status: AccountTransactionStatus.CONFIRMED,
        externalReference: 'receipt-1'
      })
    )

    await harness.allocatePaymentToReceivable.execute(
      new AllocatePaymentToReceivableCommand({
        tenantId: 'tenant-1',
        accountTransactionId: firstInflow.id,
        allocations: [
          {
            receivableScheduleId: schedule.id,
            receivableScheduleLineId: schedule.lines[0].id,
            allocatedAmount: '60.00'
          },
          {
            receivableScheduleId: schedule.id,
            receivableScheduleLineId: schedule.lines[1].id,
            allocatedAmount: '10.00'
          }
        ]
      })
    )

    const partiallyPaid = await harness.getReceivableSchedule.execute(
      new GetReceivableScheduleQuery('tenant-1', schedule.id)
    )

    expect(partiallyPaid.status).toBe('PARTIALLY_PAID')
    expect(partiallyPaid.lines[0].status).toBe('PAID')
    expect(partiallyPaid.lines[1].status).toBe('PARTIALLY_PAID')
    expect(partiallyPaid.outstandingAmount).toBe('30.00')

    const secondInflow = await harness.recordAccountTransaction.execute(
      new RecordAccountTransactionCommand({
        tenantId: 'tenant-1',
        financialAccountId: account.id,
        direction: 'INFLOW',
        amount: '50.00',
        currencyCode: 'USD',
        transactionTime: '2026-04-11T00:00:00.000Z',
        status: AccountTransactionStatus.CONFIRMED,
        externalReference: 'receipt-2'
      })
    )

    await harness.allocatePaymentToReceivable.execute(
      new AllocatePaymentToReceivableCommand({
        tenantId: 'tenant-1',
        accountTransactionId: secondInflow.id,
        allocations: [
          {
            receivableScheduleId: schedule.id,
            receivableScheduleLineId: schedule.lines[1].id,
            allocatedAmount: '30.00'
          }
        ]
      })
    )

    const paid = await harness.getReceivableSchedule.execute(
      new GetReceivableScheduleQuery('tenant-1', schedule.id)
    )
    const allocations = await harness.searchPaymentAllocations.execute(
      new SearchPaymentAllocationsQuery({
        tenantId: 'tenant-1',
        receivableScheduleId: schedule.id,
        page: 1,
        pageSize: 20
      })
    )
    const secondInflowSnapshot = await harness.searchAccountTransactions.execute(
      new SearchAccountTransactionsQuery({
        tenantId: 'tenant-1',
        externalReference: 'receipt-2',
        page: 1,
        pageSize: 20
      })
    )
    const schedules = await harness.searchReceivableSchedules.execute(
      new SearchReceivableSchedulesQuery({
        tenantId: 'tenant-1',
        sourceSalesOrderId: 'sales-order-1',
        page: 1,
        pageSize: 20
      })
    )

    expect(paid.status).toBe('PAID')
    expect(paid.outstandingAmount).toBe('0.00')
    expect(allocations.total).toBe(3)
    expect(secondInflowSnapshot.accountTransactions[0].unallocatedAmount).toBe('20.00')
    expect(schedules.receivableSchedules[0].status).toBe('PAID')
  })

  it('SetFinanceReleaseSignal / GetFinanceReleaseSignal / SetExchangeRate / GetExchangeRate / should persist finance-owned release and standard FX truth without touching sales order truth', async () => {
    const harness = createHarness()

    await harness.setFinanceReleaseSignal.execute(
      new SetFinanceReleaseSignalCommand({
        tenantId: 'tenant-1',
        salesOrderId: 'sales-order-2',
        customerTenantPartyId: 'customer-2',
        signalStatus: FinanceReleaseStatus.HELD,
        reasonCode: 'OVERDUE',
        reasonSummary: 'Customer has overdue receivables',
        effectiveAt: '2026-04-20T00:00:00.000Z',
        basedOnSummary: 'overdue amount 100.00'
      })
    )

    await harness.setExchangeRate.execute(
      new SetExchangeRateCommand({
        tenantId: 'tenant-1',
        baseCurrencyCode: 'USD',
        quoteCurrencyCode: 'CNY',
        rateValue: '7.123456',
        effectiveAt: '2026-04-20T00:00:00.000Z',
        setBy: 'operator-1'
      })
    )

    const signal = await harness.getFinanceReleaseSignal.execute(
      new GetFinanceReleaseSignalQuery('tenant-1', 'sales-order-2')
    )
    const rate = await harness.getExchangeRate.execute(
      new GetExchangeRateQuery({
        tenantId: 'tenant-1',
        baseCurrencyCode: 'USD',
        quoteCurrencyCode: 'CNY'
      })
    )

    expect(signal.signalStatus).toBe(FinanceReleaseStatus.HELD)
    expect(rate.rateValue).toBe('7.123456')
  })

  it('record update invariant / when a confirmed and allocated transaction is rewritten with a different amount / should reject key-field mutation', async () => {
    const harness = createHarness()
    const account = await harness.createFinancialAccount.execute(
      new CreateFinancialAccountCommand({
        tenantId: 'tenant-1',
        accountType: 'BANK',
        accountName: 'Invariant Account',
        currencyCode: 'USD',
        accountIdentifier: '699900001111'
      })
    )
    const schedule = await harness.createReceivableSchedule.execute(
      new CreateReceivableScheduleFromSalesOrderCommand({
        tenantId: 'tenant-1',
        salesOrderId: 'sales-order-9',
        customerTenantPartyId: 'customer-9',
        customerSnapshot: 'Customer Nine',
        currencyCode: 'USD',
        lines: [
          {
            dueDate: '2026-05-30',
            scheduledAmount: '20.00'
          }
        ]
      })
    )
    const transaction = await harness.recordAccountTransaction.execute(
      new RecordAccountTransactionCommand({
        tenantId: 'tenant-1',
        financialAccountId: account.id,
        direction: 'INFLOW',
        amount: '20.00',
        currencyCode: 'USD',
        transactionTime: '2026-04-30T00:00:00.000Z',
        status: AccountTransactionStatus.CONFIRMED
      })
    )

    await harness.allocatePaymentToReceivable.execute(
      new AllocatePaymentToReceivableCommand({
        tenantId: 'tenant-1',
        accountTransactionId: transaction.id,
        allocations: [
          {
            receivableScheduleId: schedule.id,
            receivableScheduleLineId: schedule.lines[0].id,
            allocatedAmount: '20.00'
          }
        ]
      })
    )

    await expect(
      harness.repository.saveAccountTransaction({
        ...transaction,
        amount: '21.00'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })
})
