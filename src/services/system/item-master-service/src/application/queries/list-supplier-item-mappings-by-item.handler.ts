import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../../common/errors/item-master.errors'
import { ItemRepository } from '../../domain/repositories/item.repository'
import {
  ListSupplierItemMappingsByItemResult,
  SupplierItemMappingRepository
} from '../../domain/repositories/supplier-item-mapping.repository'
import { ListSupplierItemMappingsByItemQuery } from './list-supplier-item-mappings-by-item.query'

/** ListSupplierItemMappingsByItemHandler validates item existence and returns one supplier mapping page. */
@Injectable()
@QueryHandler(ListSupplierItemMappingsByItemQuery)
export class ListSupplierItemMappingsByItemHandler
  implements IQueryHandler<ListSupplierItemMappingsByItemQuery, ListSupplierItemMappingsByItemResult>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_ITEM_MAPPING_REPOSITORY)
    private readonly supplierItemMappingRepository: SupplierItemMappingRepository,
    @Inject(TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository
  ) {}

  async execute(query: ListSupplierItemMappingsByItemQuery): Promise<ListSupplierItemMappingsByItemResult> {
    assertRequired(query.tenantId, 'tenantId')
    assertRequired(query.itemId, 'itemId')

    if ((query.page ?? 1) <= 0 || (query.pageSize ?? 20) <= 0) {
      throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
        reason: 'page and page_size must be positive'
      })
    }

    const item = await this.itemRepository.findById(query.tenantId, query.itemId)
    if (!item) {
      throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
        itemId: query.itemId
      })
    }

    return this.supplierItemMappingRepository.listByItem({
      tenantId: query.tenantId,
      itemId: query.itemId,
      page: query.page && query.page > 0 ? query.page : 1,
      pageSize: query.pageSize && query.pageSize > 0 ? query.pageSize : 20
    })
  }
}

/** assertRequired rejects blank list coordinates before touching repositories. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}
