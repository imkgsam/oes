import { randomUUID } from 'node:crypto'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  FINANCE_ALREADY_EXISTS,
  FINANCE_FAILED_PRECONDITION,
  FINANCE_NOT_FOUND
} from '../../../common/errors/finance.errors'
import {
  AccountTransactionDirection,
  AccountTransactionAllocationStatus,
  AccountTransactionImportBatchRecord,
  AccountTransactionRecord,
  AccountTransactionSearchInput,
  AccountTransactionStatus,
  ExchangeRateRecord,
  FinancialAccountBalanceSnapshotRecord,
  FinancialAccountRecord,
  FinancialAccountSearchInput,
  PageResult,
  PayableLineRequestGovernanceStatus,
  PayableScheduleRecord,
  PayableScheduleSearchInput,
  PayableScheduleStatus,
  PaymentAllocationRecord,
  PaymentAllocationSearchInput,
  PaymentAllocationTargetType,
  PaymentExecutionRecord,
  PaymentExecutionSearchInput,
  PaymentRequestRecord,
  PaymentRequestSearchInput,
  ReceivableScheduleRecord,
  ReceivableScheduleSearchInput,
  addMoneyAmount,
  cloneRecord,
  compareMoneyAmount,
  computeAllocationStatus,
  computePayableLineGovernanceStatus,
  computePayableLineStatus,
  computePayableScheduleGovernanceSummary,
  computePayableScheduleStatus,
  computeReceivableLineStatus,
  computeReceivableScheduleStatus,
  CustomerFinancialAccountRecord,
  FinancialAccountStatus,
  FinanceReleaseSignalRecord,
  isZeroAmount,
  normalizeMoneyAmount,
  normalizeRateValue,
  paginate,
  subtractMoneyAmount,
  SupplierFinancialAccountRecord,
  sumMoneyAmounts
} from '../../../domain/models/finance-records'
import { FinanceRepository } from '../../../domain/repositories/finance.repository'
import { FinanceInMemoryStore } from '../../store/finance-in-memory-store'

/** InMemoryFinanceRepository persists the finance phase 1A model inside a plain structured-clone store for L1 tests. */
export class InMemoryFinanceRepository implements FinanceRepository {
  constructor(private readonly store: FinanceInMemoryStore) {}

  async nextFinancialAccountNo(tenantId: string): Promise<string> {
    const nextValue = (this.store.nextFinancialAccountNoByTenant.get(tenantId) ?? 0) + 1
    this.store.nextFinancialAccountNoByTenant.set(tenantId, nextValue)
    return `FA-${String(nextValue).padStart(4, '0')}`
  }

  async nextReceivableScheduleNo(tenantId: string): Promise<string> {
    const nextValue = (this.store.nextReceivableScheduleNoByTenant.get(tenantId) ?? 0) + 1
    this.store.nextReceivableScheduleNoByTenant.set(tenantId, nextValue)
    return `AR-${String(nextValue).padStart(4, '0')}`
  }

  async nextPayableScheduleNo(tenantId: string): Promise<string> {
    const nextValue = (this.store.nextPayableScheduleNoByTenant.get(tenantId) ?? 0) + 1
    this.store.nextPayableScheduleNoByTenant.set(tenantId, nextValue)
    return `AP-${String(nextValue).padStart(4, '0')}`
  }

  async nextPaymentRequestNo(tenantId: string): Promise<string> {
    const nextValue = (this.store.nextPaymentRequestNoByTenant.get(tenantId) ?? 0) + 1
    this.store.nextPaymentRequestNoByTenant.set(tenantId, nextValue)
    return `PR-${String(nextValue).padStart(4, '0')}`
  }

  async saveFinancialAccount(record: FinancialAccountRecord): Promise<void> {
    const duplicate = Array.from(this.store.financialAccounts.values()).find(
      (account) =>
        account.tenantId === record.tenantId &&
        account.id !== record.id &&
        account.accountName === record.accountName &&
        account.accountIdentifierMasked === record.accountIdentifierMasked
    )

    if (duplicate) {
      throw ExceptionFactory.application(FINANCE_ALREADY_EXISTS, {
        resource: 'financialAccount',
        accountName: record.accountName
      })
    }

    this.store.financialAccounts.set(record.id, cloneRecord(record))
  }

