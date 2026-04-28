import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { ITEM_MASTER_INVALID_ARGUMENT } from '../../common/errors/item-master.errors'
import { ItemRepository, SearchItemsResult } from '../../domain/repositories/item.repository'
import { ItemNatureType, ItemStatus, ItemStructureType } from '../../domain/value-objects/item.value-objects'
import { SearchItemsQuery } from './search-items.query'

/** SearchItemsHandler applies filter and pagination validation while preserving empty-page normal responses. */
@Injectable()
@QueryHandler(SearchItemsQuery)
export class SearchItemsHandler implements IQueryHandler<SearchItemsQuery, SearchItemsResult> {
  constructor(
    @Inject(TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository
  ) {}

  async execute(query: SearchItemsQuery): Promise<SearchItemsResult> {
    assertRequired(query.tenantId, 'tenantId')
    const page = query.page && query.page > 0 ? query.page : 1
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20

    if ((query.page ?? 1) <= 0 || (query.pageSize ?? 20) <= 0) {
      throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
        reason: 'page and page_size must be positive'
      })
    }

    return this.itemRepository.search({
      tenantId: query.tenantId,
      keyword: query.keyword?.trim() || undefined,
      structureType: toDomainStructureType(query.structureType),
      natureType: toDomainNatureType(query.natureType),
      capabilityFilters: query.capabilityFilters,
      status: toDomainStatus(query.status),
      page,
      pageSize
    })
  }
}

/** assertRequired rejects blank catalog search coordinates before repository access. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}

/** toDomainStructureType converts proto numeric enums into optional domain filters. */
function toDomainStructureType(value?: number): ItemStructureType | undefined {
  if (value === 2) {
    return ItemStructureType.BUNDLE
  }
  if (value === 1) {
    return ItemStructureType.SINGLE
  }
  return undefined
}

/** toDomainNatureType converts proto numeric enums into optional domain filters. */
function toDomainNatureType(value?: number): ItemNatureType | undefined {
  if (value === 2) {
    return ItemNatureType.VIRTUAL
  }
  if (value === 3) {
    return ItemNatureType.SERVICE
  }
  if (value === 1) {
    return ItemNatureType.PHYSICAL
  }
  return undefined
}

/** toDomainStatus converts proto numeric enums into optional domain filters. */
function toDomainStatus(value?: number): ItemStatus | undefined {
  if (value === 2) {
    return ItemStatus.INACTIVE
  }
  if (value === 1) {
    return ItemStatus.ACTIVE
  }
  return undefined
}
