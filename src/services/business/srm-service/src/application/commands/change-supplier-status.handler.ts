import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  SRM_FAILED_PRECONDITION,
  SRM_NOT_FOUND
} from '../../common/errors/srm.errors'
import { SupplierProfileRecord, SupplierStatus } from '../../domain/models/srm-records'
import { SupplierOfferingRepository } from '../../domain/repositories/supplier-offering.repository'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { TenantPartyLookupPort } from '../ports/tenant-party-lookup.port'
import { assertKnownSupplierStatus, assertRequiredString } from '../support/srm-assertions'
import { ChangeSupplierStatusCommand } from './change-supplier-status.command'

/** ChangeSupplierStatusHandler updates only the SRM supplier status while keeping binding ownership unchanged. */
@Injectable()
@CommandHandler(ChangeSupplierStatusCommand)
export class ChangeSupplierStatusHandler
  implements ICommandHandler<ChangeSupplierStatusCommand, SupplierProfileRecord>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly profileRepository: SupplierProfileRepository,
    @Inject(TOKENS.SUPPLIER_OFFERING_REPOSITORY)
    private readonly offeringRepository: SupplierOfferingRepository,
    @Inject(TOKENS.TENANT_PARTY_LOOKUP_PORT)
    private readonly tenantPartyLookup: TenantPartyLookupPort
  ) {}

  async execute(command: ChangeSupplierStatusCommand): Promise<SupplierProfileRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.supplierId, 'supplierId')
    assertKnownSupplierStatus(command.targetStatus)

    const profile = await this.profileRepository.findById(command.tenantId, command.supplierId)
    if (!profile) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'supplierProfile',
        supplierId: command.supplierId
      })
    }

    if (profile.status === command.targetStatus) {
      return profile
    }

    if (command.targetStatus === SupplierStatus.ACTIVE) {
      if (!profile.partyBinding?.tenantPartyId) {
        throw ExceptionFactory.application(SRM_FAILED_PRECONDITION, {
          reason: 'active supplier requires tenantParty binding',
          supplierId: profile.id
        })
      }

      const tenantParty = await this.tenantPartyLookup.getTenantPartyById(
        command.tenantId,
        profile.partyBinding.tenantPartyId
      )
      if (!tenantParty || tenantParty.status.trim().toUpperCase() !== 'ACTIVE') {
        throw ExceptionFactory.application(SRM_FAILED_PRECONDITION, {
          reason: 'active supplier requires active tenantParty binding',
          supplierId: profile.id,
          tenantPartyId: profile.partyBinding.tenantPartyId
        })
      }
    }

    if (command.targetStatus === SupplierStatus.INACTIVE) {
      const hasActiveOfferings = await this.offeringRepository.hasActiveBySupplierId(
        command.tenantId,
        profile.id
      )
      if (hasActiveOfferings) {
        throw ExceptionFactory.application(SRM_FAILED_PRECONDITION, {
          reason: 'inactive supplier cannot keep active offerings',
          supplierId: profile.id
        })
      }
    }

    profile.status = command.targetStatus
    return this.profileRepository.save(profile)
  }
}
