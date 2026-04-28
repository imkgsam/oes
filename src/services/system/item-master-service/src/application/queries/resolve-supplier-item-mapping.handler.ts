import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../../common/errors/item-master.errors'
import { ItemRepository } from '../../domain/repositories/item.repository'
import { SupplierItemMappingRepository } from '../../domain/repositories/supplier-item-mapping.repository'
import { ResolveSupplierItemMappingQuery } from './resolve-supplier-item-mapping.query'
import {
  ResolveSupplierItemMappingResult,
  SupplierItemResolutionView
} from './supplier-item-resolution.view'

/** ResolveSupplierItemMappingHandler returns MATCHED or NO_MATCH without using exceptions for absent mappings. */
@Injectable()
@QueryHandler(ResolveSupplierItemMappingQuery)
export class ResolveSupplierItemMappingHandler
  implements IQueryHandler<ResolveSupplierItemMappingQuery, ResolveSupplierItemMappingResult>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_ITEM_MAPPING_REPOSITORY)
    private readonly supplierItemMappingRepository: SupplierItemMappingRepository,
    @Inject(TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository
  ) {}

  async execute(query: ResolveSupplierItemMappingQuery): Promise<ResolveSupplierItemMappingResult> {
    assertRequired(query.tenantId, 'tenantId')
    assertRequired(query.supplierId, 'supplierId')
    assertHasCodeOrName(query.supplierItemCode, query.supplierItemName)

    const mapping = await this.supplierItemMappingRepository.resolve({
      tenantId: query.tenantId,
      supplierId: query.supplierId,
      supplierItemCode: query.supplierItemCode,
      supplierItemName: query.supplierItemName
    })

    if (!mapping) {
      return {
        resolutionStatus: SupplierItemResolutionView.NO_MATCH
      }
    }

    const item = await this.itemRepository.findById(query.tenantId, mapping.itemId)
    if (!item) {
      throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
        itemId: mapping.itemId
      })
    }

    return {
      resolutionStatus: SupplierItemResolutionView.MATCHED,
      mapping: {
        supplierId: mapping.supplierId,
        supplierItemCode: mapping.supplierItemCode,
        supplierItemName: mapping.supplierItemName,
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName
      }
    }
  }
}

/** assertRequired rejects missing supplier mapping lookup coordinates. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}

/** assertHasCodeOrName preserves the frozen code-or-name minimum lookup contract. */
function assertHasCodeOrName(code?: string, name?: string): void {
  if ((!code || code.trim().length === 0) && (!name || name.trim().length === 0)) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
      reason: 'supplier_item_code or supplier_item_name is required'
    })
  }
}
