import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  CRM_ALREADY_EXISTS,
  CRM_FAILED_PRECONDITION,
  CRM_NOT_FOUND
} from '../../common/errors/crm.errors'
import {
  CustomerAccountRecord,
  CustomerPartyBindingStatus
} from '../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository'
import { TenantPartyLookupPort } from '../ports/tenant-party-lookup.port'
import { assertRequiredString } from '../support/crm-assertions'
import { BindCustomerAccountToTenantPartyCommand } from './bind-customer-account-to-tenant-party.command'

/** BindCustomerAccountToTenantPartyHandler enforces the phase 1 single-active-primary-binding invariant. */
@Injectable()
@CommandHandler(BindCustomerAccountToTenantPartyCommand)
export class BindCustomerAccountToTenantPartyHandler
  implements ICommandHandler<BindCustomerAccountToTenantPartyCommand, CustomerAccountRecord>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CustomerAccountRepository,
    @Inject(TOKENS.TENANT_PARTY_LOOKUP_PORT)
    private readonly tenantPartyLookup: TenantPartyLookupPort
  ) {}

  async execute(command: BindCustomerAccountToTenantPartyCommand): Promise<CustomerAccountRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.customerAccountId, 'customerAccountId')
    assertRequiredString(command.tenantPartyId, 'tenantPartyId')

    const account = await this.accountRepository.findById(command.tenantId, command.customerAccountId)
    if (!account) {
      throw ExceptionFactory.application(CRM_NOT_FOUND, {
        resource: 'customerAccount',
        customerAccountId: command.customerAccountId
      })
    }

    const tenantParty = await this.tenantPartyLookup.getTenantPartyById(command.tenantId, command.tenantPartyId)
    if (!tenantParty) {
      throw ExceptionFactory.application(CRM_NOT_FOUND, {
        resource: 'tenantParty',
        tenantPartyId: command.tenantPartyId
      })
    }

    if (tenantParty.status.trim().toUpperCase() !== 'ACTIVE') {
      throw ExceptionFactory.application(CRM_FAILED_PRECONDITION, {
        reason: 'tenantParty is not bindable',
        tenantPartyId: command.tenantPartyId,
        tenantPartyStatus: tenantParty.status
      })
    }

    if (account.primaryBinding?.tenantPartyId === command.tenantPartyId) {
      return account
    }

    if (account.primaryBinding) {
      throw ExceptionFactory.application(CRM_FAILED_PRECONDITION, {
        reason: 'customer account already has a different active primary binding',
        customerAccountId: account.id
      })
    }

    const conflict = await this.accountRepository.findActiveByTenantPartyId(command.tenantId, command.tenantPartyId)
    if (conflict && conflict.id !== account.id) {
      throw ExceptionFactory.application(CRM_ALREADY_EXISTS, {
        reason: 'tenantParty is already bound to another active customer account',
        tenantPartyId: command.tenantPartyId,
        customerAccountId: conflict.id
      })
    }

    account.primaryBinding = {
      customerPartyBindingId: randomUUID(),
      customerAccountId: account.id,
      tenantId: account.tenantId,
      tenantPartyId: command.tenantPartyId,
      bindingStatus: CustomerPartyBindingStatus.ACTIVE_PRIMARY,
      partyDisplayName: tenantParty.partyDisplayName ?? null
    }

    return this.accountRepository.save(account)
  }
}
