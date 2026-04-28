import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SRM_NOT_FOUND } from '../../common/errors/srm.errors'
import { PageResult, SupplierOfferingRecord } from '../../domain/models/srm-records'
import { SupplierOfferingRepository } from '../../domain/repositories/supplier-offering.repository'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { assertRequiredString, normalizePageInput } from '../support/srm-assertions'
import { ListSupplierOfferingsBySupplierQuery } from './list-supplier-offerings-by-supplier.query'

export interface ListSupplierOfferingsBySupplierResult {
  offerings: SupplierOfferingRecord[]
  total: number
  page: number
  pageSize: number
}

/** ListSupplierOfferingsBySupplierHandler returns the current offering facts for one existing supplier profile. */
@Injectable()
@QueryHandler(ListSupplierOfferingsBySupplierQuery)
export class ListSupplierOfferingsBySupplierHandler
  implements IQueryHandler<ListSupplierOfferingsBySupplierQuery, ListSupplierOfferingsBySupplierResult>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly profileRepository: SupplierProfileRepository,
    @Inject(TOKENS.SUPPLIER_OFFERING_REPOSITORY)
    private readonly offeringRepository: SupplierOfferingRepository
  ) {}

  async execute(query: ListSupplierOfferingsBySupplierQuery): Promise<ListSupplierOfferingsBySupplierResult> {
    assertRequiredString(query.input.tenantId, 'tenantId')
    assertRequiredString(query.input.supplierId, 'supplierId')

    const supplier = await this.profileRepository.findById(query.input.tenantId, query.input.supplierId)
    if (!supplier) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'supplierProfile',
        supplierId: query.input.supplierId
      })
    }

    const { page, pageSize } = normalizePageInput(query.input.page, query.input.pageSize)
    const result: PageResult<SupplierOfferingRecord> = await this.offeringRepository.listBySupplierId(
      query.input.tenantId,
      query.input.supplierId,
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
