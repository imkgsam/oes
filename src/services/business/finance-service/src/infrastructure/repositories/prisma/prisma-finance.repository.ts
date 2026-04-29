import { Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  Prisma,
  AccountTransactionAllocationStatus as PrismaAccountTransactionAllocationStatus,
  AccountTransactionStatus as PrismaAccountTransactionStatus
} from '../../../../prisma/generated/prisma'
import {
  FINANCE_ALREADY_EXISTS,
  FINANCE_FAILED_PRECONDITION,
  FINANCE_NOT_FOUND
} from '../../../common/errors/finance.errors'
import {
  AccountTransactionAllocationStatus,
  AccountTransactionImportBatchRecord,
  AccountTransactionRecord,
  AccountTransactionSearchInput,
  AccountTransactionStatus,
  ExchangeRateRecord,
  FinanceReleaseSignalRecord,
  FinancialAccountBalanceSnapshotRecord,
  FinancialAccountRecord,
  FinancialAccountSearchInput,
  PageResult,
  PayableScheduleRecord,
  PayableScheduleSearchInput,
  PaymentAllocationRecord,
  PaymentAllocationSearchInput,
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
  normalizeMoneyAmount,
  normalizeRateValue,
  paginate,
  subtractMoneyAmount,
  SupplierFinancialAccountRecord,
  sumMoneyAmounts
} from '../../../domain/models/finance-records'
import { FinanceRepository } from '../../../domain/repositories/finance.repository'
import { PrismaService } from '../../prisma/prisma.service'

type PrismaReceivableScheduleWithLines = Prisma.ReceivableScheduleGetPayload<{
  include: {
    lines: {
      orderBy: {
        lineNo: 'asc'
      }
    }
  }
}>

type PrismaPayableScheduleWithLines = Prisma.PayableScheduleGetPayload<{
  include: {
    lines: {
      orderBy: {
        lineNo: 'asc'
      }
    }
  }
}>

type PrismaPaymentRequestWithChildren = Prisma.PaymentRequestGetPayload<{
  include: {
    lines: true
    evidenceSnapshots: true
  }
}>

