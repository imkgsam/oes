import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../../common/errors/item-master.errors'
import { Item } from '../../domain/aggregates/item.aggregate'
import { ItemRepository } from '../../domain/repositories/item.repository'
import { ChangeItemStatusCommand } from './change-item-status.command'

/** ChangeItemStatusHandler switches the minimal lifecycle summary and keeps same-status transitions as no-ops. */
@Injectable()
@CommandHandler(ChangeItemStatusCommand)
export class ChangeItemStatusHandler implements ICommandHandler<ChangeItemStatusCommand, Item> {
  constructor(
    @Inject(TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository
  ) {}

  async execute(command: ChangeItemStatusCommand): Promise<Item> {
    assertRequired(command.tenantId, 'tenantId')
    assertRequired(command.itemId, 'itemId')

    const item = await this.itemRepository.findById(command.tenantId, command.itemId)
    if (!item) {
      throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
        itemId: command.itemId
      })
    }

    if (item.status === command.targetStatus) {
      return item
    }

    item.changeStatus(command.targetStatus)
    return this.itemRepository.save(item)
  }
}

/** assertRequired rejects missing status transition coordinates. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}
