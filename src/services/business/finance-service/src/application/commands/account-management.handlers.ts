import { randomUUID } from 'node:crypto'
import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  FINANCE_FAILED_PRECONDITION,
  FINANCE_NOT_FOUND
} from '../../common/errors/finance.errors'
import {
  AccountTransactionAllocationStatus,
  AccountTransactionDirection,
  AccountTransactionSourceType,
  AccountTransactionStatus,
  CustomerFinancialAccountVerifiedStatus,
  FinancialAccountRecord,
  FinancialAccountStatus,
  SupplierFinancialAccountVerifiedStatus,
  addMoneyAmount,
  cloneRecord,
  compareMoneyAmount,
  maskAccountIdentifier,
  normalizeMoneyAmount,
  normalizeRateValue
} from '../../domain/models/finance-records'
import { FinanceRepository } from '../../domain/repositories/finance.repository'
import {
  assertOptionalDateString,
  assertRequiredString
} from '../support/finance-assertions'
import {
  CreateFinancialAccountCommand,
  ImportAccountTransactionsCommand,
  RecordAccountTransactionCommand,
  RegisterCustomerFinancialAccountCommand,
  RegisterSupplierFinancialAccountCommand,
  SetExchangeRateCommand,
  UpdateFinancialAccountBasicsCommand
} from './account-management.commands'

/** hydrateAccountWithBalance enriches one stored financial account with the computed balance required by phase 1A reads. */
async function hydrateAccountWithBalance(
  repository: FinanceRepository,
  record: FinancialAccountRecord
): Promise<FinancialAccountRecord & { currentBalance: string }> {
  return {
    ...cloneRecord(record),
    currentBalance: await repository.getCalculatedAccountBalance(record.tenantId, record.id)
  }
}

/** buildImportFingerprint constructs the stable de-duplication key for imported or manual real account transactions. */
function buildImportFingerprint(input: {
  financialAccountId: string
  direction: string
  amount: string
  currencyCode: string
  transactionTime: string
  valueDate?: string | null
  externalReference?: string | null
}): string {
  return [
    input.financialAccountId,
    input.direction,
    normalizeMoneyAmount(input.amount),
    input.currencyCode,
    input.transactionTime,
    input.valueDate ?? '',
    input.externalReference ?? ''
  ].join('|')
}

/** CreateFinancialAccountHandler creates one finance-owned company fund account plus its optional opening-balance snapshot. */
@CommandHandler(CreateFinancialAccountCommand)
export class CreateFinancialAccountHandler
  implements ICommandHandler<CreateFinancialAccountCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(
    command: CreateFinancialAccountCommand
  ): Promise<FinancialAccountRecord & { currentBalance: string }> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.accountName, 'accountName')
    assertRequiredString(command.payload.currencyCode, 'currencyCode')
    assertRequiredString(command.payload.accountIdentifier, 'accountIdentifier')

    const now = new Date().toISOString()
    const id = randomUUID()
    const accountNo = await this.repository.nextFinancialAccountNo(command.payload.tenantId)
    const record: FinancialAccountRecord = {
      id,
      accountNo,
      tenantId: command.payload.tenantId,
      orgId: command.payload.orgId ?? null,
      accountType: command.payload.accountType as never,
      accountName: command.payload.accountName.trim(),
      currencyCode: command.payload.currencyCode.trim(),
      institutionName: command.payload.institutionName?.trim() || null,
      accountIdentifierMasked: maskAccountIdentifier(command.payload.accountIdentifier),
      status: FinancialAccountStatus.ACTIVE,
      lastTransactionAt: null,
      createdAt: now,
      updatedAt: now
    }

    await this.repository.saveFinancialAccount(record)

    if (command.payload.openingBalance != null && command.payload.openingBalance !== '') {
      const snapshotAt = command.payload.openingBalanceAsOf ?? now
      assertOptionalDateString(snapshotAt, 'openingBalanceAsOf')
      await this.repository.saveBalanceSnapshot({
        id: randomUUID(),
        tenantId: record.tenantId,
        financialAccountId: record.id,
        snapshotBalance: normalizeMoneyAmount(command.payload.openingBalance),
        snapshotAt,
        createdAt: now
      })
    }

    return hydrateAccountWithBalance(this.repository, record)
  }
}

