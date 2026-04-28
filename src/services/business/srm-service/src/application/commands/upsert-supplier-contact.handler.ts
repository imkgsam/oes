import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SRM_NOT_FOUND } from '../../common/errors/srm.errors'
import { SupplierContactRecord } from '../../domain/models/srm-records'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { SupplierContactRepository } from '../../domain/repositories/supplier-contact.repository'
import { assertRequiredString, normalizeOptionalString } from '../support/srm-assertions'
import { UpsertSupplierContactCommand } from './upsert-supplier-contact.command'

/** UpsertSupplierContactHandler persists SRM business-contact records without turning them into Party truth. */
@Injectable()
@CommandHandler(UpsertSupplierContactCommand)
export class UpsertSupplierContactHandler
  implements ICommandHandler<UpsertSupplierContactCommand, SupplierContactRecord>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly accountRepository: SupplierProfileRepository,
    @Inject(TOKENS.SUPPLIER_CONTACT_REPOSITORY)
    private readonly contactRepository: SupplierContactRepository
  ) {}

  async execute(command: UpsertSupplierContactCommand): Promise<SupplierContactRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.supplierId, 'supplierId')
    assertRequiredString(command.displayName, 'displayName')

    const account = await this.accountRepository.findById(command.tenantId, command.supplierId)
    if (!account) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'supplierProfile',
        supplierId: command.supplierId
      })
    }

    if (command.supplierContactId) {
      const existing = await this.contactRepository.findById(
        command.tenantId,
        command.supplierId,
        command.supplierContactId
      )
      if (!existing) {
        throw ExceptionFactory.application(SRM_NOT_FOUND, {
          resource: 'supplierContact',
          supplierContactId: command.supplierContactId
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
      supplierContactId: randomUUID(),
      tenantId: command.tenantId,
      supplierId: account.id,
      displayName: command.displayName.trim(),
      roleTitle: normalizeOptionalString(command.roleTitle) ?? null,
      email: normalizeOptionalString(command.email) ?? null,
      phone: normalizeOptionalString(command.phone) ?? null,
      isPrimaryContact: command.isPrimaryContact ?? false,
      isActive: command.isActive ?? true
    })
  }
}
