import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { PriceListRecord } from '../../domain/models/pricing-records'
import { PriceListRepository } from '../../domain/repositories/price-list.repository'
import { assertRequiredString } from '../support/sales-assertions'
import { ChangePriceListStatusCommand } from './change-price-list-status.command'

/** ChangePriceListStatusHandler flips one price list between the frozen phase 1 lifecycle states. */
@Injectable()
@CommandHandler(ChangePriceListStatusCommand)
export class ChangePriceListStatusHandler
  implements ICommandHandler<ChangePriceListStatusCommand, PriceListRecord>
{
  constructor(
    @Inject(TOKENS.PRICE_LIST_REPOSITORY)
    private readonly repository: PriceListRepository
  ) {}

  async execute(command: ChangePriceListStatusCommand): Promise<PriceListRecord> {
    assertRequiredString(command.input.tenantId, 'tenantId')
    assertRequiredString(command.input.priceListId, 'priceListId')

    const record = await this.repository.findById(command.input.tenantId, command.input.priceListId)
    if (!record) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        priceListId: command.input.priceListId
      })
    }

    return this.repository.save({
      ...record,
      status: command.input.targetStatus
    })
  }
}
