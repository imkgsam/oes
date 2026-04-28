import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SRM_NOT_FOUND } from '../../common/errors/srm.errors'
import { SupplierAddressRecord } from '../../domain/models/srm-records'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { SupplierAddressRepository } from '../../domain/repositories/supplier-address.repository'
import { assertRequiredString } from '../support/srm-assertions'
import { ListSupplierAddressesQuery } from './list-supplier-addresses.query'

export interface ListSupplierAddressesResult {
  addresses: SupplierAddressRecord[]
}

/** ListSupplierAddressesHandler returns SRM business-address records for one existing supplier profile. */
@Injectable()
@QueryHandler(ListSupplierAddressesQuery)
export class ListSupplierAddressesHandler
  implements IQueryHandler<ListSupplierAddressesQuery, ListSupplierAddressesResult>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly accountRepository: SupplierProfileRepository,
    @Inject(TOKENS.SUPPLIER_ADDRESS_REPOSITORY)
    private readonly addressRepository: SupplierAddressRepository
  ) {}

  async execute(query: ListSupplierAddressesQuery): Promise<ListSupplierAddressesResult> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.supplierId, 'supplierId')

    const account = await this.accountRepository.findById(query.tenantId, query.supplierId)
    if (!account) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'supplierProfile',
        supplierId: query.supplierId
      })
    }

    return {
      addresses: await this.addressRepository.listBySupplierProfileId(query.tenantId, query.supplierId)
    }
  }
}