/** PrismaFinanceRepository persists finance phase 1A accounts, transactions, receivables, allocations, releases, and FX truth. */
@Injectable()
export class PrismaFinanceRepository implements FinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextPayableScheduleNo(tenantId: string): Promise<string> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      const existing = await client.financeSequenceCounter.findUnique({
        where: {
          tenantId
        }
      })

      if (!existing) {
        await client.financeSequenceCounter.create({
          data: {
            tenantId,
            nextFinancialAccountNo: 1,
            nextReceivableScheduleNo: 1,
            nextPayableScheduleNo: 2,
            nextPaymentRequestNo: 1
          }
        })

        return formatDocumentNo('AP', 1)
      }

      const updated = await client.financeSequenceCounter.update({
        where: {
          tenantId
        },
        data: {
          nextPayableScheduleNo: {
            increment: 1
          }
        },
        select: {
          nextPayableScheduleNo: true
        }
      })

      return formatDocumentNo('AP', updated.nextPayableScheduleNo - 1)
    })
  }

  async nextPaymentRequestNo(tenantId: string): Promise<string> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      const existing = await client.financeSequenceCounter.findUnique({
        where: {
          tenantId
        }
      })

      if (!existing) {
        await client.financeSequenceCounter.create({
          data: {
            tenantId,
            nextFinancialAccountNo: 1,
            nextReceivableScheduleNo: 1,
            nextPayableScheduleNo: 1,
            nextPaymentRequestNo: 2
          }
        })

        return formatDocumentNo('PR', 1)
      }

      const updated = await client.financeSequenceCounter.update({
        where: {
          tenantId
        },
        data: {
          nextPaymentRequestNo: {
            increment: 1
          }
        },
        select: {
          nextPaymentRequestNo: true
        }
      })

      return formatDocumentNo('PR', updated.nextPaymentRequestNo - 1)
    })
  }

  async nextFinancialAccountNo(tenantId: string): Promise<string> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      const existing = await client.financeSequenceCounter.findUnique({
        where: {
          tenantId
        }
      })

      if (!existing) {
        await client.financeSequenceCounter.create({
          data: {
            tenantId,
            nextFinancialAccountNo: 2,
            nextReceivableScheduleNo: 1,
            nextPayableScheduleNo: 1,
            nextPaymentRequestNo: 1
          }
        })

        return formatDocumentNo('FA', 1)
      }

      const updated = await client.financeSequenceCounter.update({
        where: {
          tenantId
        },
        data: {
          nextFinancialAccountNo: {
            increment: 1
          }
        },
        select: {
          nextFinancialAccountNo: true
        }
      })

      return formatDocumentNo('FA', updated.nextFinancialAccountNo - 1)
    })
  }

  async nextReceivableScheduleNo(tenantId: string): Promise<string> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      const existing = await client.financeSequenceCounter.findUnique({
        where: {
          tenantId
        }
      })

      if (!existing) {
        await client.financeSequenceCounter.create({
          data: {
            tenantId,
            nextFinancialAccountNo: 1,
            nextReceivableScheduleNo: 2,
            nextPayableScheduleNo: 1,
            nextPaymentRequestNo: 1
          }
        })

        return formatDocumentNo('AR', 1)
      }

      const updated = await client.financeSequenceCounter.update({
        where: {
          tenantId
        },
        data: {
          nextReceivableScheduleNo: {
            increment: 1
          }
        },
        select: {
          nextReceivableScheduleNo: true
        }
      })

      return formatDocumentNo('AR', updated.nextReceivableScheduleNo - 1)
    })
  }

  async saveFinancialAccount(record: FinancialAccountRecord): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      const duplicate = await client.financialAccount.findFirst({
        where: {
          tenantId: record.tenantId,
          id: {
            not: record.id
          },
          accountName: record.accountName,
          accountIdentifierMasked: record.accountIdentifierMasked
        }
      })

      if (duplicate) {
        throw ExceptionFactory.application(FINANCE_ALREADY_EXISTS, {
          resource: 'financialAccount',
          accountName: record.accountName
        })
      }

      await client.financialAccount.upsert({
        where: {
          id: record.id
        },
        create: {
          id: record.id,
          accountNo: record.accountNo,
          tenantId: record.tenantId,
          orgId: record.orgId ?? null,
          accountType: record.accountType as never,
          accountName: record.accountName,
          currencyCode: record.currencyCode,
          institutionName: record.institutionName ?? null,
          accountIdentifierMasked: record.accountIdentifierMasked,
          status: record.status as never,
          lastTransactionAt: record.lastTransactionAt ? new Date(record.lastTransactionAt) : null,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt)
        },
        update: {
          accountNo: record.accountNo,
          orgId: record.orgId ?? null,
          accountType: record.accountType as never,
          accountName: record.accountName,
          currencyCode: record.currencyCode,
          institutionName: record.institutionName ?? null,
          accountIdentifierMasked: record.accountIdentifierMasked,
          status: record.status as never,
          lastTransactionAt: record.lastTransactionAt ? new Date(record.lastTransactionAt) : null,
          updatedAt: new Date(record.updatedAt)
        }
      })
    })
  }

  async findFinancialAccountById(
    tenantId: string,
    financialAccountId: string
  ): Promise<FinancialAccountRecord | null> {
    const record = await this.prisma.getExecutionClient().financialAccount.findFirst({
      where: {
        tenantId,
        id: financialAccountId
      }
    })

    return record ? toFinancialAccountRecord(record) : null
  }

  async searchFinancialAccounts(
    input: FinancialAccountSearchInput
  ): Promise<PageResult<FinancialAccountRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where: Prisma.FinancialAccountWhereInput = {
      tenantId: input.tenantId,
      orgId: input.orgId,
      accountType: input.accountType as never,
      currencyCode: input.currencyCode,
      status: input.status as never,
      OR: input.keyword
        ? [
            {
              accountNo: {
                contains: input.keyword,
                mode: 'insensitive'
              }
            },
            {
              accountName: {
                contains: input.keyword,
                mode: 'insensitive'
              }
            },
            {
              institutionName: {
                contains: input.keyword,
                mode: 'insensitive'
              }
            }
          ]
        : undefined
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().financialAccount.count({ where }),
      this.prisma.getExecutionClient().financialAccount.findMany({
        where,
        orderBy: {
          accountNo: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => toFinancialAccountRecord(item)),
      total,
      page,
      pageSize
    }
  }

  async saveBalanceSnapshot(record: FinancialAccountBalanceSnapshotRecord): Promise<void> {
    await this.prisma.getExecutionClient().financialAccountBalanceSnapshot.upsert({
      where: {
        id: record.id
      },
      create: {
        id: record.id,
        tenantId: record.tenantId,
        financialAccountId: record.financialAccountId,
        snapshotBalance: new Prisma.Decimal(record.snapshotBalance),
        snapshotAt: new Date(record.snapshotAt),
        createdAt: new Date(record.createdAt)
      },
      update: {
        snapshotBalance: new Prisma.Decimal(record.snapshotBalance),
        snapshotAt: new Date(record.snapshotAt)
      }
    })
  }

  async getLatestBalanceSnapshot(
    tenantId: string,
    financialAccountId: string
  ): Promise<FinancialAccountBalanceSnapshotRecord | null> {
    const found = await this.prisma.getExecutionClient().financialAccountBalanceSnapshot.findFirst({
      where: {
        tenantId,
        financialAccountId
      },
      orderBy: {
        snapshotAt: 'desc'
      }
    })

    return found
      ? {
          id: found.id,
          tenantId: found.tenantId,
          financialAccountId: found.financialAccountId,
          snapshotBalance: normalizeMoneyAmount(found.snapshotBalance.toString()),
          snapshotAt: found.snapshotAt.toISOString(),
          createdAt: found.createdAt.toISOString()
        }
      : null
  }

  async getCalculatedAccountBalance(tenantId: string, financialAccountId: string): Promise<string> {
    const snapshot = await this.getLatestBalanceSnapshot(tenantId, financialAccountId)
    let balance = snapshot ? normalizeMoneyAmount(snapshot.snapshotBalance) : '0.00'
    const transactions = await this.prisma.getExecutionClient().accountTransaction.findMany({
      where: {
        tenantId,
        financialAccountId,
        status: PrismaAccountTransactionStatus.CONFIRMED,
        transactionTime: snapshot
          ? {
              gte: new Date(snapshot.snapshotAt)
            }
          : undefined
      },
      orderBy: {
        transactionTime: 'asc'
      }
    })

    for (const transaction of transactions) {
      balance =
        transaction.direction === 'INFLOW'
          ? addMoneyAmount(balance, normalizeMoneyAmount(transaction.amount.toString()))
          : subtractMoneyAmount(balance, normalizeMoneyAmount(transaction.amount.toString()))
    }

    return normalizeMoneyAmount(balance)
  }

  async saveAccountTransaction(record: AccountTransactionRecord): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      const existing = await client.accountTransaction.findUnique({
        where: {
          id: record.id
        }
      })

      if (existing) {
        const isProtected =
          existing.status === PrismaAccountTransactionStatus.CONFIRMED &&
          existing.allocationStatus !== PrismaAccountTransactionAllocationStatus.UNALLOCATED
        if (
          isProtected &&
          (existing.financialAccountId !== record.financialAccountId ||
            existing.direction !== record.direction ||
            existing.currencyCode !== record.currencyCode ||
            compareMoneyAmount(existing.amount.toString(), record.amount) !== 0)
        ) {
          throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
            reason: 'confirmed allocated transaction cannot change key fields'
          })
        }
      }

      const dedupeKey = buildDedupeKey(record)
      await client.accountTransaction.upsert({
        where: {
          id: record.id
        },
        create: {
          id: record.id,
          tenantId: record.tenantId,
          orgId: record.orgId ?? null,
          financialAccountId: record.financialAccountId,
          importBatchId: record.importBatchId ?? null,
          direction: record.direction as never,
          amount: new Prisma.Decimal(record.amount),
          currencyCode: record.currencyCode,
          transactionTime: new Date(record.transactionTime),
          valueDate: record.valueDate ?? null,
          sourceType: record.sourceType as never,
          status: record.status as never,
          externalReference: record.externalReference ?? null,
          counterpartyName: record.counterpartyName ?? null,
          counterpartyAccountSnapshot: record.counterpartyAccountSnapshot ?? null,
          memo: record.memo ?? null,
          paymentExecutionId: record.paymentExecutionId ?? null,
          allocationStatus: record.allocationStatus as never,
          allocatedAmount: new Prisma.Decimal(record.allocatedAmount),
          unallocatedAmount: new Prisma.Decimal(record.unallocatedAmount),
          fileAssetId: record.fileAssetId ?? null,
          attachmentRef: record.attachmentRef ?? null,
          dedupeKey,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt)
        },
        update: {
          orgId: record.orgId ?? null,
          financialAccountId: record.financialAccountId,
          importBatchId: record.importBatchId ?? null,
          direction: record.direction as never,
          amount: new Prisma.Decimal(record.amount),
          currencyCode: record.currencyCode,
          transactionTime: new Date(record.transactionTime),
          valueDate: record.valueDate ?? null,
          sourceType: record.sourceType as never,
          status: record.status as never,
          externalReference: record.externalReference ?? null,
          counterpartyName: record.counterpartyName ?? null,
          counterpartyAccountSnapshot: record.counterpartyAccountSnapshot ?? null,
          memo: record.memo ?? null,
          paymentExecutionId: record.paymentExecutionId ?? null,
          allocationStatus: record.allocationStatus as never,
          allocatedAmount: new Prisma.Decimal(record.allocatedAmount),
          unallocatedAmount: new Prisma.Decimal(record.unallocatedAmount),
          fileAssetId: record.fileAssetId ?? null,
          attachmentRef: record.attachmentRef ?? null,
          dedupeKey,
          updatedAt: new Date(record.updatedAt)
        }
      })

      const account = await client.financialAccount.findUnique({
        where: {
          id: record.financialAccountId
        }
      })
      if (account) {
        const currentLast = account.lastTransactionAt?.toISOString()
        const nextLast =
          !currentLast || record.transactionTime > currentLast ? record.transactionTime : currentLast
        await client.financialAccount.update({
          where: {
            id: record.financialAccountId
          },
          data: {
            lastTransactionAt: nextLast ? new Date(nextLast) : null
          }
        })
      }
    })
  }

  async findAccountTransactionById(
    tenantId: string,
    accountTransactionId: string
  ): Promise<AccountTransactionRecord | null> {
    const found = await this.prisma.getExecutionClient().accountTransaction.findFirst({
      where: {
        tenantId,
        id: accountTransactionId
      }
    })

    return found ? toAccountTransactionRecord(found) : null
  }

  async findDuplicateAccountTransaction(
    tenantId: string,
    financialAccountId: string,
    fingerprint: string
  ): Promise<AccountTransactionRecord | null> {
    const found = await this.prisma.getExecutionClient().accountTransaction.findFirst({
      where: {
        tenantId,
        financialAccountId,
        dedupeKey: fingerprint
      }
    })

    return found ? toAccountTransactionRecord(found) : null
  }

  async searchAccountTransactions(
    input: AccountTransactionSearchInput
  ): Promise<PageResult<AccountTransactionRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where: Prisma.AccountTransactionWhereInput = {
      tenantId: input.tenantId,
      orgId: input.orgId,
      financialAccountId: input.financialAccountId,
      direction: input.direction as never,
      sourceType: input.sourceType as never,
      allocationStatus: input.allocationStatus as never,
      externalReference: input.externalReference,
      transactionTime:
        input.occurredFrom || input.occurredTo
          ? {
              gte: input.occurredFrom ? new Date(input.occurredFrom) : undefined,
              lte: input.occurredTo ? new Date(input.occurredTo) : undefined
            }
          : undefined
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().accountTransaction.count({ where }),
      this.prisma.getExecutionClient().accountTransaction.findMany({
        where,
        orderBy: {
          transactionTime: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => toAccountTransactionRecord(item)),
      total,
      page,
      pageSize
    }
  }

  async saveImportBatch(record: AccountTransactionImportBatchRecord): Promise<void> {
    await this.prisma.getExecutionClient().accountTransactionImportBatch.upsert({
      where: {
        id: record.id
      },
      create: {
        id: record.id,
        tenantId: record.tenantId,
        financialAccountId: record.financialAccountId,
        sourceType: record.sourceType,
        sourceBatchReference: record.sourceBatchReference ?? null,
        fileAssetId: record.fileAssetId ?? null,
        attachmentRef: record.attachmentRef ?? null,
        importedBy: record.importedBy,
        totalRows: record.totalRows,
        acceptedCount: record.acceptedCount,
        duplicateCount: record.duplicateCount,
        failedCount: record.failedCount,
        createdAt: new Date(record.createdAt)
      },
      update: {
        sourceType: record.sourceType,
        sourceBatchReference: record.sourceBatchReference ?? null,
        fileAssetId: record.fileAssetId ?? null,
        attachmentRef: record.attachmentRef ?? null,
        importedBy: record.importedBy,
        totalRows: record.totalRows,
        acceptedCount: record.acceptedCount,
        duplicateCount: record.duplicateCount,
        failedCount: record.failedCount
      }
    })
  }

  async saveCustomerFinancialAccount(record: CustomerFinancialAccountRecord): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      if (record.isDefault) {
        await client.customerFinancialAccount.updateMany({
          where: {
            tenantId: record.tenantId,
            customerTenantPartyId: record.customerTenantPartyId,
            id: {
              not: record.id
            }
          },
          data: {
            isDefault: false
          }
        })
      }

      await client.customerFinancialAccount.upsert({
        where: {
          id: record.id
        },
        create: {
          id: record.id,
          tenantId: record.tenantId,
          customerTenantPartyId: record.customerTenantPartyId,
          accountHolderName: record.accountHolderName,
          accountProviderType: record.accountProviderType,
          accountIdentifierMasked: record.accountIdentifierMasked,
          currencyCode: record.currencyCode ?? null,
          isDefault: record.isDefault,
          verifiedStatus: record.verifiedStatus as never,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt)
        },
        update: {
          accountHolderName: record.accountHolderName,
          accountProviderType: record.accountProviderType,
          accountIdentifierMasked: record.accountIdentifierMasked,
          currencyCode: record.currencyCode ?? null,
          isDefault: record.isDefault,
          verifiedStatus: record.verifiedStatus as never,
          updatedAt: new Date(record.updatedAt)
        }
      })
    })
  }

  async saveSupplierFinancialAccount(record: SupplierFinancialAccountRecord): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      if (record.isDefault) {
        await client.supplierFinancialAccount.updateMany({
          where: {
            tenantId: record.tenantId,
            supplierTenantPartyId: record.supplierTenantPartyId,
            id: {
              not: record.id
            }
          },
          data: {
            isDefault: false
          }
        })
      }

      await client.supplierFinancialAccount.upsert({
        where: {
          id: record.id
        },
        create: {
          id: record.id,
          tenantId: record.tenantId,
          supplierTenantPartyId: record.supplierTenantPartyId,
          accountHolderName: record.accountHolderName,
          accountProviderType: record.accountProviderType,
          accountIdentifierMasked: record.accountIdentifierMasked,
          currencyCode: record.currencyCode ?? null,
          isDefault: record.isDefault,
          verifiedStatus: record.verifiedStatus,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt)
        },
        update: {
          accountHolderName: record.accountHolderName,
          accountProviderType: record.accountProviderType,
          accountIdentifierMasked: record.accountIdentifierMasked,
          currencyCode: record.currencyCode ?? null,
          isDefault: record.isDefault,
          verifiedStatus: record.verifiedStatus,
          updatedAt: new Date(record.updatedAt)
        }
      })
    })
  }

  async findSupplierFinancialAccountById(
    tenantId: string,
    supplierFinancialAccountId: string
  ): Promise<SupplierFinancialAccountRecord | null> {
    const found = await this.prisma.getExecutionClient().supplierFinancialAccount.findFirst({
      where: {
        tenantId,
        id: supplierFinancialAccountId
      }
    })

    return found
      ? {
          id: found.id,
          tenantId: found.tenantId,
          supplierTenantPartyId: found.supplierTenantPartyId,
          accountHolderName: found.accountHolderName,
          accountProviderType: found.accountProviderType as SupplierFinancialAccountRecord['accountProviderType'],
          accountIdentifierMasked: found.accountIdentifierMasked,
          currencyCode: found.currencyCode ?? null,
          isDefault: found.isDefault,
          verifiedStatus: found.verifiedStatus as SupplierFinancialAccountRecord['verifiedStatus'],
          createdAt: found.createdAt.toISOString(),
          updatedAt: found.updatedAt.toISOString()
        }
      : null
  }

  async saveExchangeRate(record: ExchangeRateRecord): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.exchangeRate.deleteMany({
        where: {
          tenantId: record.tenantId,
          baseCurrencyCode: record.baseCurrencyCode,
          quoteCurrencyCode: record.quoteCurrencyCode,
          effectiveAt: new Date(record.effectiveAt)
        }
      })

      await client.exchangeRate.create({
        data: {
          id: record.id,
          tenantId: record.tenantId,
          baseCurrencyCode: record.baseCurrencyCode,
          quoteCurrencyCode: record.quoteCurrencyCode,
          rateValue: new Prisma.Decimal(record.rateValue),
          effectiveAt: new Date(record.effectiveAt),
          setBy: record.setBy,
          updatedAt: new Date(record.updatedAt)
        }
      })
    })
  }

  async getExchangeRate(input: {
    tenantId: string
    baseCurrencyCode: string
    quoteCurrencyCode: string
    effectiveAt?: string
  }): Promise<ExchangeRateRecord | null> {
    const found = await this.prisma.getExecutionClient().exchangeRate.findFirst({
      where: {
        tenantId: input.tenantId,
        baseCurrencyCode: input.baseCurrencyCode,
        quoteCurrencyCode: input.quoteCurrencyCode,
        effectiveAt: input.effectiveAt
          ? {
              lte: new Date(input.effectiveAt)
            }
          : undefined
      },
      orderBy: {
        effectiveAt: 'desc'
      }
    })

    return found ? toExchangeRateRecord(found) : null
  }

  async saveReceivableSchedule(record: ReceivableScheduleRecord): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.receivableSchedule.upsert({
        where: {
          id: record.id
        },
        create: {
          id: record.id,
          scheduleNo: record.scheduleNo,
          tenantId: record.tenantId,
          orgId: record.orgId ?? null,
          sourceSalesOrderId: record.sourceSalesOrderId,
          customerTenantPartyId: record.customerTenantPartyId,
          customerSnapshot: record.customerSnapshot,
          currencyCode: record.currencyCode,
          status: record.status as never,
          totalScheduledAmount: new Prisma.Decimal(record.totalScheduledAmount),
          totalAllocatedAmount: new Prisma.Decimal(record.totalAllocatedAmount),
          outstandingAmount: new Prisma.Decimal(record.outstandingAmount),
          salesExchangeRateSnapshot: record.salesExchangeRateSnapshot ?? null,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt)
        },
        update: {
          scheduleNo: record.scheduleNo,
          orgId: record.orgId ?? null,
          sourceSalesOrderId: record.sourceSalesOrderId,
          customerTenantPartyId: record.customerTenantPartyId,
          customerSnapshot: record.customerSnapshot,
          currencyCode: record.currencyCode,
          status: record.status as never,
          totalScheduledAmount: new Prisma.Decimal(record.totalScheduledAmount),
          totalAllocatedAmount: new Prisma.Decimal(record.totalAllocatedAmount),
          outstandingAmount: new Prisma.Decimal(record.outstandingAmount),
          salesExchangeRateSnapshot: record.salesExchangeRateSnapshot ?? null,
          updatedAt: new Date(record.updatedAt)
        }
      })

      await client.receivableScheduleLine.deleteMany({
        where: {
          receivableScheduleId: record.id
        }
      })

      if (record.lines.length > 0) {
        await client.receivableScheduleLine.createMany({
          data: record.lines.map((line) => ({
            id: line.id,
            tenantId: line.tenantId,
            receivableScheduleId: line.receivableScheduleId,
            lineNo: line.lineNo,
            dueDate: line.dueDate,
            scheduledAmount: new Prisma.Decimal(line.scheduledAmount),
            allocatedAmount: new Prisma.Decimal(line.allocatedAmount),
            outstandingAmount: new Prisma.Decimal(line.outstandingAmount),
            status: line.status as never,
            sourceSalesOrderLineId: line.sourceSalesOrderLineId ?? null,
            memo: line.memo ?? null,
            createdAt: new Date(line.createdAt),
            updatedAt: new Date(line.updatedAt)
          }))
        })
      }
    })
  }

  async findReceivableScheduleById(
    tenantId: string,
    receivableScheduleId: string
  ): Promise<ReceivableScheduleRecord | null> {
    const found = await this.prisma.getExecutionClient().receivableSchedule.findFirst({
      where: {
        tenantId,
        id: receivableScheduleId
      },
      include: {
        lines: {
          orderBy: {
            lineNo: 'asc'
          }
        }
      }
    })

    return found ? toReceivableScheduleRecord(found) : null
  }

  async findOpenReceivableScheduleBySalesOrderId(
    tenantId: string,
    salesOrderId: string
  ): Promise<ReceivableScheduleRecord | null> {
    const found = await this.prisma.getExecutionClient().receivableSchedule.findFirst({
      where: {
        tenantId,
        sourceSalesOrderId: salesOrderId,
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        lines: {
          orderBy: {
            lineNo: 'asc'
          }
        }
      }
    })

    return found ? toReceivableScheduleRecord(found) : null
  }

  async searchReceivableSchedules(
    input: ReceivableScheduleSearchInput
  ): Promise<PageResult<ReceivableScheduleRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where: Prisma.ReceivableScheduleWhereInput = {
      tenantId: input.tenantId,
      orgId: input.orgId,
      customerTenantPartyId: input.customerTenantPartyId,
      sourceSalesOrderId: input.sourceSalesOrderId,
      status: input.status as never,
      OR: input.keyword
        ? [
            {
              scheduleNo: {
                contains: input.keyword,
                mode: 'insensitive'
              }
            },
            {
              sourceSalesOrderId: {
                contains: input.keyword,
                mode: 'insensitive'
              }
            },
            {
              customerSnapshot: {
                contains: input.keyword,
                mode: 'insensitive'
              }
            }
          ]
        : undefined
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().receivableSchedule.count({ where }),
      this.prisma.getExecutionClient().receivableSchedule.findMany({
        where,
        include: {
          lines: {
            orderBy: {
              lineNo: 'asc'
            }
          }
        },
        orderBy: {
          scheduleNo: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => toReceivableScheduleRecord(item)),
      total,
      page,
      pageSize
    }
  }

  async savePayableSchedule(record: PayableScheduleRecord): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      const existing = await client.payableSchedule.findFirst({
        where: {
          id: record.id
        },
        include: {
          lines: true
        }
      })

      if (existing) {
        for (const nextLine of record.lines) {
          const previousLine = existing.lines.find((line) => line.id === nextLine.id)
          if (!previousLine) {
            continue
          }

          const protectedHistoryExists =
            compareMoneyAmount(previousLine.executedAmount.toString(), '0.00') > 0 ||
            compareMoneyAmount(previousLine.allocatedAmount.toString(), '0.00') > 0
          if (
            protectedHistoryExists &&
            (compareMoneyAmount(previousLine.scheduledAmount.toString(), nextLine.scheduledAmount) !== 0 ||
              previousLine.sourceRef !== nextLine.sourceRef)
          ) {
            throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
              reason: 'paid or allocated payable history cannot be silently rewritten'
            })
          }
        }
      }

      await client.payableSchedule.upsert({
        where: {
          id: record.id
        },
        create: {
          id: record.id,
          scheduleNo: record.scheduleNo,
          tenantId: record.tenantId,
          orgId: record.orgId ?? null,
          sourceType: record.sourceType,
          sourcePurchaseOrderId: record.sourcePurchaseOrderId,
          sourcePurchaseOrderNo: record.sourcePurchaseOrderNo ?? null,
          procurementSnapshotReference: record.procurementSnapshotReference ?? null,
          supplierTenantPartyId: record.supplierTenantPartyId,
          supplierSnapshot: record.supplierSnapshot,
          currencyCode: record.currencyCode,
          status: record.status,
          totalScheduledAmount: new Prisma.Decimal(record.totalScheduledAmount),
          totalRequestedAmount: new Prisma.Decimal(record.totalRequestedAmount),
          totalExecutedAmount: new Prisma.Decimal(record.totalExecutedAmount),
          totalAllocatedAmount: new Prisma.Decimal(record.totalAllocatedAmount),
          outstandingAmount: new Prisma.Decimal(record.outstandingAmount),
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt)
        },
        update: {
          scheduleNo: record.scheduleNo,
          orgId: record.orgId ?? null,
          sourceType: record.sourceType,
          sourcePurchaseOrderId: record.sourcePurchaseOrderId,
          sourcePurchaseOrderNo: record.sourcePurchaseOrderNo ?? null,
          procurementSnapshotReference: record.procurementSnapshotReference ?? null,
          supplierTenantPartyId: record.supplierTenantPartyId,
          supplierSnapshot: record.supplierSnapshot,
          currencyCode: record.currencyCode,
          status: record.status,
          totalScheduledAmount: new Prisma.Decimal(record.totalScheduledAmount),
          totalRequestedAmount: new Prisma.Decimal(record.totalRequestedAmount),
          totalExecutedAmount: new Prisma.Decimal(record.totalExecutedAmount),
          totalAllocatedAmount: new Prisma.Decimal(record.totalAllocatedAmount),
          outstandingAmount: new Prisma.Decimal(record.outstandingAmount),
          updatedAt: new Date(record.updatedAt)
        }
      })

      await client.payableScheduleLine.deleteMany({
        where: {
          payableScheduleId: record.id
        }
      })

      if (record.lines.length > 0) {
        await client.payableScheduleLine.createMany({
          data: record.lines.map((line) => ({
            id: line.id,
            tenantId: line.tenantId,
            payableScheduleId: line.payableScheduleId,
            lineNo: line.lineNo,
            lineType: line.lineType,
            sourceRef: line.sourceRef,
            dueDate: line.dueDate,
            scheduledAmount: new Prisma.Decimal(line.scheduledAmount),
            requestedAmount: new Prisma.Decimal(line.requestedAmount),
            executedAmount: new Prisma.Decimal(line.executedAmount),
            allocatedAmount: new Prisma.Decimal(line.allocatedAmount),
            outstandingAmount: new Prisma.Decimal(line.outstandingAmount),
            status: line.status,
            requestGovernanceStatus: line.requestGovernanceStatus,
            sourcePurchaseOrderLineId: line.sourcePurchaseOrderLineId ?? null,
            supersedesSourceRef: line.supersedesSourceRef ?? null,
            memo: line.memo ?? null,
            createdAt: new Date(line.createdAt),
            updatedAt: new Date(line.updatedAt)
          }))
        })
      }
    })
  }

  async findPayableScheduleById(
    tenantId: string,
    payableScheduleId: string
  ): Promise<PayableScheduleRecord | null> {
    const found = await this.prisma.getExecutionClient().payableSchedule.findFirst({
      where: {
        tenantId,
        id: payableScheduleId
      },
      include: {
        lines: {
          orderBy: {
            lineNo: 'asc'
          }
        }
      }
    })

    return found ? toPayableScheduleRecord(found) : null
  }

  async findActivePayableScheduleByPurchaseOrderId(
    tenantId: string,
    purchaseOrderId: string
  ): Promise<PayableScheduleRecord | null> {
    const found = await this.prisma.getExecutionClient().payableSchedule.findFirst({
      where: {
        tenantId,
        sourcePurchaseOrderId: purchaseOrderId,
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        lines: {
          orderBy: {
            lineNo: 'asc'
          }
        }
      }
    })

    return found ? toPayableScheduleRecord(found) : null
  }

  async searchPayableSchedules(
    input: PayableScheduleSearchInput
  ): Promise<PageResult<PayableScheduleRecord>> {
    const all = await this.prisma.getExecutionClient().payableSchedule.findMany({
      where: {
        tenantId: input.tenantId,
        orgId: input.orgId,
        supplierTenantPartyId: input.supplierTenantPartyId,
        sourcePurchaseOrderId: input.sourcePurchaseOrderId,
        status: input.status,
        OR: input.keyword
          ? [
              {
                scheduleNo: {
                  contains: input.keyword,
                  mode: 'insensitive'
                }
              },
              {
                sourcePurchaseOrderNo: {
                  contains: input.keyword,
                  mode: 'insensitive'
                }
              },
              {
                supplierSnapshot: {
                  contains: input.keyword,
                  mode: 'insensitive'
                }
              }
            ]
          : undefined
      },
      include: {
        lines: {
          orderBy: {
            lineNo: 'asc'
          }
        }
      },
      orderBy: {
        scheduleNo: 'asc'
      }
    })

    const filtered = all
      .map((item) => toPayableScheduleRecord(item))
      .filter((schedule) => {
        if (!input.requestGovernanceStatus) {
          return true
        }

        return (
          computePayableScheduleGovernanceSummary(schedule.lines) === input.requestGovernanceStatus
        )
      })
      .filter((schedule) => !input.overdueOnly || schedule.lines.some((line) => line.status === 'OVERDUE'))
      .filter((schedule) => !input.dueFrom || schedule.lines.some((line) => line.dueDate >= input.dueFrom!))
      .filter((schedule) => !input.dueTo || schedule.lines.some((line) => line.dueDate <= input.dueTo!))

    const { pageItems, total } = paginate(filtered, input.page ?? 1, input.pageSize ?? 20)
    return {
      items: pageItems,
      total,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20
    }
  }

  async savePaymentRequest(record: PaymentRequestRecord): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.paymentRequest.upsert({
        where: {
          id: record.id
        },
        create: {
          id: record.id,
          requestNo: record.requestNo,
          tenantId: record.tenantId,
          orgId: record.orgId ?? null,
          requestSource: record.requestSource,
          sourcePurchaseOrderId: record.sourcePurchaseOrderId ?? null,
          supplierTenantPartyId: record.supplierTenantPartyId,
          supplierSnapshot: record.supplierSnapshot,
          beneficiarySupplierFinancialAccountId: record.beneficiarySupplierFinancialAccountId,
          currencyCode: record.currencyCode,
          requestedAmount: new Prisma.Decimal(record.requestedAmount),
          status: record.status,
          reason: record.reason ?? null,
          requestedAt: new Date(record.requestedAt),
          updatedAt: new Date(record.updatedAt)
        },
        update: {
          requestNo: record.requestNo,
          orgId: record.orgId ?? null,
          requestSource: record.requestSource,
          sourcePurchaseOrderId: record.sourcePurchaseOrderId ?? null,
          supplierTenantPartyId: record.supplierTenantPartyId,
          supplierSnapshot: record.supplierSnapshot,
          beneficiarySupplierFinancialAccountId: record.beneficiarySupplierFinancialAccountId,
          currencyCode: record.currencyCode,
          requestedAmount: new Prisma.Decimal(record.requestedAmount),
          status: record.status,
          reason: record.reason ?? null,
          requestedAt: new Date(record.requestedAt),
          updatedAt: new Date(record.updatedAt)
        }
      })

      await client.paymentRequestLine.deleteMany({
        where: {
          paymentRequestId: record.id
        }
      })
      await client.supplierBillEvidenceSnapshot.deleteMany({
        where: {
          paymentRequestId: record.id
        }
      })

      if (record.lines.length > 0) {
        await client.paymentRequestLine.createMany({
          data: record.lines.map((line) => ({
            id: line.id,
            tenantId: line.tenantId,
            paymentRequestId: line.paymentRequestId,
            payableScheduleId: line.payableScheduleId,
            payableScheduleLineId: line.payableScheduleLineId,
            scheduleDueDate: line.scheduleDueDate,
            requestedAmount: new Prisma.Decimal(line.requestedAmount),
            executedAmount: new Prisma.Decimal(line.executedAmount),
            isEarlyRequest: line.isEarlyRequest,
            lineStatus: line.lineStatus,
            createdAt: new Date(line.createdAt),
            updatedAt: new Date(line.updatedAt)
          }))
        })
      }

      if (record.evidenceSnapshots.length > 0) {
        await client.supplierBillEvidenceSnapshot.createMany({
          data: record.evidenceSnapshots.map((snapshot) => ({
            id: snapshot.id,
            tenantId: snapshot.tenantId,
            paymentRequestId: snapshot.paymentRequestId,
            evidenceType: snapshot.evidenceType,
            externalDocumentNo: snapshot.externalDocumentNo ?? null,
            documentDate: snapshot.documentDate ?? null,
            currencyCode: snapshot.currencyCode ?? null,
            documentAmount: snapshot.documentAmount
              ? new Prisma.Decimal(snapshot.documentAmount)
              : null,
            attachmentRef: snapshot.attachmentRef ?? null,
            note: snapshot.note ?? null,
            capturedAt: new Date(snapshot.capturedAt)
          }))
        })
      }
    })
  }

  async findPaymentRequestById(
    tenantId: string,
    paymentRequestId: string
  ): Promise<PaymentRequestRecord | null> {
    const found = await this.prisma.getExecutionClient().paymentRequest.findFirst({
      where: {
        tenantId,
        id: paymentRequestId
      },
      include: {
        lines: true,
        evidenceSnapshots: true
      }
    })

    return found ? toPaymentRequestRecord(found) : null
  }

  async searchPaymentRequests(
    input: PaymentRequestSearchInput
  ): Promise<PageResult<PaymentRequestRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where: Prisma.PaymentRequestWhereInput = {
      tenantId: input.tenantId,
      orgId: input.orgId,
      requestSource: input.requestSource,
      supplierTenantPartyId: input.supplierTenantPartyId,
      sourcePurchaseOrderId: input.sourcePurchaseOrderId,
      status: input.status,
      beneficiarySupplierFinancialAccountId: input.beneficiarySupplierFinancialAccountId,
      requestedAt: input.requestedFrom || input.requestedTo
        ? {
            gte: input.requestedFrom ? new Date(input.requestedFrom) : undefined,
            lte: input.requestedTo ? new Date(input.requestedTo) : undefined
          }
        : undefined
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().paymentRequest.count({ where }),
      this.prisma.getExecutionClient().paymentRequest.findMany({
        where,
        include: {
          lines: true,
          evidenceSnapshots: true
        },
        orderBy: {
          requestedAt: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => toPaymentRequestRecord(item)),
      total,
      page,
      pageSize
    }
  }

  async savePaymentExecution(record: PaymentExecutionRecord): Promise<void> {
    await this.prisma.getExecutionClient().paymentExecution.upsert({
      where: {
        id: record.id
      },
      create: {
        id: record.id,
        tenantId: record.tenantId,
        orgId: record.orgId ?? null,
        paymentRequestId: record.paymentRequestId,
        supplierTenantPartyId: record.supplierTenantPartyId,
        sourceFinancialAccountId: record.sourceFinancialAccountId,
        beneficiarySupplierFinancialAccountId: record.beneficiarySupplierFinancialAccountId ?? null,
        beneficiaryAccountSnapshot: record.beneficiaryAccountSnapshot ?? null,
        executedAmount: new Prisma.Decimal(record.executedAmount),
        currencyCode: record.currencyCode,
        executedAt: new Date(record.executedAt),
        executionReference: record.executionReference ?? null,
        attachmentRefs: record.attachmentRefs as Prisma.InputJsonValue,
        linkedAccountTransactionId: record.linkedAccountTransactionId ?? null,
        status: record.status,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt)
      },
      update: {
        orgId: record.orgId ?? null,
        paymentRequestId: record.paymentRequestId,
        supplierTenantPartyId: record.supplierTenantPartyId,
        sourceFinancialAccountId: record.sourceFinancialAccountId,
        beneficiarySupplierFinancialAccountId: record.beneficiarySupplierFinancialAccountId ?? null,
        beneficiaryAccountSnapshot: record.beneficiaryAccountSnapshot ?? null,
        executedAmount: new Prisma.Decimal(record.executedAmount),
        currencyCode: record.currencyCode,
        executedAt: new Date(record.executedAt),
        executionReference: record.executionReference ?? null,
        attachmentRefs: record.attachmentRefs as Prisma.InputJsonValue,
        linkedAccountTransactionId: record.linkedAccountTransactionId ?? null,
        status: record.status,
        updatedAt: new Date(record.updatedAt)
      }
    })
  }

  async findPaymentExecutionById(
    tenantId: string,
    paymentExecutionId: string
  ): Promise<PaymentExecutionRecord | null> {
    const found = await this.prisma.getExecutionClient().paymentExecution.findFirst({
      where: {
        tenantId,
        id: paymentExecutionId
      }
    })

    return found ? toPaymentExecutionRecord(found) : null
  }

  async searchPaymentExecutions(
    input: PaymentExecutionSearchInput
  ): Promise<PageResult<PaymentExecutionRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where: Prisma.PaymentExecutionWhereInput = {
      tenantId: input.tenantId,
      orgId: input.orgId,
      paymentRequestId: input.paymentRequestId,
      supplierTenantPartyId: input.supplierTenantPartyId,
      sourceFinancialAccountId: input.sourceFinancialAccountId,
      linkedAccountTransactionId: input.linkedAccountTransactionId,
      status: input.status,
      executedAt: input.executedFrom || input.executedTo
        ? {
            gte: input.executedFrom ? new Date(input.executedFrom) : undefined,
            lte: input.executedTo ? new Date(input.executedTo) : undefined
          }
        : undefined
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().paymentExecution.count({ where }),
      this.prisma.getExecutionClient().paymentExecution.findMany({
        where,
        orderBy: {
          executedAt: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => toPaymentExecutionRecord(item)),
      total,
      page,
      pageSize
    }
  }

  async allocateTransactionToPayable(record: PaymentAllocationRecord): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      const transaction = await client.accountTransaction.findFirst({
        where: {
          tenantId: record.tenantId,
          id: record.accountTransactionId
        }
      })

      if (!transaction) {
        throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
          resource: 'accountTransaction'
        })
      }

      if (transaction.direction !== 'OUTFLOW') {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'only outflow transactions can be allocated to payable schedules'
        })
      }

      if (transaction.status !== PrismaAccountTransactionStatus.CONFIRMED) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'only confirmed transactions can be allocated'
        })
      }

      const schedule = await client.payableSchedule.findFirst({
        where: {
          tenantId: record.tenantId,
          id: record.targetScheduleId
        },
        include: {
          lines: {
            orderBy: {
              lineNo: 'asc'
            }
          }
        }
      })

      if (!schedule) {
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

      const transactionUnallocated = normalizeMoneyAmount(transaction.unallocatedAmount.toString())
      const lineOutstanding = normalizeMoneyAmount(line.outstandingAmount.toString())
      if (compareMoneyAmount(record.allocatedAmount, transactionUnallocated) > 0) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'allocation exceeds unallocated transaction amount'
        })
      }

      if (compareMoneyAmount(record.allocatedAmount, lineOutstanding) > 0) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'allocation exceeds outstanding payable line amount'
        })
      }

      const saved = await client.paymentAllocation.create({
        data: {
          id: record.id,
          tenantId: record.tenantId,
          accountTransactionId: record.accountTransactionId,
          paymentExecutionId: record.paymentExecutionId ?? null,
          paymentRequestId: record.paymentRequestId ?? null,
          targetType: record.targetType,
          targetScheduleId: record.targetScheduleId,
          targetScheduleLineId: record.targetScheduleLineId,
          allocatedAmount: new Prisma.Decimal(record.allocatedAmount),
          currencyCode: record.currencyCode,
          allocatedAt: new Date(record.allocatedAt),
          createdAt: new Date(record.createdAt)
        }
      })

      const nextAllocatedAmount = addMoneyAmount(line.allocatedAmount.toString(), record.allocatedAmount)
      const nextOutstandingAmount = subtractMoneyAmount(line.scheduledAmount.toString(), nextAllocatedAmount)
      await client.payableScheduleLine.update({
        where: {
          id: line.id
        },
        data: {
          allocatedAmount: new Prisma.Decimal(nextAllocatedAmount),
          outstandingAmount: new Prisma.Decimal(nextOutstandingAmount),
          status: computePayableLineStatus(
            line.scheduledAmount.toString(),
            nextAllocatedAmount,
            line.dueDate,
            saved.allocatedAt.toISOString()
          ),
          requestGovernanceStatus: computePayableLineGovernanceStatus({
            storedStatus: line.requestGovernanceStatus as any,
            dueDate: line.dueDate,
            requestedAmount: line.requestedAmount.toString(),
            executedAmount: line.executedAmount.toString(),
            allocatedAmount: nextAllocatedAmount,
            lineStatus: computePayableLineStatus(
              line.scheduledAmount.toString(),
              nextAllocatedAmount,
              line.dueDate,
              saved.allocatedAt.toISOString()
            ),
            now: saved.allocatedAt.toISOString()
          }),
          updatedAt: saved.allocatedAt
        }
      })

      const refreshedSchedule = await client.payableSchedule.findFirstOrThrow({
        where: {
          id: schedule.id
        },
        include: {
          lines: true
        }
      })
      const activeLines = refreshedSchedule.lines.filter((item) => item.status !== 'CANCELLED')
      const totalAllocatedAmount = sumMoneyAmounts(activeLines.map((item) => item.allocatedAmount.toString()))
      const outstandingAmount = sumMoneyAmounts(activeLines.map((item) => item.outstandingAmount.toString()))
      await client.payableSchedule.update({
        where: {
          id: schedule.id
        },
        data: {
          totalAllocatedAmount: new Prisma.Decimal(totalAllocatedAmount),
          outstandingAmount: new Prisma.Decimal(outstandingAmount),
          status: computePayableScheduleStatus(
            refreshedSchedule.totalScheduledAmount.toString(),
            totalAllocatedAmount
          ),
          updatedAt: saved.allocatedAt
        }
      })

      const nextTransactionAllocatedAmount = addMoneyAmount(
        transaction.allocatedAmount.toString(),
        record.allocatedAmount
      )
      await client.accountTransaction.update({
        where: {
          id: transaction.id
        },
        data: {
          allocatedAmount: new Prisma.Decimal(nextTransactionAllocatedAmount),
          unallocatedAmount: new Prisma.Decimal(
            subtractMoneyAmount(transaction.amount.toString(), nextTransactionAllocatedAmount)
          ),
          allocationStatus: computeAllocationStatus(
            transaction.amount.toString(),
            nextTransactionAllocatedAmount
          ) as unknown as PrismaAccountTransactionAllocationStatus,
          updatedAt: saved.allocatedAt
        }
      })
    })
  }

  async allocateTransactionToReceivable(record: PaymentAllocationRecord): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      const transaction = await client.accountTransaction.findFirst({
        where: {
          tenantId: record.tenantId,
          id: record.accountTransactionId
        }
      })

      if (!transaction) {
        throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
          resource: 'accountTransaction'
        })
      }

      if (transaction.direction !== 'INFLOW') {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'only inflow transactions can be allocated to receivable schedules'
        })
      }

      if (transaction.status !== PrismaAccountTransactionStatus.CONFIRMED) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'only confirmed transactions can be allocated'
        })
      }

      const schedule = await client.receivableSchedule.findFirst({
        where: {
          tenantId: record.tenantId,
          id: record.targetScheduleId
        },
        include: {
          lines: {
            orderBy: {
              lineNo: 'asc'
            }
          }
        }
      })

      if (!schedule) {
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

      const transactionUnallocated = normalizeMoneyAmount(transaction.unallocatedAmount.toString())
      const lineOutstanding = normalizeMoneyAmount(line.outstandingAmount.toString())
      if (compareMoneyAmount(record.allocatedAmount, transactionUnallocated) > 0) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'allocation exceeds unallocated transaction amount'
        })
      }

      if (compareMoneyAmount(record.allocatedAmount, lineOutstanding) > 0) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'allocation exceeds outstanding receivable line amount'
        })
      }

      await client.paymentAllocation.create({
        data: {
          id: record.id,
          tenantId: record.tenantId,
          accountTransactionId: record.accountTransactionId,
          paymentExecutionId: record.paymentExecutionId ?? null,
          paymentRequestId: record.paymentRequestId ?? null,
          targetType: record.targetType,
          targetScheduleId: record.targetScheduleId,
          targetScheduleLineId: record.targetScheduleLineId,
          allocatedAmount: new Prisma.Decimal(record.allocatedAmount),
          currencyCode: record.currencyCode,
          allocatedAt: new Date(record.allocatedAt),
          createdAt: new Date(record.createdAt)
        }
      })

      const updatedLineAllocated = addMoneyAmount(
        normalizeMoneyAmount(line.allocatedAmount.toString()),
        record.allocatedAmount
      )
      const updatedLineOutstanding = subtractMoneyAmount(
        normalizeMoneyAmount(line.scheduledAmount.toString()),
        updatedLineAllocated
      )
      const updatedLineStatus = computeReceivableLineStatus(
        normalizeMoneyAmount(line.scheduledAmount.toString()),
        updatedLineAllocated
      )

      await client.receivableScheduleLine.update({
        where: {
          id: line.id
        },
        data: {
          allocatedAmount: new Prisma.Decimal(updatedLineAllocated),
          outstandingAmount: new Prisma.Decimal(updatedLineOutstanding),
          status: updatedLineStatus as never,
          updatedAt: new Date(record.allocatedAt)
        }
      })

      const refreshedLines = await client.receivableScheduleLine.findMany({
        where: {
          receivableScheduleId: schedule.id
        }
      })

      const totalAllocatedAmount = refreshedLines.reduce(
        (sum, item) => addMoneyAmount(sum, normalizeMoneyAmount(item.allocatedAmount.toString())),
        '0.00'
      )
      const totalScheduledAmount = refreshedLines.reduce(
        (sum, item) => addMoneyAmount(sum, normalizeMoneyAmount(item.scheduledAmount.toString())),
        '0.00'
      )
      const outstandingAmount = subtractMoneyAmount(totalScheduledAmount, totalAllocatedAmount)
      await client.receivableSchedule.update({
        where: {
          id: schedule.id
        },
        data: {
          totalAllocatedAmount: new Prisma.Decimal(totalAllocatedAmount),
          outstandingAmount: new Prisma.Decimal(outstandingAmount),
          status: computeReceivableScheduleStatus(totalScheduledAmount, totalAllocatedAmount) as never,
          updatedAt: new Date(record.allocatedAt)
        }
      })

      const nextAllocatedAmount = addMoneyAmount(
        normalizeMoneyAmount(transaction.allocatedAmount.toString()),
        record.allocatedAmount
      )
      const nextUnallocatedAmount = subtractMoneyAmount(
        normalizeMoneyAmount(transaction.amount.toString()),
        nextAllocatedAmount
      )
      await client.accountTransaction.update({
        where: {
          id: transaction.id
        },
        data: {
          allocatedAmount: new Prisma.Decimal(nextAllocatedAmount),
          unallocatedAmount: new Prisma.Decimal(nextUnallocatedAmount),
          allocationStatus: computeAllocationStatus(
            normalizeMoneyAmount(transaction.amount.toString()),
            nextAllocatedAmount
          ) as never,
          updatedAt: new Date(record.allocatedAt)
        }
      })
    })
  }

  async searchPaymentAllocations(
    input: PaymentAllocationSearchInput
  ): Promise<PageResult<PaymentAllocationRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where: Prisma.PaymentAllocationWhereInput = {
      tenantId: input.tenantId,
      accountTransactionId: input.accountTransactionId,
      paymentExecutionId: input.paymentExecutionId,
      targetType: input.targetType,
      targetScheduleId: input.targetScheduleId ?? input.receivableScheduleId,
      targetScheduleLineId: input.targetScheduleLineId ?? input.receivableScheduleLineId,
      allocatedAt: input.allocatedFrom || input.allocatedTo
        ? {
            gte: input.allocatedFrom ? new Date(input.allocatedFrom) : undefined,
            lte: input.allocatedTo ? new Date(input.allocatedTo) : undefined
          }
        : undefined
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().paymentAllocation.count({ where }),
      this.prisma.getExecutionClient().paymentAllocation.findMany({
        where,
        orderBy: {
          allocatedAt: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => toPaymentAllocationRecord(item)),
      total,
      page,
      pageSize
    }
  }

  async saveFinanceReleaseSignal(record: FinanceReleaseSignalRecord): Promise<void> {
    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.financeReleaseSignal.deleteMany({
        where: {
          tenantId: record.tenantId,
          salesOrderId: record.salesOrderId
        }
      })

      await client.financeReleaseSignal.create({
        data: {
          id: record.id,
          tenantId: record.tenantId,
          salesOrderId: record.salesOrderId,
          customerTenantPartyId: record.customerTenantPartyId,
          signalStatus: record.signalStatus as never,
          reasonCode: record.reasonCode ?? null,
          reasonSummary: record.reasonSummary ?? null,
          effectiveAt: new Date(record.effectiveAt),
          expiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
          basedOnSummary: record.basedOnSummary ?? null,
          updatedAt: new Date(record.updatedAt)
        }
      })
    })
  }

  async getFinanceReleaseSignalBySalesOrderId(
    tenantId: string,
    salesOrderId: string
  ): Promise<FinanceReleaseSignalRecord | null> {
    const found = await this.prisma.getExecutionClient().financeReleaseSignal.findFirst({
      where: {
        tenantId,
        salesOrderId
      },
      orderBy: {
        effectiveAt: 'desc'
      }
    })

    return found ? toFinanceReleaseSignalRecord(found) : null
  }
}

