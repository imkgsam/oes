import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_FAILED_PRECONDITION,
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../../common/errors/item-master.errors'
import { Item } from '../../domain/aggregates/item.aggregate'
import { ItemCompositionRepository, ItemCompositionRecord } from '../../domain/repositories/item-composition.repository'
import { ItemRepository } from '../../domain/repositories/item.repository'
import { SetItemCompositionCommand } from './set-item-composition.command'

export interface SetItemCompositionResult {
  itemId: string
  components: Item[]
}

/** SetItemCompositionHandler replaces bundle composition while rejecting non-bundle, self, and nested bundle inputs. */
@Injectable()
@CommandHandler(SetItemCompositionCommand)
export class SetItemCompositionHandler
  implements ICommandHandler<SetItemCompositionCommand, SetItemCompositionResult>
{
  constructor(
    @Inject(TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository,
    @Inject(TOKENS.ITEM_COMPOSITION_REPOSITORY)
    private readonly compositionRepository: ItemCompositionRepository
  ) {}

  async execute(command: SetItemCompositionCommand): Promise<SetItemCompositionResult> {
    assertRequired(command.tenantId, 'tenantId')
    assertRequired(command.itemId, 'itemId')

    const parent = await this.itemRepository.findById(command.tenantId, command.itemId)
    if (!parent) {
      throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
        itemId: command.itemId
      })
    }

    if (!parent.isBundle()) {
      throw ExceptionFactory.domain(ITEM_MASTER_FAILED_PRECONDITION, {
        reason: 'composition parent must be BUNDLE'
      })
    }

    assertNoDuplicates(command.componentItemIds)

    const componentItems: Item[] = []
    for (const componentItemId of command.componentItemIds) {
      if (componentItemId === command.itemId) {
        throw ExceptionFactory.domain(ITEM_MASTER_FAILED_PRECONDITION, {
          reason: 'self reference is not allowed'
        })
      }

      const component = await this.itemRepository.findById(command.tenantId, componentItemId)
      if (!component) {
        throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
          itemId: componentItemId
        })
      }

      if (component.isBundle()) {
        throw ExceptionFactory.domain(ITEM_MASTER_FAILED_PRECONDITION, {
          reason: 'nested bundle is deferred'
        })
      }

      componentItems.push(component)
    }

    const records = await this.compositionRepository.replaceForParent(
      command.tenantId,
      command.itemId,
      command.componentItemIds
    )

    return {
      itemId: command.itemId,
      components: records
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((record) => componentItems.find((item) => item.id === record.componentItemId)!)
    }
  }
}

/** assertRequired rejects missing composition coordinates. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}

/** assertNoDuplicates rejects patch-like duplicate component ids from a full replacement request. */
function assertNoDuplicates(componentItemIds: string[]): void {
  if (new Set(componentItemIds).size !== componentItemIds.length) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
      reason: 'component_item_ids must be unique'
    })
  }
}
