import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SRM_FAILED_PRECONDITION, SRM_NOT_FOUND } from '../../common/errors/srm.errors'
import { SupplierProfileRecord, SupplierStatus } from '../../domain/models/srm-records'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { assertRequiredString } from '../support/srm-assertions'
import { ResolveActiveSupplierQuery } from './resolve-active-supplier.query'

/** ResolveActiveSupplierHandler returns only an existing active supplier profile for Procurement. */
@Injectable()
@QueryHandler(ResolveActiveSupplierQuery)
export class ResolveActiveSupplierHandler implements IQueryHandler<
  ResolveActiveSupplierQuery,
  SupplierProfileRecord
> {
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly profiles: SupplierProfileRepository
  ) {}

  async execute(query: ResolveActiveSupplierQuery): Promise<SupplierProfileRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.supplierId, 'supplierId')
    const supplier = await this.profiles.findById(query.tenantId, query.supplierId)
    if (!supplier) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'supplierProfile',
        supplierId: query.supplierId
      })
    }
    if (supplier.status !== SupplierStatus.ACTIVE) {
      throw ExceptionFactory.application(SRM_FAILED_PRECONDITION, {
        resource: 'supplierProfile',
        supplierId: query.supplierId,
        requiredStatus: SupplierStatus.ACTIVE
      })
    }
    return supplier
  }
}
