import { randomUUID } from 'node:crypto'
import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  FINANCE_ALREADY_EXISTS
} from '../../common/errors/finance.errors'
import {
  ReceivableScheduleRecord,
  ReceivableScheduleStatus,
  ReceivableScheduleLineStatus,
  normalizeMoneyAmount
} from '../../domain/models/finance-records'
import { FinanceRepository } from '../../domain/repositories/finance.repository'
import {
  assertOptionalDateString,
  assertRequiredString
} from '../support/finance-assertions'
import {
  CreateReceivableScheduleFromSalesOrderCommand,
  SetFinanceReleaseSignalCommand
} from './receivable-management.commands'

/** CreateReceivableScheduleFromSalesOrderHandler materializes one finance-owned receivable plan from established sales facts. */
@CommandHandler(CreateReceivableScheduleFromSalesOrderCommand)
export class CreateReceivableScheduleFromSalesOrderHandler
  implements ICommandHandler<CreateReceivableScheduleFromSalesOrderCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: CreateReceivableScheduleFromSalesOrderCommand): Promise<ReceivableScheduleRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.salesOrderId, 'salesOrderId')
    assertRequiredString(command.payload.customerTenantPartyId, 'customerTenantPartyId')
    assertRequiredString(command.payload.customerSnapshot, 'customerSnapshot')
    assertRequiredString(command.payload.currencyCode, 'currencyCode')

    const existing = await this.repository.findOpenReceivableScheduleBySalesOrderId(
      command.payload.tenantId,
      command.payload.salesOrderId
    )
    if (existing) {
      throw ExceptionFactory.application(FINANCE_ALREADY_EXISTS, {
        resource: 'receivableSchedule',
        salesOrderId: command.payload.salesOrderId
      })
    }

    const now = new Date().toISOString()
    const id = randomUUID()
    const scheduleNo = await this.repository.nextReceivableScheduleNo(command.payload.tenantId)
    let totalScheduledAmount = '0.00'

    const lines = command.payload.lines.map((line, index) => {
      assertRequiredString(line.dueDate, 'lines.dueDate')
      assertOptionalDateString(`${line.dueDate}T00:00:00.000Z`, 'lines.dueDate')
      assertRequiredString(line.scheduledAmount, 'lines.scheduledAmount')
      const normalizedAmount = normalizeMoneyAmount(line.scheduledAmount)
      totalScheduledAmount = addMoneyAmount(totalScheduledAmount, normalizedAmount)
      return {
        id: randomUUID(),
        tenantId: command.payload.tenantId,
        receivableScheduleId: id,
        lineNo: index + 1,
        dueDate: line.dueDate,
        scheduledAmount: normalizedAmount,
        allocatedAmount: '0.00',
        outstandingAmount: normalizedAmount,
        status: ReceivableScheduleLineStatus.OPEN,
        sourceSalesOrderLineId: line.sourceSalesOrderLineId ?? null,
        memo: line.memo ?? null,
        createdAt: now,
        updatedAt: now
      }
    })

    const record: ReceivableScheduleRecord = {
      id,
      scheduleNo,
      tenantId: command.payload.tenantId,
      orgId: command.payload.orgId ?? null,
      sourceSalesOrderId: command.payload.salesOrderId,
      customerTenantPartyId: command.payload.customerTenantPartyId,
      customerSnapshot: command.payload.customerSnapshot,
      currencyCode: command.payload.currencyCode,
      status: ReceivableScheduleStatus.OPEN,
      totalScheduledAmount,
      totalAllocatedAmount: '0.00',
      outstandingAmount: totalScheduledAmount,
      salesExchangeRateSnapshot: command.payload.salesExchangeRateSnapshot ?? null,
      createdAt: now,
      updatedAt: now,
      lines
    }

    await this.repository.saveReceivableSchedule(record)
    return record
  }
}

/** SetFinanceReleaseSignalHandler writes the finance-owned release signal without transferring sales gate ownership. */
@CommandHandler(SetFinanceReleaseSignalCommand)
export class SetFinanceReleaseSignalHandler
  implements ICommandHandler<SetFinanceReleaseSignalCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: SetFinanceReleaseSignalCommand) {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.salesOrderId, 'salesOrderId')
    assertRequiredString(command.payload.customerTenantPartyId, 'customerTenantPartyId')
    assertRequiredString(command.payload.effectiveAt, 'effectiveAt')
    assertOptionalDateString(command.payload.effectiveAt, 'effectiveAt')
    assertOptionalDateString(command.payload.expiresAt, 'expiresAt')

    const record = {
      id: randomUUID(),
      tenantId: command.payload.tenantId,
      salesOrderId: command.payload.salesOrderId,
      customerTenantPartyId: command.payload.customerTenantPartyId,
      signalStatus: command.payload.signalStatus,
      reasonCode: command.payload.reasonCode ?? null,
      reasonSummary: command.payload.reasonSummary ?? null,
      effectiveAt: command.payload.effectiveAt,
      expiresAt: command.payload.expiresAt ?? null,
      basedOnSummary: command.payload.basedOnSummary ?? null,
      updatedAt: new Date().toISOString()
    }

    await this.repository.saveFinanceReleaseSignal(record)
    return record
  }
}

function addMoneyAmount(left: string, right: string): string {
  return normalizeMoneyAmount((Number(left) + Number(right)).toFixed(2))
}
