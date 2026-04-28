import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SRM_NOT_FOUND } from '../../common/errors/srm.errors'
import { SupplierContactRecord } from '../../domain/models/srm-records'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { SupplierContactRepository } from '../../domain/repositories/supplier-contact.repository'
import { assertRequiredString } from '../support/srm-assertions'
import { ListSupplierContactsQuery } from './list-supplier-contacts.query'

export interface ListSupplierContactsResult {
  contacts: SupplierContactRecord[]
}

/** ListSupplierContactsHandler returns SRM business-contact records for one existing supplier profile. */
@Injectable()
@QueryHandler(ListSupplierContactsQuery)
export class ListSupplierContactsHandler
  implements IQueryHandler<ListSupplierContactsQuery, ListSupplierContactsResult>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly accountRepository: SupplierProfileRepository,
    @Inject(TOKENS.SUPPLIER_CONTACT_REPOSITORY)
    private readonly contactRepository: SupplierContactRepository
  ) {}

  async execute(query: ListSupplierContactsQuery): Promise<ListSupplierContactsResult> {
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
      contacts: await this.contactRepository.listBySupplierProfileId(query.tenantId, query.supplierId)
    }
  }
}