/** formatDocumentNo converts one numeric sequence into the frozen finance document summary format. */
function formatDocumentNo(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(4, '0')}`
}

/** buildDedupeKey converts one transaction record into the finance import de-duplication key. */
function buildDedupeKey(record: AccountTransactionRecord): string {
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

/** toFinancialAccountRecord converts one Prisma financial-account row into the finance phase 1A record shape. */
function toFinancialAccountRecord(row: Prisma.FinancialAccountGetPayload<Record<string, never>>): FinancialAccountRecord {
  return {
    id: row.id,
    accountNo: row.accountNo,
    tenantId: row.tenantId,
    orgId: row.orgId,
    accountType: row.accountType as never,
    accountName: row.accountName,
    currencyCode: row.currencyCode,
    institutionName: row.institutionName,
    accountIdentifierMasked: row.accountIdentifierMasked,
    status: row.status as never,
    lastTransactionAt: row.lastTransactionAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

/** toAccountTransactionRecord converts one Prisma transaction row into the real cash-movement record shape. */
function toAccountTransactionRecord(row: Prisma.AccountTransactionGetPayload<Record<string, never>>): AccountTransactionRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    financialAccountId: row.financialAccountId,
    importBatchId: row.importBatchId,
    direction: row.direction as never,
    amount: normalizeMoneyAmount(row.amount.toString()),
    currencyCode: row.currencyCode,
    transactionTime: row.transactionTime.toISOString(),
    valueDate: row.valueDate,
    sourceType: row.sourceType as never,
    status: row.status as never,
    externalReference: row.externalReference,
    counterpartyName: row.counterpartyName,
    counterpartyAccountSnapshot: row.counterpartyAccountSnapshot,
    memo: row.memo,
    paymentExecutionId: row.paymentExecutionId,
    allocationStatus: row.allocationStatus as never,
    allocatedAmount: normalizeMoneyAmount(row.allocatedAmount.toString()),
    unallocatedAmount: normalizeMoneyAmount(row.unallocatedAmount.toString()),
    fileAssetId: row.fileAssetId,
    attachmentRef: row.attachmentRef,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

/** toExchangeRateRecord converts one Prisma exchange-rate row into the finance-owned standard FX truth shape. */
function toExchangeRateRecord(row: Prisma.ExchangeRateGetPayload<Record<string, never>>): ExchangeRateRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    baseCurrencyCode: row.baseCurrencyCode,
    quoteCurrencyCode: row.quoteCurrencyCode,
    rateValue: normalizeRateValue(row.rateValue.toString()),
    effectiveAt: row.effectiveAt.toISOString(),
    setBy: row.setBy,
    updatedAt: row.updatedAt.toISOString()
  }
}

/** toReceivableScheduleRecord converts one Prisma receivable schedule graph into the phase 1A receivable plan shape. */
function toReceivableScheduleRecord(row: PrismaReceivableScheduleWithLines): ReceivableScheduleRecord {
  return {
    id: row.id,
    scheduleNo: row.scheduleNo,
    tenantId: row.tenantId,
    orgId: row.orgId,
    sourceSalesOrderId: row.sourceSalesOrderId,
    customerTenantPartyId: row.customerTenantPartyId,
    customerSnapshot: row.customerSnapshot,
    currencyCode: row.currencyCode,
    status: row.status as never,
    totalScheduledAmount: normalizeMoneyAmount(row.totalScheduledAmount.toString()),
    totalAllocatedAmount: normalizeMoneyAmount(row.totalAllocatedAmount.toString()),
    outstandingAmount: normalizeMoneyAmount(row.outstandingAmount.toString()),
    salesExchangeRateSnapshot: row.salesExchangeRateSnapshot,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lines: row.lines
      .slice()
      .sort((left, right) => left.lineNo - right.lineNo)
      .map((line) => ({
        id: line.id,
        tenantId: line.tenantId,
        receivableScheduleId: line.receivableScheduleId,
        lineNo: line.lineNo,
        dueDate: line.dueDate,
        scheduledAmount: normalizeMoneyAmount(line.scheduledAmount.toString()),
        allocatedAmount: normalizeMoneyAmount(line.allocatedAmount.toString()),
        outstandingAmount: normalizeMoneyAmount(line.outstandingAmount.toString()),
        status: line.status as never,
        sourceSalesOrderLineId: line.sourceSalesOrderLineId,
        memo: line.memo,
        createdAt: line.createdAt.toISOString(),
        updatedAt: line.updatedAt.toISOString()
      }))
  }
}

/** toPayableScheduleRecord converts one Prisma payable schedule graph into the phase 1B payable plan shape. */
function toPayableScheduleRecord(row: PrismaPayableScheduleWithLines): PayableScheduleRecord {
  return {
    id: row.id,
    scheduleNo: row.scheduleNo,
    tenantId: row.tenantId,
    orgId: row.orgId,
    sourceType: row.sourceType as 'PURCHASE_ORDER',
    sourcePurchaseOrderId: row.sourcePurchaseOrderId,
    sourcePurchaseOrderNo: row.sourcePurchaseOrderNo,
    procurementSnapshotReference: row.procurementSnapshotReference,
    supplierTenantPartyId: row.supplierTenantPartyId,
    supplierSnapshot: row.supplierSnapshot,
    currencyCode: row.currencyCode,
    status: row.status as never,
    totalScheduledAmount: normalizeMoneyAmount(row.totalScheduledAmount.toString()),
    totalRequestedAmount: normalizeMoneyAmount(row.totalRequestedAmount.toString()),
    totalExecutedAmount: normalizeMoneyAmount(row.totalExecutedAmount.toString()),
    totalAllocatedAmount: normalizeMoneyAmount(row.totalAllocatedAmount.toString()),
    outstandingAmount: normalizeMoneyAmount(row.outstandingAmount.toString()),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lines: row.lines
      .slice()
      .sort((left, right) => left.lineNo - right.lineNo)
      .map((line) => ({
        id: line.id,
        tenantId: line.tenantId,
        payableScheduleId: line.payableScheduleId,
        lineNo: line.lineNo,
        lineType: line.lineType as never,
        sourceRef: line.sourceRef,
        dueDate: line.dueDate,
        scheduledAmount: normalizeMoneyAmount(line.scheduledAmount.toString()),
        requestedAmount: normalizeMoneyAmount(line.requestedAmount.toString()),
        executedAmount: normalizeMoneyAmount(line.executedAmount.toString()),
        allocatedAmount: normalizeMoneyAmount(line.allocatedAmount.toString()),
        outstandingAmount: normalizeMoneyAmount(line.outstandingAmount.toString()),
        status: line.status as never,
        requestGovernanceStatus: line.requestGovernanceStatus as never,
        sourcePurchaseOrderLineId: line.sourcePurchaseOrderLineId,
        supersedesSourceRef: line.supersedesSourceRef,
        memo: line.memo,
        createdAt: line.createdAt.toISOString(),
        updatedAt: line.updatedAt.toISOString()
      }))
  }
}

/** toPaymentRequestRecord converts one Prisma payment-request graph into the phase 1B payment governance shape. */
function toPaymentRequestRecord(row: PrismaPaymentRequestWithChildren): PaymentRequestRecord {
  return {
    id: row.id,
    requestNo: row.requestNo,
    tenantId: row.tenantId,
    orgId: row.orgId,
    requestSource: row.requestSource as never,
    sourcePurchaseOrderId: row.sourcePurchaseOrderId,
    supplierTenantPartyId: row.supplierTenantPartyId,
    supplierSnapshot: row.supplierSnapshot,
    beneficiarySupplierFinancialAccountId: row.beneficiarySupplierFinancialAccountId,
    currencyCode: row.currencyCode,
    requestedAmount: normalizeMoneyAmount(row.requestedAmount.toString()),
    status: row.status as never,
    reason: row.reason,
    requestedAt: row.requestedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lines: row.lines.map((line) => ({
      id: line.id,
      tenantId: line.tenantId,
      paymentRequestId: line.paymentRequestId,
      payableScheduleId: line.payableScheduleId,
      payableScheduleLineId: line.payableScheduleLineId,
      scheduleDueDate: line.scheduleDueDate,
      requestedAmount: normalizeMoneyAmount(line.requestedAmount.toString()),
      executedAmount: normalizeMoneyAmount(line.executedAmount.toString()),
      isEarlyRequest: line.isEarlyRequest,
      lineStatus: line.lineStatus as never,
      createdAt: line.createdAt.toISOString(),
      updatedAt: line.updatedAt.toISOString()
    })),
    evidenceSnapshots: row.evidenceSnapshots.map((snapshot) => ({
      id: snapshot.id,
      tenantId: snapshot.tenantId,
      paymentRequestId: snapshot.paymentRequestId,
      evidenceType: snapshot.evidenceType as never,
      externalDocumentNo: snapshot.externalDocumentNo,
      documentDate: snapshot.documentDate,
      currencyCode: snapshot.currencyCode,
      documentAmount: snapshot.documentAmount
        ? normalizeMoneyAmount(snapshot.documentAmount.toString())
        : null,
      attachmentRef: snapshot.attachmentRef,
      note: snapshot.note,
      capturedAt: snapshot.capturedAt.toISOString()
    }))
  }
}

/** toPaymentExecutionRecord converts one Prisma payment-execution row into the phase 1B finance execution shape. */
function toPaymentExecutionRecord(
  row: Prisma.PaymentExecutionGetPayload<Record<string, never>>
): PaymentExecutionRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    paymentRequestId: row.paymentRequestId,
    supplierTenantPartyId: row.supplierTenantPartyId,
    sourceFinancialAccountId: row.sourceFinancialAccountId,
    beneficiarySupplierFinancialAccountId: row.beneficiarySupplierFinancialAccountId,
    beneficiaryAccountSnapshot: row.beneficiaryAccountSnapshot,
    executedAmount: normalizeMoneyAmount(row.executedAmount.toString()),
    currencyCode: row.currencyCode,
    executedAt: row.executedAt.toISOString(),
    executionReference: row.executionReference,
    attachmentRefs: Array.isArray(row.attachmentRefs)
      ? row.attachmentRefs.map((item) => String(item))
      : [],
    linkedAccountTransactionId: row.linkedAccountTransactionId,
    status: row.status as never,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

/** toPaymentAllocationRecord converts one Prisma payment-allocation row into the finance allocation fact shape. */
function toPaymentAllocationRecord(row: Prisma.PaymentAllocationGetPayload<Record<string, never>>): PaymentAllocationRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    accountTransactionId: row.accountTransactionId,
    paymentExecutionId: row.paymentExecutionId,
    paymentRequestId: row.paymentRequestId,
    targetType: row.targetType as never,
    targetScheduleId: row.targetScheduleId,
    targetScheduleLineId: row.targetScheduleLineId,
    allocatedAmount: normalizeMoneyAmount(row.allocatedAmount.toString()),
    currencyCode: row.currencyCode,
    allocatedAt: row.allocatedAt.toISOString(),
    createdAt: row.createdAt.toISOString()
  }
}

/** toFinanceReleaseSignalRecord converts one Prisma release row into the finance-owned signal shape. */
function toFinanceReleaseSignalRecord(
  row: Prisma.FinanceReleaseSignalGetPayload<Record<string, never>>
): FinanceReleaseSignalRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    salesOrderId: row.salesOrderId,
    customerTenantPartyId: row.customerTenantPartyId,
    signalStatus: row.signalStatus as never,
    reasonCode: row.reasonCode,
    reasonSummary: row.reasonSummary,
    effectiveAt: row.effectiveAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    basedOnSummary: row.basedOnSummary,
    updatedAt: row.updatedAt.toISOString()
  }
}
