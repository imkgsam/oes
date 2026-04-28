import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SRM_NOT_FOUND } from '../../common/errors/srm.errors'
import { SupplierAddressRecord } from '../../domain/models/srm-records'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { SupplierAddressRepository } from '../../domain/repositories/supplier-address.repository'
import { assertRequiredString, normalizeOptionalString } from '../support/srm-assertions'
import { UpsertSupplierAddressCommand } from './upsert-supplier-address.command'

/** UpsertSupplierAddressHandler persists SRM business-address records without claiming Party address truth. */
@Injectable()
@CommandHandler(UpsertSupplierAddressCommand)
export class UpsertSupplierAddressHandler
  implements ICommandHandler<UpsertSupplierAddressCommand, SupplierAddressRecord>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly accountRepository: SupplierProfileRepository,
    @Inject(TOKENS.SUPPLIER_ADDRESS_REPOSITORY)
    private readonly addressRepository: SupplierAddressRepository
  ) {}

  async execute(command: UpsertSupplierAddressCommand): Promise<SupplierAddressRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.supplierId, 'supplierId')
    assertRequiredString(command.label, 'label')
    assertRequiredString(command.countryCode, 'countryCode')
    assertRequiredString(command.addressLine1, 'addressLine1')

    const account = await this.accountRepository.findById(command.tenantId, command.supplierId)
    if (!account) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'supplierProfile',
        supplierId: command.supplierId
      })
    }

    if (command.supplierAddressId) {
      const existing = await this.addressRepository.findById(
        command.tenantId,
        command.supplierId,
        command.supplierAddressId
      )
      if (!existing) {
        throw ExceptionFactory.application(SRM_NOT_FOUND, {
          resource: 'supplierAddress',
          supplierAddressId: command.supplierAddressId
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
      supplierAddressId: randomUUID(),
      tenantId: command.tenantId,
      supplierId: account.id,
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
