import { randomUUID } from 'node:crypto'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_ALREADY_EXISTS,
  ITEM_MASTER_INVALID_ARGUMENT
} from '../../common/errors/item-master.errors'
import { Item } from '../../domain/aggregates/item.aggregate'
import { ItemRepository } from '../../domain/repositories/item.repository'
import { CreateItemCommand } from './create-item.command'

/** CreateItemHandler creates tenant-scoped items while preserving code uniqueness and immutable classification. */
@Injectable()
@CommandHandler(CreateItemCommand)
export class CreateItemHandler implements ICommandHandler<CreateItemCommand, Item> {
  constructor(
    @Inject(TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository
  ) {}

  async execute(command: CreateItemCommand): Promise<Item> {
    assertRequired(command.tenantId, 'tenantId')
    assertRequired(command.itemCode, 'itemCode')
    assertRequired(command.itemName, 'itemName')

    const existing = await this.itemRepository.findByCode(command.tenantId, command.itemCode)
    if (existing) {
      throw ExceptionFactory.domain(ITEM_MASTER_ALREADY_EXISTS, {
        field: 'itemCode'
      })
    }

    const item = Item.create({
      id: randomUUID(),
      tenantId: command.tenantId,
      itemCode: command.itemCode,
      itemName: command.itemName,
      structureType: command.structureType,
      natureType: command.natureType
    })

    return this.itemRepository.save(item)
  }
}

/** assertRequired rejects blank command fields before repository access. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}