/** UpdateFinancialAccountBasicsHandler updates mutable account basics without rewriting historical transactions. */
@CommandHandler(UpdateFinancialAccountBasicsCommand)
export class UpdateFinancialAccountBasicsHandler
  implements ICommandHandler<UpdateFinancialAccountBasicsCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(
    command: UpdateFinancialAccountBasicsCommand
  ): Promise<FinancialAccountRecord & { currentBalance: string }> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.financialAccountId, 'financialAccountId')
    assertRequiredString(command.payload.accountName, 'accountName')

    const existing = await this.repository.findFinancialAccountById(
      command.payload.tenantId,
      command.payload.financialAccountId
    )

    if (!existing) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'financialAccount'
      })
    }

    const updated: FinancialAccountRecord = {
      ...existing,
      accountName: command.payload.accountName.trim(),
      institutionName: command.payload.institutionName?.trim() || null,
      accountIdentifierMasked: command.payload.accountIdentifier
        ? maskAccountIdentifier(command.payload.accountIdentifier)
        : existing.accountIdentifierMasked,
      status: command.payload.status as never,
      updatedAt: new Date().toISOString()
    }

    await this.repository.saveFinancialAccount(updated)
    return hydrateAccountWithBalance(this.repository, updated)
  }
}

/** ImportAccountTransactionsHandler ingests one batch of real account transactions and records source plus row-level outcomes. */
@CommandHandler(ImportAccountTransactionsCommand)
export class ImportAccountTransactionsHandler
  implements ICommandHandler<ImportAccountTransactionsCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: ImportAccountTransactionsCommand): Promise<{
    batch: {
      id: string
      totalRows: number
      acceptedCount: number
      duplicateCount: number
      failedCount: number
      sourceType: string
      sourceBatchReference?: string | null
      fileAssetId?: string | null
      attachmentRef?: string | null
    }
    accountTransactionIds: string[]
  }> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.financialAccountId, 'financialAccountId')
    assertRequiredString(command.payload.importedBy, 'importedBy')

    const account = await this.repository.findFinancialAccountById(
      command.payload.tenantId,
      command.payload.financialAccountId
    )

    if (!account) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'financialAccount'
      })
    }

    if (account.status === FinancialAccountStatus.CLOSED) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'closed account cannot accept imported transactions'
      })
    }

    const now = new Date().toISOString()
    const batchId = randomUUID()
    const acceptedIds: string[] = []
    let duplicateCount = 0
    let failedCount = 0

    await this.repository.saveImportBatch({
      id: batchId,
      tenantId: command.payload.tenantId,
      financialAccountId: command.payload.financialAccountId,
      sourceType: command.payload.sourceType,
      sourceBatchReference: command.payload.sourceBatchReference ?? null,
      fileAssetId: command.payload.fileAssetId ?? null,
      attachmentRef: command.payload.attachmentRef ?? null,
      importedBy: command.payload.importedBy,
      totalRows: command.payload.transactions.length,
      acceptedCount: 0,
      duplicateCount: 0,
      failedCount: 0,
      createdAt: now
    })

    for (const item of command.payload.transactions) {
      try {
        assertRequiredString(item.amount, 'transactions.amount')
        assertRequiredString(item.currencyCode, 'transactions.currencyCode')
        assertRequiredString(item.transactionTime, 'transactions.transactionTime')
        assertOptionalDateString(item.transactionTime, 'transactions.transactionTime')

        const fingerprint = buildImportFingerprint({
          financialAccountId: command.payload.financialAccountId,
          direction: item.direction,
          amount: item.amount,
          currencyCode: item.currencyCode,
          transactionTime: item.transactionTime,
          valueDate: item.valueDate,
          externalReference: item.externalReference
        })

        const duplicated = await this.repository.findDuplicateAccountTransaction(
          command.payload.tenantId,
          command.payload.financialAccountId,
          fingerprint
        )

        if (duplicated) {
          duplicateCount += 1
          continue
        }

        const transactionId = randomUUID()
        await this.repository.saveAccountTransaction({
          id: transactionId,
          tenantId: command.payload.tenantId,
          orgId: account.orgId ?? null,
          financialAccountId: command.payload.financialAccountId,
          importBatchId: batchId,
          direction: item.direction as AccountTransactionDirection,
          amount: normalizeMoneyAmount(item.amount),
          currencyCode: item.currencyCode.trim(),
          transactionTime: item.transactionTime,
          valueDate: item.valueDate ?? null,
          sourceType: AccountTransactionSourceType.CSV_IMPORT,
          status: AccountTransactionStatus.CONFIRMED,
          externalReference: item.externalReference?.trim() || null,
          counterpartyName: item.counterpartyName?.trim() || null,
          counterpartyAccountSnapshot: item.counterpartyAccountSnapshot?.trim() || null,
          memo: item.memo?.trim() || null,
          paymentExecutionId: null,
          allocationStatus: AccountTransactionAllocationStatus.UNALLOCATED,
          allocatedAmount: '0.00',
          unallocatedAmount: normalizeMoneyAmount(item.amount),
          fileAssetId: command.payload.fileAssetId ?? null,
          attachmentRef: command.payload.attachmentRef ?? null,
          createdAt: now,
          updatedAt: now
        })
        acceptedIds.push(transactionId)
      } catch (_error) {
        failedCount += 1
      }
    }

    const batch = {
      id: batchId,
      tenantId: command.payload.tenantId,
      financialAccountId: command.payload.financialAccountId,
      sourceType: command.payload.sourceType,
      sourceBatchReference: command.payload.sourceBatchReference ?? null,
      fileAssetId: command.payload.fileAssetId ?? null,
      attachmentRef: command.payload.attachmentRef ?? null,
      importedBy: command.payload.importedBy,
      totalRows: command.payload.transactions.length,
      acceptedCount: acceptedIds.length,
      duplicateCount,
      failedCount,
      createdAt: now
    }
    await this.repository.saveImportBatch(batch)

    return {
      batch: {
        id: batch.id,
        totalRows: batch.totalRows,
        acceptedCount: batch.acceptedCount,
        duplicateCount: batch.duplicateCount,
        failedCount: batch.failedCount,
        sourceType: batch.sourceType,
        sourceBatchReference: batch.sourceBatchReference,
        fileAssetId: batch.fileAssetId,
        attachmentRef: batch.attachmentRef
      },
      accountTransactionIds: acceptedIds
    }
  }
}

