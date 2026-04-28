import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { SupplierProfileRecord, SupplierStatus } from '../../domain/models/srm-records'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { assertRequiredString, normalizeOptionalString, normalizeTags } from '../support/srm-assertions'
import { CreateSupplierProfileCommand } from './create-supplier-profile.command'

/** CreateSupplierProfileHandler creates one SRM supplier-profile shell without creating or mutating Party truth. */
@Injectable()
@CommandHandler(CreateSupplierProfileCommand)
export class CreateSupplierProfileHandler implements ICommandHandler<CreateSupplierProfileCommand, SupplierProfileRecord> {
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly profileRepository: SupplierProfileRepository
  ) {}

  async execute(command: CreateSupplierProfileCommand): Promise<SupplierProfileRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.displayName, 'displayName')

    const profile: SupplierProfileRecord = {
      id: randomUUID(),
      supplierNo:
        normalizeOptionalString(command.supplierNo) ??
        (await this.profileRepository.nextSupplierProfileNo(command.tenantId)),
      tenantId: command.tenantId,
      displayName: command.displayName.trim(),
      status: SupplierStatus.INACTIVE,
      supplierCategory: normalizeOptionalString(command.supplierCategory) ?? null,
      tags: normalizeTags(command.tags),
      partyBinding: null
    }

    return this.profileRepository.save(profile)
  }
}
