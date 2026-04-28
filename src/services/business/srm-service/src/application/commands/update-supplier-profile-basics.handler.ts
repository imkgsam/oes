import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SRM_NOT_FOUND } from '../../common/errors/srm.errors'
import { SupplierProfileRecord } from '../../domain/models/srm-records'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { assertRequiredString, normalizeOptionalString, normalizeTags } from '../support/srm-assertions'
import { UpdateSupplierProfileBasicsCommand } from './update-supplier-profile-basics.command'

/** UpdateSupplierProfileBasicsHandler updates phase 1 SRM supplier-profile basics without touching status or binding. */
@Injectable()
@CommandHandler(UpdateSupplierProfileBasicsCommand)
export class UpdateSupplierProfileBasicsHandler
  implements ICommandHandler<UpdateSupplierProfileBasicsCommand, SupplierProfileRecord>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly accountRepository: SupplierProfileRepository
  ) {}

  async execute(command: UpdateSupplierProfileBasicsCommand): Promise<SupplierProfileRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.supplierId, 'supplierId')

    const existing = await this.accountRepository.findById(command.tenantId, command.supplierId)
    if (!existing) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'supplierProfile',
        supplierId: command.supplierId
      })
    }

    const displayName = normalizeOptionalString(command.displayName)
    if (displayName) {
      existing.displayName = displayName
    }

    const supplierNo = normalizeOptionalString(command.supplierNo)
    if (supplierNo) {
      existing.supplierNo = supplierNo
    }

    if (command.supplierCategory !== undefined) {
      existing.supplierCategory = normalizeOptionalString(command.supplierCategory) ?? null
    }

    if (command.tags !== undefined) {
      existing.tags = normalizeTags(command.tags)
    }

    return this.accountRepository.save(existing)
  }
}
