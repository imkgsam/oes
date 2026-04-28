import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  SALES_FAILED_PRECONDITION,
  SALES_INVALID_ARGUMENT,
  SALES_NOT_FOUND
} from '../../common/errors/sales.errors'
import { SalesOrderRecord } from '../../domain/models/sales-records'
import { SalesOrderRepository } from '../../domain/repositories/sales-order.repository'
import { assertRequiredString } from '../support/sales-assertions'
import { SetOrderCommercialGateCommand } from './set-order-commercial-gate.command'

/** SetOrderCommercialGateHandler updates one gate flag without collapsing the three execution gates together. */
@Injectable()
@CommandHandler(SetOrderCommercialGateCommand)
export class SetOrderCommercialGateHandler
  implements ICommandHandler<SetOrderCommercialGateCommand, SalesOrderRecord>
{
  constructor(
    @Inject(TOKENS.SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: SalesOrderRepository
  ) {}

  async execute(command: SetOrderCommercialGateCommand): Promise<SalesOrderRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.salesOrderId, 'salesOrderId')
    assertGateName(command.gateName)

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

    const updated: SalesOrderRecord = {
      ...order,
      commercialGateSummary: {
        ...order.commercialGateSummary,
        productionGate:
          command.gateName === 'production_gate'
            ? command.allowed
            : order.commercialGateSummary.productionGate,
        stockingGate:
          command.gateName === 'stocking_gate'
            ? command.allowed
            : order.commercialGateSummary.stockingGate,
        shippingGate:
          command.gateName === 'shipping_gate'
            ? command.allowed
            : order.commercialGateSummary.shippingGate
      }
    }

    return this.salesOrderRepository.save(updated)
  }
}

/** assertGateName rejects any gate mutation outside the three frozen phase 1 commercial gates. */
function assertGateName(value: string): void {
  if (value !== 'production_gate' && value !== 'stocking_gate' && value !== 'shipping_gate') {
    throw ExceptionFactory.application(SALES_INVALID_ARGUMENT, {
      field: 'gateName'
    })
  }
}
