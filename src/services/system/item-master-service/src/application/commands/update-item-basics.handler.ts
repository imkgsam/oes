import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_ALREADY_EXISTS,
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../../common/errors/item-master.errors'
import { Item } from '../../domain/aggregates/item.aggregate'
import { ItemRepository } from '../../domain/repositories/item.repository'
import { UpdateItemBasicsCommand } from './update-item-basics.command'

/** UpdateItemBasicsHandler updates only code and name while rejecting classification mutations. */
@Injectable()
@CommandHandler(UpdateItemBasicsCommand)
export class UpdateItemBasicsHandler implements ICommandHandler<UpdateItemBasicsCommand, Item> {
  constructor(
    @Inject(TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository
  ) {}

  async execute(command: UpdateItemBasicsCommand): Promise<Item> {
    assertRequired(command.tenantId, 'tenantId')
    assertRequired(command.itemId, 'itemId')
    assertRequired(command.itemCode, 'itemCode')
    assertRequired(command.itemName, 'itemName')

    if (command.structureType !== undefined || command.natureType !== undefined) {
      throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
        reason: 'UpdateItemBasics cannot mutate structure_type or nature_type'
      })
    }

    const item = await this.itemRepository.findById(command.tenantId, command.itemId)
    if (!item) {
      throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
        itemId: command.itemId
      })
    }

    const existing = await this.itemRepository.findByCode(command.tenantId, command.itemCode)
    if (existing && existing.id !== item.id) {
      throw ExceptionFactory.domain(ITEM_MASTER_ALREADY_EXISTS, {
        field: 'itemCode'
      })
    }

    item.updateBasics({
      itemCode: command.itemCode,
      itemName: command.itemName
    })

    return this.itemRepository.save(item)
  }
}

/** assertRequired rejects blank update fields before business logic runs. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}
