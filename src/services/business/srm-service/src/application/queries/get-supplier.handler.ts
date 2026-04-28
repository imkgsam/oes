import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SRM_NOT_FOUND } from '../../common/errors/srm.errors'
import { SupplierProfileRecord } from '../../domain/models/srm-records'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { assertRequiredString } from '../support/srm-assertions'
import { GetSupplierQuery } from './get-supplier.query'

/** GetSupplierHandler loads one SRM supplier-profile shell and its active primary binding summary. */
@Injectable()
@QueryHandler(GetSupplierQuery)
export class GetSupplierHandler implements IQueryHandler<GetSupplierQuery, SupplierProfileRecord> {
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly accountRepository: SupplierProfileRepository
  ) {}

  async execute(query: GetSupplierQuery): Promise<SupplierProfileRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.supplierId, 'supplierId')

    const account = await this.accountRepository.findById(query.tenantId, query.supplierId)
    if (!account) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'supplierProfile',
        supplierId: query.supplierId
      })
    }

    return account
  }
}
