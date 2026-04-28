import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { CRM_NOT_FOUND } from '../../common/errors/crm.errors'
import { CustomerContactRecord } from '../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository'
import { CustomerContactRepository } from '../../domain/repositories/customer-contact.repository'
import { assertRequiredString, normalizeOptionalString } from '../support/crm-assertions'
import { UpsertCustomerContactCommand } from './upsert-customer-contact.command'

/** UpsertCustomerContactHandler persists CRM business-contact records without turning them into Party truth. */
@Injectable()
@CommandHandler(UpsertCustomerContactCommand)
export class UpsertCustomerContactHandler
  implements ICommandHandler<UpsertCustomerContactCommand, CustomerContactRecord>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CustomerAccountRepository,
    @Inject(TOKENS.CUSTOMER_CONTACT_REPOSITORY)
    private readonly contactRepository: CustomerContactRepository
  ) {}

  async execute(command: UpsertCustomerContactCommand): Promise<CustomerContactRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.customerAccountId, 'customerAccountId')
    assertRequiredString(command.displayName, 'displayName')

    const account = await this.accountRepository.findById(command.tenantId, command.customerAccountId)
    if (!account) {
      throw ExceptionFactory.application(CRM_NOT_FOUND, {
        resource: 'customerAccount',
        customerAccountId: command.customerAccountId
      })
    }

    if (command.customerContactId) {
      const existing = await this.contactRepository.findById(
        command.tenantId,
        command.customerAccountId,
        command.customerContactId
      )
      if (!existing) {
        throw ExceptionFactory.application(CRM_NOT_FOUND, {
          resource: 'customerContact',
          customerContactId: command.customerContactId
        })
      }

      existing.displayName = command.displayName.trim()
      existing.roleTitle = normalizeOptionalString(command.roleTitle) ?? null
      existing.email = normalizeOptionalString(command.email) ?? null
      existing.phone = normalizeOptionalString(command.phone) ?? null
      existing.isPrimaryContact = command.isPrimaryContact ?? existing.isPrimaryContact
      existing.isActive = command.isActive ?? existing.isActive
      return this.contactRepository.save(existing)
    }

    return this.contactRepository.save({
      customerContactId: randomUUID(),
      tenantId: command.tenantId,
      customerAccountId: account.id,
      displayName: command.displayName.trim(),
      roleTitle: normalizeOptionalString(command.roleTitle) ?? null,
      email: normalizeOptionalString(command.email) ?? null,
      phone: normalizeOptionalString(command.phone) ?? null,
      isPrimaryContact: command.isPrimaryContact ?? false,
      isActive: command.isActive ?? true
    })
  }
}