/** RecordAccountTransactionHandler records one manually entered real account transaction without conflating it with receivable plans. */
@CommandHandler(RecordAccountTransactionCommand)
export class RecordAccountTransactionHandler
  implements ICommandHandler<RecordAccountTransactionCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: RecordAccountTransactionCommand) {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.financialAccountId, 'financialAccountId')
    assertRequiredString(command.payload.amount, 'amount')
    assertRequiredString(command.payload.currencyCode, 'currencyCode')
    assertRequiredString(command.payload.transactionTime, 'transactionTime')
    assertOptionalDateString(command.payload.transactionTime, 'transactionTime')

    const account = await this.repository.findFinancialAccountById(
      command.payload.tenantId,
      command.payload.financialAccountId
    )
    if (!account) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'financialAccount'
      })
    }

    if (account.status === FinancialAccountStatus.CLOSED) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'closed account cannot accept new transactions'
      })
    }

    const record = {
      id: randomUUID(),
      tenantId: command.payload.tenantId,
      orgId: account.orgId ?? null,
      financialAccountId: command.payload.financialAccountId,
      importBatchId: null,
      direction: command.payload.direction as AccountTransactionDirection,
      amount: normalizeMoneyAmount(command.payload.amount),
      currencyCode: command.payload.currencyCode.trim(),
      transactionTime: command.payload.transactionTime,
      valueDate: command.payload.valueDate ?? null,
      sourceType: command.payload.sourceType ?? AccountTransactionSourceType.MANUAL,
      status: command.payload.status ?? AccountTransactionStatus.DRAFT,
      externalReference: command.payload.externalReference?.trim() || null,
      counterpartyName: command.payload.counterpartyName?.trim() || null,
      counterpartyAccountSnapshot: command.payload.counterpartyAccountSnapshot?.trim() || null,
      memo: command.payload.memo?.trim() || null,
      paymentExecutionId: null,
      allocationStatus: AccountTransactionAllocationStatus.UNALLOCATED,
      allocatedAmount: '0.00',
      unallocatedAmount: normalizeMoneyAmount(command.payload.amount),
      fileAssetId: command.payload.fileAssetId ?? null,
      attachmentRef: command.payload.attachmentRef ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await this.repository.saveAccountTransaction(record)
    return record
  }
}

