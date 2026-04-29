import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PriceListRecord } from '../../domain/models/pricing-records'
import { PriceListRepository } from '../../domain/repositories/price-list.repository'
import {
  assertSupportedCurrency,
  buildPriceListLineRecords
} from '../support/pricing-support'
import { assertRequiredString } from '../support/sales-assertions'
import { CreatePriceListCommand } from './create-price-list.command'

/** CreatePriceListHandler creates one mutable phase 1 price list head plus optional seeded baseline lines. */
@Injectable()
@CommandHandler(CreatePriceListCommand)
export class CreatePriceListHandler implements ICommandHandler<CreatePriceListCommand, PriceListRecord> {
  constructor(
    @Inject(TOKENS.PRICE_LIST_REPOSITORY)
    private readonly repository: PriceListRepository
  ) {}

  async execute(command: CreatePriceListCommand): Promise<PriceListRecord> {
    assertRequiredString(command.input.tenantId, 'tenantId')
    assertRequiredString(command.input.priceListName, 'priceListName')
    const currencyCode = assertSupportedCurrency(command.input.currencyCode, 'currencyCode')

    const record: PriceListRecord = {
      id: randomUUID(),
      tenantId: command.input.tenantId,
      priceListName: command.input.priceListName,
      priceListType: command.input.priceListType,
      status: 'DRAFT',
      currencyCode,
      effectiveFrom: new Date(command.input.effectiveFrom).toISOString(),
      effectiveTo: command.input.effectiveTo ? new Date(command.input.effectiveTo).toISOString() : null,
      lines: buildPriceListLineRecords({
        priceListId: randomUUID(),
        currencyCode,
        lines: command.input.initialLines ?? []
      })
    }

    record.lines = buildPriceListLineRecords({
      priceListId: record.id,
      currencyCode,
      lines: command.input.initialLines ?? []
    })

    return this.repository.save(record)
  }
}