  async findFinancialAccountById(
    tenantId: string,
    financialAccountId: string
  ): Promise<FinancialAccountRecord | null> {
    const found = this.store.financialAccounts.get(financialAccountId)
    if (!found || found.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(found)
  }

  async searchFinancialAccounts(
    input: FinancialAccountSearchInput
  ): Promise<PageResult<FinancialAccountRecord>> {
    const filtered = Array.from(this.store.financialAccounts.values())
      .filter((account) => account.tenantId === input.tenantId)
      .filter((account) => !input.orgId || account.orgId === input.orgId)
      .filter((account) => !input.accountType || account.accountType === input.accountType)
      .filter((account) => !input.currencyCode || account.currencyCode === input.currencyCode)
      .filter((account) => !input.status || account.status === input.status)
      .filter((account) => {
        if (!input.keyword) {
          return true
        }

        const keyword = input.keyword.toLowerCase()
        return [account.accountNo, account.accountName, account.institutionName ?? '']
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      })
      .sort((left, right) => left.accountNo.localeCompare(right.accountNo))
      .map((record) => cloneRecord(record))

    const { pageItems, total } = paginate(filtered, input.page ?? 1, input.pageSize ?? 20)
    return {
      items: pageItems,
      total,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20
    }
  }

  async saveBalanceSnapshot(record: FinancialAccountBalanceSnapshotRecord): Promise<void> {
    this.store.balanceSnapshots.set(record.id, cloneRecord(record))
  }

  async getLatestBalanceSnapshot(
    tenantId: string,
    financialAccountId: string
  ): Promise<FinancialAccountBalanceSnapshotRecord | null> {
    const snapshots = Array.from(this.store.balanceSnapshots.values())
      .filter(
        (snapshot) =>
          snapshot.tenantId === tenantId && snapshot.financialAccountId === financialAccountId
      )
      .sort((left, right) => right.snapshotAt.localeCompare(left.snapshotAt))

    return snapshots[0] ? cloneRecord(snapshots[0]) : null
  }

  async getCalculatedAccountBalance(tenantId: string, financialAccountId: string): Promise<string> {
    const snapshot = await this.getLatestBalanceSnapshot(tenantId, financialAccountId)
    let balance = snapshot ? normalizeMoneyAmount(snapshot.snapshotBalance) : '0.00'
    const afterSnapshotAt = snapshot?.snapshotAt

    for (const transaction of this.store.accountTransactions.values()) {
      if (
        transaction.tenantId !== tenantId ||
        transaction.financialAccountId !== financialAccountId ||
        transaction.status !== AccountTransactionStatus.CONFIRMED
      ) {
        continue
      }

      if (afterSnapshotAt && transaction.transactionTime < afterSnapshotAt) {
        continue
      }

      balance =
        transaction.direction === 'INFLOW'
          ? addMoneyAmount(balance, transaction.amount)
          : subtractMoneyAmount(balance, transaction.amount)
    }

    return normalizeMoneyAmount(balance)
  }

  async saveAccountTransaction(record: AccountTransactionRecord): Promise<void> {
    const existing = this.store.accountTransactions.get(record.id)
    const normalized = cloneRecord({
      ...record,
      amount: normalizeMoneyAmount(record.amount),
      allocatedAmount: normalizeMoneyAmount(record.allocatedAmount),
      unallocatedAmount: normalizeMoneyAmount(record.unallocatedAmount)
    })

    if (existing) {
      const isProtected =
        existing.status === AccountTransactionStatus.CONFIRMED &&
        existing.allocationStatus !== AccountTransactionAllocationStatus.UNALLOCATED
      if (
        isProtected &&
        (existing.financialAccountId !== normalized.financialAccountId ||
          existing.direction !== normalized.direction ||
          existing.currencyCode !== normalized.currencyCode ||
          compareMoneyAmount(existing.amount, normalized.amount) !== 0)
      ) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'confirmed allocated transaction cannot change key fields'
        })
      }
    }

    this.store.accountTransactions.set(normalized.id, normalized)

    const account = this.store.financialAccounts.get(normalized.financialAccountId)
    if (account) {
      account.lastTransactionAt =
        !account.lastTransactionAt || normalized.transactionTime > account.lastTransactionAt
          ? normalized.transactionTime
          : account.lastTransactionAt
      account.updatedAt = normalized.updatedAt
      this.store.financialAccounts.set(account.id, account)
    }
  }

  async findAccountTransactionById(
    tenantId: string,
    accountTransactionId: string
  ): Promise<AccountTransactionRecord | null> {
    const found = this.store.accountTransactions.get(accountTransactionId)
    if (!found || found.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(found)
  }

  async findDuplicateAccountTransaction(
    tenantId: string,
    financialAccountId: string,
    fingerprint: string
  ): Promise<AccountTransactionRecord | null> {
    const found = Array.from(this.store.accountTransactions.values()).find(
      (transaction) =>
        transaction.tenantId === tenantId &&
        transaction.financialAccountId === financialAccountId &&
        this.buildFingerprint(transaction) === fingerprint
    )

    return found ? cloneRecord(found) : null
  }

  async searchAccountTransactions(
    input: AccountTransactionSearchInput
  ): Promise<PageResult<AccountTransactionRecord>> {
    const filtered = Array.from(this.store.accountTransactions.values())
      .filter((transaction) => transaction.tenantId === input.tenantId)
      .filter((transaction) => !input.orgId || transaction.orgId === input.orgId)
      .filter(
        (transaction) =>
          !input.financialAccountId || transaction.financialAccountId === input.financialAccountId
      )
      .filter((transaction) => !input.direction || transaction.direction === input.direction)
      .filter((transaction) => !input.sourceType || transaction.sourceType === input.sourceType)
      .filter(
        (transaction) =>
          !input.allocationStatus || transaction.allocationStatus === input.allocationStatus
      )
      .filter(
        (transaction) =>
          !input.externalReference || transaction.externalReference === input.externalReference
      )
      .filter((transaction) => !input.occurredFrom || transaction.transactionTime >= input.occurredFrom)
      .filter((transaction) => !input.occurredTo || transaction.transactionTime <= input.occurredTo)
      .sort((left, right) => right.transactionTime.localeCompare(left.transactionTime))
      .map((record) => cloneRecord(record))

    const { pageItems, total } = paginate(filtered, input.page ?? 1, input.pageSize ?? 20)
    return {
      items: pageItems,
      total,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20
    }
  }

  async saveImportBatch(record: AccountTransactionImportBatchRecord): Promise<void> {
    this.store.importBatches.set(record.id, cloneRecord(record))
  }

  async saveCustomerFinancialAccount(record: CustomerFinancialAccountRecord): Promise<void> {
    if (record.isDefault) {
      for (const account of this.store.customerFinancialAccounts.values()) {
        if (
          account.tenantId === record.tenantId &&
          account.customerTenantPartyId === record.customerTenantPartyId &&
          account.id !== record.id
        ) {
          account.isDefault = false
          this.store.customerFinancialAccounts.set(account.id, account)
        }
      }
    }

    this.store.customerFinancialAccounts.set(record.id, cloneRecord(record))
  }

  async saveSupplierFinancialAccount(record: SupplierFinancialAccountRecord): Promise<void> {
    if (record.isDefault) {
      for (const account of this.store.supplierFinancialAccounts.values()) {
        if (
          account.tenantId === record.tenantId &&
          account.supplierTenantPartyId === record.supplierTenantPartyId &&
          account.id !== record.id
        ) {
          account.isDefault = false
          this.store.supplierFinancialAccounts.set(account.id, account)
        }
      }
    }

    this.store.supplierFinancialAccounts.set(record.id, cloneRecord(record))
  }

  async findSupplierFinancialAccountById(
    tenantId: string,
    supplierFinancialAccountId: string
  ): Promise<SupplierFinancialAccountRecord | null> {
    const found = this.store.supplierFinancialAccounts.get(supplierFinancialAccountId)
    if (!found || found.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(found)
  }

  async saveExchangeRate(record: ExchangeRateRecord): Promise<void> {
    this.store.exchangeRates.set(
      `${record.tenantId}:${record.baseCurrencyCode}:${record.quoteCurrencyCode}:${record.effectiveAt}`,
      cloneRecord({
        ...record,
        rateValue: normalizeRateValue(record.rateValue)
      })
    )
  }

  async getExchangeRate(input: {
    tenantId: string
    baseCurrencyCode: string
    quoteCurrencyCode: string
    effectiveAt?: string
  }): Promise<ExchangeRateRecord | null> {
    const candidates = Array.from(this.store.exchangeRates.values())
      .filter(
        (rate) =>
          rate.tenantId === input.tenantId &&
          rate.baseCurrencyCode === input.baseCurrencyCode &&
          rate.quoteCurrencyCode === input.quoteCurrencyCode
      )
      .filter((rate) => !input.effectiveAt || rate.effectiveAt <= input.effectiveAt)
      .sort((left, right) => right.effectiveAt.localeCompare(left.effectiveAt))

    return candidates[0] ? cloneRecord(candidates[0]) : null
  }

  async saveReceivableSchedule(record: ReceivableScheduleRecord): Promise<void> {
    this.store.receivableSchedules.set(record.id, cloneRecord(record))
  }

  async findReceivableScheduleById(
    tenantId: string,
    receivableScheduleId: string
  ): Promise<ReceivableScheduleRecord | null> {
    const found = this.store.receivableSchedules.get(receivableScheduleId)
    if (!found || found.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(found)
  }

  async findOpenReceivableScheduleBySalesOrderId(
    tenantId: string,
    salesOrderId: string
  ): Promise<ReceivableScheduleRecord | null> {
    const found = Array.from(this.store.receivableSchedules.values()).find(
      (schedule) =>
        schedule.tenantId === tenantId &&
        schedule.sourceSalesOrderId === salesOrderId &&
        schedule.status !== 'CANCELLED'
    )

    return found ? cloneRecord(found) : null
  }

  async searchReceivableSchedules(
    input: ReceivableScheduleSearchInput
  ): Promise<PageResult<ReceivableScheduleRecord>> {
    const financeReleaseBySalesOrder = new Map<string, string>(
      Array.from(this.store.financeReleaseSignals.values())
        .filter((signal) => signal.tenantId === input.tenantId)
        .map((signal) => [signal.salesOrderId, signal.signalStatus])
    )

    const filtered = Array.from(this.store.receivableSchedules.values())
      .filter((schedule) => schedule.tenantId === input.tenantId)
      .filter((schedule) => !input.orgId || schedule.orgId === input.orgId)
      .filter(
        (schedule) =>
          !input.customerTenantPartyId ||
          schedule.customerTenantPartyId === input.customerTenantPartyId
      )
      .filter(
        (schedule) => !input.sourceSalesOrderId || schedule.sourceSalesOrderId === input.sourceSalesOrderId
      )
      .filter((schedule) => !input.status || schedule.status === input.status)
      .filter(
        (schedule) =>
          !input.financeReleaseStatus ||
          financeReleaseBySalesOrder.get(schedule.sourceSalesOrderId) === input.financeReleaseStatus
      )
      .filter((schedule) => {
        if (!input.keyword) {
          return true
        }

        const keyword = input.keyword.toLowerCase()
        return [schedule.scheduleNo, schedule.sourceSalesOrderId, schedule.customerSnapshot]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      })
      .filter((schedule) => {
        if (!input.overdueOnly) {
          return true
        }

        return schedule.lines.some((line) => line.status === 'OVERDUE')
      })
      .filter(
        (schedule) =>
          !input.dueFrom || schedule.lines.some((line) => line.dueDate >= input.dueFrom!)
      )
      .filter((schedule) => !input.dueTo || schedule.lines.some((line) => line.dueDate <= input.dueTo!))
      .sort((left, right) => left.scheduleNo.localeCompare(right.scheduleNo))
      .map((record) => cloneRecord(record))

    const { pageItems, total } = paginate(filtered, input.page ?? 1, input.pageSize ?? 20)
    return {
      items: pageItems,
      total,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20
    }
  }

  async savePayableSchedule(record: PayableScheduleRecord): Promise<void> {
    const existing = this.store.payableSchedules.get(record.id)
    if (existing) {
      for (const nextLine of record.lines) {
        const previousLine = existing.lines.find((line) => line.id === nextLine.id)
        if (!previousLine) {
          continue
        }

        const paidOrAllocatedHistoryExists =
          compareMoneyAmount(previousLine.executedAmount, '0.00') > 0 ||
          compareMoneyAmount(previousLine.allocatedAmount, '0.00') > 0
        if (
          paidOrAllocatedHistoryExists &&
          (compareMoneyAmount(previousLine.scheduledAmount, nextLine.scheduledAmount) !== 0 ||
            previousLine.sourceRef !== nextLine.sourceRef)
        ) {
          throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
            reason: 'paid or allocated payable history cannot be silently rewritten'
          })
        }
      }
    }

    this.store.payableSchedules.set(record.id, cloneRecord(this.hydratePayableSchedule(record)))
  }

  async findPayableScheduleById(
    tenantId: string,
    payableScheduleId: string
  ): Promise<PayableScheduleRecord | null> {
    const found = this.store.payableSchedules.get(payableScheduleId)
    if (!found || found.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(this.hydratePayableSchedule(found))
  }

  async findActivePayableScheduleByPurchaseOrderId(
    tenantId: string,
    purchaseOrderId: string
  ): Promise<PayableScheduleRecord | null> {
    const found = Array.from(this.store.payableSchedules.values()).find(
      (schedule) =>
        schedule.tenantId === tenantId &&
        schedule.sourcePurchaseOrderId === purchaseOrderId &&
        schedule.status !== PayableScheduleStatus.CANCELLED
    )

    return found ? cloneRecord(this.hydratePayableSchedule(found)) : null
  }

  async searchPayableSchedules(
    input: PayableScheduleSearchInput
  ): Promise<PageResult<PayableScheduleRecord>> {
    const filtered = Array.from(this.store.payableSchedules.values())
      .map((record) => this.hydratePayableSchedule(record))
      .filter((schedule) => schedule.tenantId === input.tenantId)
      .filter((schedule) => !input.orgId || schedule.orgId === input.orgId)
      .filter(
        (schedule) =>
          !input.supplierTenantPartyId || schedule.supplierTenantPartyId === input.supplierTenantPartyId
      )
      .filter(
        (schedule) =>
          !input.sourcePurchaseOrderId || schedule.sourcePurchaseOrderId === input.sourcePurchaseOrderId
      )
      .filter((schedule) => !input.status || schedule.status === input.status)
      .filter((schedule) => {
        if (!input.keyword) {
          return true
        }

        const keyword = input.keyword.toLowerCase()
        return [
          schedule.scheduleNo,
          schedule.sourcePurchaseOrderNo ?? '',
          schedule.supplierSnapshot
        ]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      })
      .filter((schedule) => {
        if (!input.requestGovernanceStatus) {
          return true
        }

        return (
          computePayableScheduleGovernanceSummary(schedule.lines) === input.requestGovernanceStatus
        )
      })
      .filter((schedule) => {
        if (!input.overdueOnly) {
          return true
        }

        return schedule.lines.some((line) => line.status === 'OVERDUE')
      })
      .filter(
        (schedule) => !input.dueFrom || schedule.lines.some((line) => line.dueDate >= input.dueFrom!)
      )
      .filter((schedule) => !input.dueTo || schedule.lines.some((line) => line.dueDate <= input.dueTo!))
      .sort((left, right) => left.scheduleNo.localeCompare(right.scheduleNo))
      .map((record) => cloneRecord(record))

    const { pageItems, total } = paginate(filtered, input.page ?? 1, input.pageSize ?? 20)
    return {
      items: pageItems,
      total,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20
    }
  }

  async savePaymentRequest(record: PaymentRequestRecord): Promise<void> {
    this.store.paymentRequests.set(record.id, cloneRecord(record))
  }

  async findPaymentRequestById(
    tenantId: string,
    paymentRequestId: string
  ): Promise<PaymentRequestRecord | null> {
    const found = this.store.paymentRequests.get(paymentRequestId)
    if (!found || found.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(found)
  }

  async searchPaymentRequests(
    input: PaymentRequestSearchInput
  ): Promise<PageResult<PaymentRequestRecord>> {
    const filtered = Array.from(this.store.paymentRequests.values())
      .filter((request) => request.tenantId === input.tenantId)
      .filter((request) => !input.orgId || request.orgId === input.orgId)
      .filter((request) => !input.requestSource || request.requestSource === input.requestSource)
      .filter(
        (request) =>
          !input.supplierTenantPartyId || request.supplierTenantPartyId === input.supplierTenantPartyId
      )
      .filter(
        (request) =>
          !input.sourcePurchaseOrderId || request.sourcePurchaseOrderId === input.sourcePurchaseOrderId
      )
      .filter((request) => !input.status || request.status === input.status)
      .filter(
        (request) =>
          !input.beneficiarySupplierFinancialAccountId ||
          request.beneficiarySupplierFinancialAccountId === input.beneficiarySupplierFinancialAccountId
      )
      .filter((request) => !input.requestedFrom || request.requestedAt >= input.requestedFrom)
      .filter((request) => !input.requestedTo || request.requestedAt <= input.requestedTo)
      .sort((left, right) => right.requestedAt.localeCompare(left.requestedAt))
      .map((record) => cloneRecord(record))

    const { pageItems, total } = paginate(filtered, input.page ?? 1, input.pageSize ?? 20)
    return {
      items: pageItems,
      total,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20
    }
  }

  async savePaymentExecution(record: PaymentExecutionRecord): Promise<void> {
    this.store.paymentExecutions.set(record.id, cloneRecord(record))
  }

  async findPaymentExecutionById(
    tenantId: string,
    paymentExecutionId: string
  ): Promise<PaymentExecutionRecord | null> {
    const found = this.store.paymentExecutions.get(paymentExecutionId)
    if (!found || found.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(found)
  }

  async searchPaymentExecutions(
    input: PaymentExecutionSearchInput
  ): Promise<PageResult<PaymentExecutionRecord>> {
    const filtered = Array.from(this.store.paymentExecutions.values())
      .filter((execution) => execution.tenantId === input.tenantId)
      .filter((execution) => !input.orgId || execution.orgId === input.orgId)
      .filter(
        (execution) => !input.paymentRequestId || execution.paymentRequestId === input.paymentRequestId
      )
      .filter(
        (execution) =>
          !input.supplierTenantPartyId || execution.supplierTenantPartyId === input.supplierTenantPartyId
      )
      .filter(
        (execution) =>
          !input.sourceFinancialAccountId ||
          execution.sourceFinancialAccountId === input.sourceFinancialAccountId
      )
      .filter(
        (execution) =>
          !input.linkedAccountTransactionId ||
          execution.linkedAccountTransactionId === input.linkedAccountTransactionId
      )
      .filter((execution) => !input.status || execution.status === input.status)
      .filter((execution) => !input.executedFrom || execution.executedAt >= input.executedFrom)
      .filter((execution) => !input.executedTo || execution.executedAt <= input.executedTo)
      .sort((left, right) => right.executedAt.localeCompare(left.executedAt))
      .map((record) => cloneRecord(record))

    const { pageItems, total } = paginate(filtered, input.page ?? 1, input.pageSize ?? 20)
    return {
      items: pageItems,
      total,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20
    }
  }

  async allocateTransactionToPayable(record: PaymentAllocationRecord): Promise<void> {
    const transaction = this.store.accountTransactions.get(record.accountTransactionId)
    if (!transaction || transaction.tenantId !== record.tenantId) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'accountTransaction'
      })
    }

    if (transaction.direction !== AccountTransactionDirection.OUTFLOW) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'only outflow transactions can be allocated to payable schedules'
      })
    }

    if (transaction.status !== AccountTransactionStatus.CONFIRMED) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'only confirmed transactions can be allocated'
      })
    }

    const schedule = this.store.payableSchedules.get(record.targetScheduleId)
    if (!schedule || schedule.tenantId !== record.tenantId) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'payableSchedule'
      })
    }

    const line = schedule.lines.find((item) => item.id === record.targetScheduleLineId)
    if (!line) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'payableScheduleLine'
      })
    }

    const normalizedAmount = normalizeMoneyAmount(record.allocatedAmount)
    if (compareMoneyAmount(normalizedAmount, transaction.unallocatedAmount) > 0) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'allocation exceeds unallocated transaction amount'
      })
    }

    const lineOutstandingAmount = subtractMoneyAmount(line.scheduledAmount, line.allocatedAmount)
    if (compareMoneyAmount(normalizedAmount, lineOutstandingAmount) > 0) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'allocation exceeds outstanding payable line amount'
      })
    }

    const saved = cloneRecord({
      ...record,
      allocatedAmount: normalizedAmount,
      targetType: PaymentAllocationTargetType.PAYABLE_SCHEDULE_LINE
    })
    this.store.paymentAllocations.set(saved.id, saved)

    line.allocatedAmount = addMoneyAmount(line.allocatedAmount, normalizedAmount)
    line.outstandingAmount = subtractMoneyAmount(line.scheduledAmount, line.allocatedAmount)
    line.status = computePayableLineStatus(line.scheduledAmount, line.allocatedAmount, line.dueDate)
    line.requestGovernanceStatus =
      compareMoneyAmount(line.allocatedAmount, line.scheduledAmount) >= 0
        ? PayableLineRequestGovernanceStatus.PAID
        : PayableLineRequestGovernanceStatus.PARTIALLY_PAID
    line.updatedAt = saved.allocatedAt

    const recalculated = this.hydratePayableSchedule({
      ...schedule,
      updatedAt: saved.allocatedAt
    })
    this.store.payableSchedules.set(schedule.id, cloneRecord(recalculated))

    transaction.allocatedAmount = addMoneyAmount(transaction.allocatedAmount, normalizedAmount)
    transaction.unallocatedAmount = subtractMoneyAmount(transaction.amount, transaction.allocatedAmount)
    transaction.allocationStatus = computeAllocationStatus(
      transaction.amount,
      transaction.allocatedAmount
    )
    transaction.updatedAt = saved.allocatedAt
    this.store.accountTransactions.set(transaction.id, cloneRecord(transaction))
  }

  async allocateTransactionToReceivable(record: PaymentAllocationRecord): Promise<void> {
    const transaction = this.store.accountTransactions.get(record.accountTransactionId)
    if (!transaction || transaction.tenantId !== record.tenantId) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'accountTransaction'
      })
    }

    if (transaction.direction !== 'INFLOW') {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'only inflow transactions can be allocated to receivable schedules'
      })
    }

    if (transaction.status !== AccountTransactionStatus.CONFIRMED) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'only confirmed transactions can be allocated'
      })
    }

    const schedule = this.store.receivableSchedules.get(record.targetScheduleId)
    if (!schedule || schedule.tenantId !== record.tenantId) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'receivableSchedule'
      })
    }

    const line = schedule.lines.find((item) => item.id === record.targetScheduleLineId)
    if (!line) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'receivableScheduleLine'
      })
    }

    const normalizedAmount = normalizeMoneyAmount(record.allocatedAmount)
    if (compareMoneyAmount(normalizedAmount, transaction.unallocatedAmount) > 0) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'allocation exceeds unallocated transaction amount'
      })
    }

    if (compareMoneyAmount(normalizedAmount, line.outstandingAmount) > 0) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'allocation exceeds outstanding receivable line amount'
      })
    }

    const saved = cloneRecord({
      ...record,
      allocatedAmount: normalizedAmount
    })
    this.store.paymentAllocations.set(saved.id, saved)

    line.allocatedAmount = addMoneyAmount(line.allocatedAmount, normalizedAmount)
    line.outstandingAmount = subtractMoneyAmount(line.scheduledAmount, line.allocatedAmount)
    line.status = computeReceivableLineStatus(line.scheduledAmount, line.allocatedAmount)
    line.updatedAt = saved.allocatedAt

    schedule.totalAllocatedAmount = schedule.lines.reduce(
      (sum, item) => addMoneyAmount(sum, item.id === line.id ? line.allocatedAmount : item.allocatedAmount),
      '0.00'
    )
    schedule.outstandingAmount = subtractMoneyAmount(
      schedule.totalScheduledAmount,
      schedule.totalAllocatedAmount
    )
    schedule.status = computeReceivableScheduleStatus(
      schedule.totalScheduledAmount,
      schedule.totalAllocatedAmount
    )
    schedule.updatedAt = saved.allocatedAt
    this.store.receivableSchedules.set(schedule.id, cloneRecord(schedule))

    transaction.allocatedAmount = addMoneyAmount(transaction.allocatedAmount, normalizedAmount)
    transaction.unallocatedAmount = subtractMoneyAmount(transaction.amount, transaction.allocatedAmount)
    transaction.allocationStatus = computeAllocationStatus(
      transaction.amount,
      transaction.allocatedAmount
    )
    transaction.updatedAt = saved.allocatedAt
    this.store.accountTransactions.set(transaction.id, cloneRecord(transaction))
  }

  async searchPaymentAllocations(
    input: PaymentAllocationSearchInput
  ): Promise<PageResult<PaymentAllocationRecord>> {
    const filtered = Array.from(this.store.paymentAllocations.values())
      .filter((allocation) => allocation.tenantId === input.tenantId)
      .filter(
        (allocation) =>
          !input.accountTransactionId || allocation.accountTransactionId === input.accountTransactionId
      )
      .filter(
        (allocation) =>
          !input.paymentExecutionId || allocation.paymentExecutionId === input.paymentExecutionId
      )
      .filter(
        (allocation) => !input.targetType || allocation.targetType === input.targetType
      )
      .filter(
        (allocation) =>
          !(input.targetScheduleId ?? input.receivableScheduleId) ||
          allocation.targetScheduleId === (input.targetScheduleId ?? input.receivableScheduleId)
      )
      .filter(
        (allocation) =>
          !(input.targetScheduleLineId ?? input.receivableScheduleLineId) ||
          allocation.targetScheduleLineId ===
            (input.targetScheduleLineId ?? input.receivableScheduleLineId)
      )
      .filter((allocation) => !input.allocatedFrom || allocation.allocatedAt >= input.allocatedFrom)
      .filter((allocation) => !input.allocatedTo || allocation.allocatedAt <= input.allocatedTo)
      .sort((left, right) => left.allocatedAt.localeCompare(right.allocatedAt))
      .map((record) => cloneRecord(record))

    const { pageItems, total } = paginate(filtered, input.page ?? 1, input.pageSize ?? 20)
    return {
      items: pageItems,
      total,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20
    }
  }

  async saveFinanceReleaseSignal(record: FinanceReleaseSignalRecord): Promise<void> {
    const existing = Array.from(this.store.financeReleaseSignals.values()).find(
      (signal) => signal.tenantId === record.tenantId && signal.salesOrderId === record.salesOrderId
    )

    this.store.financeReleaseSignals.set(existing?.id ?? record.id, cloneRecord(record))
  }

  async getFinanceReleaseSignalBySalesOrderId(
    tenantId: string,
    salesOrderId: string
  ): Promise<FinanceReleaseSignalRecord | null> {
    const found = Array.from(this.store.financeReleaseSignals.values())
      .filter((signal) => signal.tenantId === tenantId && signal.salesOrderId === salesOrderId)
      .sort((left, right) => right.effectiveAt.localeCompare(left.effectiveAt))[0]

    return found ? cloneRecord(found) : null
  }

  /** buildFingerprint constructs the import de-duplication key frozen for the in-memory phase 1A runtime. */
  private buildFingerprint(record: AccountTransactionRecord): string {
    return [
      record.financialAccountId,
      record.direction,
      normalizeMoneyAmount(record.amount),
      record.currencyCode,
      record.transactionTime,
      record.valueDate ?? '',
      record.externalReference ?? ''
    ].join('|')
  }

  /** hydratePayableSchedule recomputes one payable schedule's derived totals and governance visibility from stored line truth. */
  private hydratePayableSchedule(record: PayableScheduleRecord): PayableScheduleRecord {
    const now = new Date().toISOString()
    const lines = record.lines.map((line) => {
      if (line.status === 'CANCELLED') {
        return {
          ...line,
          outstandingAmount: '0.00',
          requestGovernanceStatus: PayableLineRequestGovernanceStatus.NONE
        }
      }

      const requestedAmount = normalizeMoneyAmount(line.requestedAmount)
      const executedAmount = normalizeMoneyAmount(line.executedAmount)
      const allocatedAmount = normalizeMoneyAmount(line.allocatedAmount)
      const scheduledAmount = normalizeMoneyAmount(line.scheduledAmount)
      const outstandingAmount =
        compareMoneyAmount(scheduledAmount, allocatedAmount) <= 0
          ? '0.00'
          : subtractMoneyAmount(scheduledAmount, allocatedAmount)
      const status = computePayableLineStatus(scheduledAmount, allocatedAmount, line.dueDate, now)

      return {
        ...line,
        scheduledAmount,
        requestedAmount,
        executedAmount,
        allocatedAmount,
        outstandingAmount,
        status,
        requestGovernanceStatus: computePayableLineGovernanceStatus({
          storedStatus: line.requestGovernanceStatus,
          dueDate: line.dueDate,
          requestedAmount,
          executedAmount,
          allocatedAmount,
          lineStatus: status,
          now
        })
      }
    })

    const activeLines = lines.filter((line) => line.status !== 'CANCELLED')
    const totalScheduledAmount = sumMoneyAmounts(activeLines.map((line) => line.scheduledAmount))
    const totalRequestedAmount = sumMoneyAmounts(activeLines.map((line) => line.requestedAmount))
    const totalExecutedAmount = sumMoneyAmounts(activeLines.map((line) => line.executedAmount))
    const totalAllocatedAmount = sumMoneyAmounts(activeLines.map((line) => line.allocatedAmount))
    const outstandingAmount = sumMoneyAmounts(activeLines.map((line) => line.outstandingAmount))

    return {
      ...cloneRecord(record),
      lines,
      totalScheduledAmount,
      totalRequestedAmount,
      totalExecutedAmount,
      totalAllocatedAmount,
      outstandingAmount,
      status:
        activeLines.length === 0
          ? PayableScheduleStatus.CANCELLED
          : computePayableScheduleStatus(totalScheduledAmount, totalAllocatedAmount)
    }
  }
}
