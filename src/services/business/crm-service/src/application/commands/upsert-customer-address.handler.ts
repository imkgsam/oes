import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { CRM_NOT_FOUND } from '../../common/errors/crm.errors'
import { CustomerAddressRecord } from '../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository'
import { CustomerAddressRepository } from '../../domain/repositories/customer-address.repository'
import { assertRequiredString, normalizeOptionalString } from '../support/crm-assertions'
import { UpsertCustomerAddressCommand } from './upsert-customer-address.command'

/** UpsertCustomerAddressHandler persists CRM business-address records without claiming Party address truth. */
@Injectable()
@CommandHandler(UpsertCustomerAddressCommand)
export class UpsertCustomerAddressHandler
  implements ICommandHandler<UpsertCustomerAddressCommand, CustomerAddressRecord>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CustomerAccountRepository,
    @Inject(TOKENS.CUSTOMER_ADDRESS_REPOSITORY)
    private readonly addressRepository: CustomerAddressRepository
  ) {}

  async execute(command: UpsertCustomerAddressCommand): Promise<CustomerAddressRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.customerAccountId, 'customerAccountId')
    assertRequiredString(command.label, 'label')
    assertRequiredString(command.countryCode, 'countryCode')
    assertRequiredString(command.addressLine1, 'addressLine1')

    const account = await this.accountRepository.findById(command.tenantId, command.customerAccountId)
    if (!account) {
      throw ExceptionFactory.application(CRM_NOT_FOUND, {
        resource: 'customerAccount',
        customerAccountId: command.customerAccountId
      })
    }

    if (command.customerAddressId) {
      const existing = await this.addressRepository.findById(
        command.tenantId,
        command.customerAccountId,
        command.customerAddressId
      )
      if (!existing) {
        throw ExceptionFactory.application(CRM_NOT_FOUND, {
          resource: 'customerAddress',
          customerAddressId: command.customerAddressId
        })
      }

      existing.label = command.label.trim()
      existing.countryCode = command.countryCode.trim()
      existing.region = normalizeOptionalString(command.region) ?? null
      existing.locality = normalizeOptionalString(command.locality) ?? null
      existing.addressLine1 = command.addressLine1.trim()
      existing.addressLine2 = normalizeOptionalString(command.addressLine2) ?? null
      existing.postalCode = normalizeOptionalString(command.postalCode) ?? null
      existing.isPrimaryAddress = command.isPrimaryAddress ?? existing.isPrimaryAddress
      existing.isActive = command.isActive ?? existing.isActive
      return this.addressRepository.save(existing)
    }

    return this.addressRepository.save({
      customerAddressId: randomUUID(),
      tenantId: command.tenantId,
      customerAccountId: account.id,
      label: command.label.trim(),
      countryCode: command.countryCode.trim(),
      region: normalizeOptionalString(command.region) ?? null,
      locality: normalizeOptionalString(command.locality) ?? null,
      addressLine1: command.addressLine1.trim(),
      addressLine2: normalizeOptionalString(command.addressLine2) ?? null,
      postalCode: normalizeOptionalString(command.postalCode) ?? null,
      isPrimaryAddress: command.isPrimaryAddress ?? false,
      isActive: command.isActive ?? true
    })
  }
}
