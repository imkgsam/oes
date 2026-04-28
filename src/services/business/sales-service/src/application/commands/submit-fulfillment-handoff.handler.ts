import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  SALES_FAILED_PRECONDITION,
  SALES_NOT_FOUND
} from '../../common/errors/sales.errors'
import {
  SalesFulfillmentHandoffStatus,
  SalesOrderRecord
} from '../../domain/models/sales-records'
import { SalesOrderRepository } from '../../domain/repositories/sales-order.repository'
import { assertRequiredString } from '../support/sales-assertions'
import { SubmitFulfillmentHandoffCommand } from './submit-fulfillment-handoff.command'

/** SubmitFulfillmentHandoffHandler records sales-side handoff submission without changing any physical release truth. */
@Injectable()
@CommandHandler(SubmitFulfillmentHandoffCommand)
export class SubmitFulfillmentHandoffHandler
  implements ICommandHandler<SubmitFulfillmentHandoffCommand, SalesOrderRecord>
{
  constructor(
    @Inject(TOKENS.SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: SalesOrderRepository
  ) {}

  async execute(command: SubmitFulfillmentHandoffCommand): Promise<SalesOrderRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.salesOrderId, 'salesOrderId')

    const order = await this.salesOrderRepository.findById(command.tenantId, command.salesOrderId)
    if (!order) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        salesOrderId: command.salesOrderId
      })
    }

    if (!order.commercialGateSummary.orderEstablished) {
      throw ExceptionFactory.application(SALES_FAILED_PRECONDITION, {
        reason: 'sales order is not established'
      })
    }

    return this.salesOrderRepository.save({
      ...order,
      fulfillmentHandoffStatus: {
        status: SalesFulfillmentHandoffStatus.SUBMITTED,
        submittedAt: new Date().toISOString()
      }
    })
  }
}
