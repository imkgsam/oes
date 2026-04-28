import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PageResult, SupplierOfferingRecord } from '../../domain/models/srm-records'
import { SupplierOfferingRepository } from '../../domain/repositories/supplier-offering.repository'
import { assertRequiredString, normalizePageInput } from '../support/srm-assertions'
import { ListSupplierOfferingsByItemQuery } from './list-supplier-offerings-by-item.query'

export interface ListSupplierOfferingsByItemResult {
  offerings: SupplierOfferingRecord[]
  total: number
  page: number
  pageSize: number
}

/** ListSupplierOfferingsByItemHandler returns the current offering facts for one item directory view. */
@Injectable()
@QueryHandler(ListSupplierOfferingsByItemQuery)
export class ListSupplierOfferingsByItemHandler
  implements IQueryHandler<ListSupplierOfferingsByItemQuery, ListSupplierOfferingsByItemResult>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_OFFERING_REPOSITORY)
    private readonly offeringRepository: SupplierOfferingRepository
  ) {}

  async execute(query: ListSupplierOfferingsByItemQuery): Promise<ListSupplierOfferingsByItemResult> {
    assertRequiredString(query.input.tenantId, 'tenantId')
    assertRequiredString(query.input.itemId, 'itemId')

    const { page, pageSize } = normalizePageInput(query.input.page, query.input.pageSize)
    const result: PageResult<SupplierOfferingRecord> = await this.offeringRepository.listByItemId(
      query.input.tenantId,
      query.input.itemId,
      query.input.status,
      page,
      pageSize
    )

    return {
      offerings: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }
}
