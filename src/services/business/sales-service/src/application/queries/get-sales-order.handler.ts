import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { SalesOrderRecord } from '../../domain/models/sales-records'
import { SalesOrderRepository } from '../../domain/repositories/sales-order.repository'
import { assertRequiredString } from '../support/sales-assertions'
import { GetSalesOrderQuery } from './get-sales-order.query'

/** GetSalesOrderHandler returns one established sales order or NOT_FOUND when the target is absent. */
@Injectable()
@QueryHandler(GetSalesOrderQuery)
export class GetSalesOrderHandler implements IQueryHandler<GetSalesOrderQuery, SalesOrderRecord> {
  constructor(
    @Inject(TOKENS.SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: SalesOrderRepository
  ) {}

  async execute(query: GetSalesOrderQuery): Promise<SalesOrderRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.salesOrderId, 'salesOrderId')

    const order = await this.salesOrderRepository.findById(query.tenantId, query.salesOrderId)
    if (!order) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        salesOrderId: query.salesOrderId
      })
    }

    return order
  }
}
