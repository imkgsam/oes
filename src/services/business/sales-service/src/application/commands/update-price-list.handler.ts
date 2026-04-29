import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { PriceListRecord } from '../../domain/models/pricing-records'
import { PriceListRepository } from '../../domain/repositories/price-list.repository'
import { assertRequiredString } from '../support/sales-assertions'
import { UpdatePriceListCommand } from './update-price-list.command'

/** UpdatePriceListHandler mutates price list header fields while preserving existing line baselines and snapshots. */
@Injectable()
@CommandHandler(UpdatePriceListCommand)
export class UpdatePriceListHandler implements ICommandHandler<UpdatePriceListCommand, PriceListRecord> {
  constructor(
    @Inject(TOKENS.PRICE_LIST_REPOSITORY)
    private readonly repository: PriceListRepository
  ) {}

  async execute(command: UpdatePriceListCommand): Promise<PriceListRecord> {
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
      priceListName: command.input.priceListName ?? record.priceListName,
      effectiveFrom: command.input.effectiveFrom
        ? new Date(command.input.effectiveFrom).toISOString()
        : record.effectiveFrom,
      effectiveTo:
        command.input.effectiveTo === undefined
          ? record.effectiveTo
          : command.input.effectiveTo
            ? new Date(command.input.effectiveTo).toISOString()
            : null
    })
  }
}
