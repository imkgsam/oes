import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../../common/errors/item-master.errors'
import { SupplierItemMapping, SupplierItemMappingRepository } from '../../domain/repositories/supplier-item-mapping.repository'
import { ItemRepository } from '../../domain/repositories/item.repository'
import { UpsertSupplierItemMappingCommand } from './upsert-supplier-item-mapping.command'

/** UpsertSupplierItemMappingHandler keeps supplier code or name aliases mapped to one item without procurement fields. */
@Injectable()
@CommandHandler(UpsertSupplierItemMappingCommand)
export class UpsertSupplierItemMappingHandler
  implements ICommandHandler<UpsertSupplierItemMappingCommand, SupplierItemMapping>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_ITEM_MAPPING_REPOSITORY)
    private readonly supplierItemMappingRepository: SupplierItemMappingRepository,
    @Inject(TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository
  ) {}

  async execute(command: UpsertSupplierItemMappingCommand): Promise<SupplierItemMapping> {
    assertRequired(command.tenantId, 'tenantId')
    assertRequired(command.supplierId, 'supplierId')
    assertRequired(command.itemId, 'itemId')
    assertHasCodeOrName(command.supplierItemCode, command.supplierItemName)

    const item = await this.itemRepository.findById(command.tenantId, command.itemId)
    if (!item) {
      throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
        itemId: command.itemId
      })
    }

    return this.supplierItemMappingRepository.upsert({
      tenantId: command.tenantId,
      supplierId: command.supplierId,
      supplierItemCode: command.supplierItemCode,
      supplierItemName: command.supplierItemName,
      itemId: command.itemId
    })
  }
}

/** assertRequired rejects missing supplier mapping coordinates. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}

/** assertHasCodeOrName preserves the frozen code-or-name minimum input contract. */
function assertHasCodeOrName(code?: string, name?: string): void {
  if ((!code || code.trim().length === 0) && (!name || name.trim().length === 0)) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
      reason: 'supplier_item_code or supplier_item_name is required'
    })
  }
}
