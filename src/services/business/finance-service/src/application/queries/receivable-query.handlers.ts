import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { FINANCE_NOT_FOUND } from '../../common/errors/finance.errors'
import { cloneRecord } from '../../domain/models/finance-records'
import { FinanceRepository } from '../../domain/repositories/finance.repository'
import { assertRequiredString, normalizePageInput } from '../support/finance-assertions'
import {
  GetFinanceReleaseSignalQuery,
  GetReceivableScheduleQuery,
  SearchReceivableSchedulesQuery
} from './receivable-query.queries'

/** GetReceivableScheduleHandler loads one receivable plan without conflating it with actual cash movement. */
@QueryHandler(GetReceivableScheduleQuery)
export class GetReceivableScheduleHandler
  implements IQueryHandler<GetReceivableScheduleQuery>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(query: GetReceivableScheduleQuery) {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.receivableScheduleId, 'receivableScheduleId')
    const schedule = await this.repository.findReceivableScheduleById(
      query.tenantId,
      query.receivableScheduleId
    )

    if (!schedule) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'receivableSchedule'
      })
    }

    return cloneRecord(schedule)
  }
}

/** SearchReceivableSchedulesHandler lists receivable plans with finance-owned outstanding and release summary fields. */
@QueryHandler(SearchReceivableSchedulesQuery)
export class SearchReceivableSchedulesHandler
  implements IQueryHandler<SearchReceivableSchedulesQuery>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(query: SearchReceivableSchedulesQuery) {
    assertRequiredString(query.input.tenantId, 'tenantId')
    const { page, pageSize } = normalizePageInput(query.input.page, query.input.pageSize)
    const result = await this.repository.searchReceivableSchedules({
      ...query.input,
      page,
      pageSize
    })

    return {
      receivableSchedules: result.items.map((item) => cloneRecord(item)),
      total: result.total,
      page,
      pageSize
    }
  }
}

/** GetFinanceReleaseSignalHandler returns the current finance release signal published for one sales order. */
@QueryHandler(GetFinanceReleaseSignalQuery)
export class GetFinanceReleaseSignalHandler
  implements IQueryHandler<GetFinanceReleaseSignalQuery>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(query: GetFinanceReleaseSignalQuery) {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.salesOrderId, 'salesOrderId')
    const signal = await this.repository.getFinanceReleaseSignalBySalesOrderId(
      query.tenantId,
      query.salesOrderId
    )
    if (!signal) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'financeReleaseSignal'
      })
    }

    return cloneRecord(signal)
  }
}
