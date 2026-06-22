import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  CRM_INVALID_ARGUMENT,
  CRM_NOT_FOUND
} from '../../common/errors/crm.errors'
import {
  CrmAccountRecord,
  CrmAccountRecordStatus
} from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import { ValidateCrmObjectReferenceQuery } from './validate-object-reference.query'

export type ValidateCrmObjectReferenceResult = {
  objectRef: {
    objectOwnerService: 'crm-service'
    objectType: 'CrmAccount'
    objectId: string
  }
  exists: boolean
  readable: boolean
  capabilityAllowed: boolean
  lifecycle: 'ACTIVE' | 'ARCHIVED' | 'DELETED_OR_UNAVAILABLE'
  displaySnapshot: {
    title: string
    subtitle?: string
    status: string
  }
  denyReason?: string
}

/** ValidateCrmObjectReferenceHandler validates CrmAccount object refs for external collaboration capabilities. */
@Injectable()
@QueryHandler(ValidateCrmObjectReferenceQuery)
export class ValidateCrmObjectReferenceHandler
  implements IQueryHandler<ValidateCrmObjectReferenceQuery, ValidateCrmObjectReferenceResult>
{
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute validates object type, tenant-owned existence, readable status, lifecycle, and capability allowance. */
  async execute(query: ValidateCrmObjectReferenceQuery): Promise<ValidateCrmObjectReferenceResult> {
    if (query.objectType !== 'CrmAccount') {
      throw ExceptionFactory.application(CRM_INVALID_ARGUMENT, { field: 'objectType' })
    }
    if (!query.objectId.trim()) {
      throw ExceptionFactory.application(CRM_INVALID_ARGUMENT, { field: 'objectId' })
    }
    const account = await this.accountRepository.findAccountById(query.tenantId, query.objectId)
    if (!account) {
      throw ExceptionFactory.application(CRM_NOT_FOUND, { resource: 'CrmAccount' })
    }

    const lifecycle = toObjectLifecycle(account)
    const capabilityAllowed =
      query.requestedCapability === 'READ' || lifecycle === 'ACTIVE'
    return {
      objectRef: {
        objectOwnerService: 'crm-service',
        objectType: 'CrmAccount',
        objectId: account.id
      },
      exists: true,
      readable: true,
      capabilityAllowed,
      lifecycle,
      displaySnapshot: {
        title: account.displayName,
        subtitle: account.tenantPartyId || account.leadDomain || undefined,
        status: account.recordStatus
      },
      denyReason: capabilityAllowed ? undefined : 'crm account is archived'
    }
  }
}

/** toObjectLifecycle maps CRM account record status to the object reference lifecycle contract. */
function toObjectLifecycle(account: CrmAccountRecord): ValidateCrmObjectReferenceResult['lifecycle'] {
  return account.recordStatus === CrmAccountRecordStatus.ARCHIVED ? 'ARCHIVED' : 'ACTIVE'
}