/** RegisterCustomerFinancialAccountHandler records a customer payment account reference without taking over CRM customer truth. */
@CommandHandler(RegisterCustomerFinancialAccountCommand)
export class RegisterCustomerFinancialAccountHandler
  implements ICommandHandler<RegisterCustomerFinancialAccountCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: RegisterCustomerFinancialAccountCommand) {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.customerTenantPartyId, 'customerTenantPartyId')
    assertRequiredString(command.payload.accountHolderName, 'accountHolderName')
    assertRequiredString(command.payload.accountIdentifier, 'accountIdentifier')

    const now = new Date().toISOString()
    const record = {
      id: randomUUID(),
      tenantId: command.payload.tenantId,
      customerTenantPartyId: command.payload.customerTenantPartyId,
      accountHolderName: command.payload.accountHolderName.trim(),
      accountProviderType: command.payload.accountProviderType,
      accountIdentifierMasked: maskAccountIdentifier(command.payload.accountIdentifier),
      currencyCode: command.payload.currencyCode?.trim() || null,
      isDefault: command.payload.isDefault ?? true,
      verifiedStatus: CustomerFinancialAccountVerifiedStatus.UNVERIFIED,
      createdAt: now,
      updatedAt: now
    }

    await this.repository.saveCustomerFinancialAccount(record)
    return record
  }
}

/** RegisterSupplierFinancialAccountHandler records a supplier beneficiary account reference without taking over supplier master truth. */
@CommandHandler(RegisterSupplierFinancialAccountCommand)
export class RegisterSupplierFinancialAccountHandler
  implements ICommandHandler<RegisterSupplierFinancialAccountCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: RegisterSupplierFinancialAccountCommand) {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.supplierTenantPartyId, 'supplierTenantPartyId')
    assertRequiredString(command.payload.accountHolderName, 'accountHolderName')
    assertRequiredString(command.payload.accountIdentifier, 'accountIdentifier')

    const now = new Date().toISOString()
    const record = {
      id: randomUUID(),
      tenantId: command.payload.tenantId,
      supplierTenantPartyId: command.payload.supplierTenantPartyId,
      accountHolderName: command.payload.accountHolderName.trim(),
      accountProviderType: command.payload.accountProviderType,
      accountIdentifierMasked: maskAccountIdentifier(command.payload.accountIdentifier),
      currencyCode: command.payload.currencyCode?.trim() || null,
      isDefault: command.payload.isDefault ?? true,
      verifiedStatus: SupplierFinancialAccountVerifiedStatus.UNVERIFIED,
      createdAt: now,
      updatedAt: now
    }

    await this.repository.saveSupplierFinancialAccount(record)
    return record
  }
}

/** SetExchangeRateHandler writes finance-owned standard FX truth while keeping sales snapshots as downstream references only. */
@CommandHandler(SetExchangeRateCommand)
export class SetExchangeRateHandler implements ICommandHandler<SetExchangeRateCommand> {
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: SetExchangeRateCommand) {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.baseCurrencyCode, 'baseCurrencyCode')
    assertRequiredString(command.payload.quoteCurrencyCode, 'quoteCurrencyCode')
    assertRequiredString(command.payload.rateValue, 'rateValue')
    assertRequiredString(command.payload.setBy, 'setBy')
    assertOptionalDateString(command.payload.effectiveAt, 'effectiveAt')

    const record = {
      id: randomUUID(),
      tenantId: command.payload.tenantId,
      baseCurrencyCode: command.payload.baseCurrencyCode.trim(),
      quoteCurrencyCode: command.payload.quoteCurrencyCode.trim(),
      rateValue: normalizeRateValue(command.payload.rateValue),
      effectiveAt: command.payload.effectiveAt,
      setBy: command.payload.setBy,
      updatedAt: new Date().toISOString()
    }

    await this.repository.saveExchangeRate(record)
    return record
  }
}
