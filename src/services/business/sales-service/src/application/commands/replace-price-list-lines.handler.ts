import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { PriceListRecord } from '../../domain/models/pricing-records'
import { PriceListRepository } from '../../domain/repositories/price-list.repository'
import { buildPriceListLineRecords } from '../support/pricing-support'
import { assertRequiredString } from '../support/sales-assertions'
import { ReplacePriceListLinesCommand } from './replace-price-list-lines.command'

/** ReplacePriceListLinesHandler replaces the full line collection of a price list without versioning the head. */
@Injectable()
@CommandHandler(ReplacePriceListLinesCommand)
export class ReplacePriceListLinesHandler
  implements ICommandHandler<ReplacePriceListLinesCommand, PriceListRecord>
{
  constructor(
    @Inject(TOKENS.PRICE_LIST_REPOSITORY)
    private readonly repository: PriceListRepository
  ) {}

  async execute(command: ReplacePriceListLinesCommand): Promise<PriceListRecord> {
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
      lines: buildPriceListLineRecords({
        priceListId: record.id,
        currencyCode: record.currencyCode,
        lines: command.input.lines
      })
    })
  }
}
