import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SRM_FAILED_PRECONDITION, SRM_NOT_FOUND } from '../../common/errors/srm.errors'
import {
  SupplierOfferingRecord,
  SupplierOfferingStatus,
  SupplierStatus
} from '../../domain/models/srm-records'
import { SupplierOfferingRepository } from '../../domain/repositories/supplier-offering.repository'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { assertRequiredString } from '../support/srm-assertions'
import { ResolveActiveSupplierOfferingQuery } from './resolve-active-supplier-offering.query'

/** ResolveActiveSupplierOfferingHandler enforces both offering and owning-supplier active status. */
@Injectable()
@QueryHandler(ResolveActiveSupplierOfferingQuery)
export class ResolveActiveSupplierOfferingHandler implements IQueryHandler<
  ResolveActiveSupplierOfferingQuery,
  SupplierOfferingRecord
> {
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly profiles: SupplierProfileRepository,
    @Inject(TOKENS.SUPPLIER_OFFERING_REPOSITORY)
    private readonly offerings: SupplierOfferingRepository
  ) {}

  async execute(query: ResolveActiveSupplierOfferingQuery): Promise<SupplierOfferingRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.supplierId, 'supplierId')
    assertRequiredString(query.itemId, 'itemId')
    const [supplier, offering] = await Promise.all([
      this.profiles.findById(query.tenantId, query.supplierId),
      this.offerings.findBySupplierAndItem(query.tenantId, query.supplierId, query.itemId)
    ])
    if (!supplier) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'supplierProfile',
        supplierId: query.supplierId
      })
    }
    if (!offering) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'supplierOffering',
        supplierId: query.supplierId,
        itemId: query.itemId
      })
    }
    if (
      supplier.status !== SupplierStatus.ACTIVE ||
      offering.status !== SupplierOfferingStatus.ACTIVE
    ) {
      throw ExceptionFactory.application(SRM_FAILED_PRECONDITION, {
        resource: 'supplierOffering',
        supplierId: query.supplierId,
        itemId: query.itemId,
        requiredStatus: SupplierOfferingStatus.ACTIVE
      })
    }
    return offering
  }
}
