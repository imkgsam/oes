import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  SRM_ALREADY_EXISTS,
  SRM_FAILED_PRECONDITION,
  SRM_NOT_FOUND
} from '../../common/errors/srm.errors'
import {
  SupplierProfileRecord,
  SupplierPartyBindingStatus,
  SupplierStatus
} from '../../domain/models/srm-records'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { TenantPartyLookupPort } from '../ports/tenant-party-lookup.port'
import { assertRequiredString } from '../support/srm-assertions'
import { BindSupplierToTenantPartyCommand } from './bind-supplier-to-tenant-party.command'

/** BindSupplierToTenantPartyHandler enforces the phase 1 single formal tenant-party binding invariant. */
@Injectable()
@CommandHandler(BindSupplierToTenantPartyCommand)
export class BindSupplierToTenantPartyHandler
  implements ICommandHandler<BindSupplierToTenantPartyCommand, SupplierProfileRecord>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly profileRepository: SupplierProfileRepository,
    @Inject(TOKENS.TENANT_PARTY_LOOKUP_PORT)
    private readonly tenantPartyLookup: TenantPartyLookupPort
  ) {}

  async execute(command: BindSupplierToTenantPartyCommand): Promise<SupplierProfileRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.supplierId, 'supplierId')
    assertRequiredString(command.tenantPartyId, 'tenantPartyId')

    const profile = await this.profileRepository.findById(command.tenantId, command.supplierId)
    if (!profile) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'supplierProfile',
        supplierId: command.supplierId
      })
    }

    const tenantParty = await this.tenantPartyLookup.getTenantPartyById(command.tenantId, command.tenantPartyId)
    if (!tenantParty) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'tenantParty',
        tenantPartyId: command.tenantPartyId
      })
    }

    if (profile.status === SupplierStatus.ACTIVE && tenantParty.status.trim().toUpperCase() !== 'ACTIVE') {
      throw ExceptionFactory.application(SRM_FAILED_PRECONDITION, {
        reason: 'active supplier requires active tenantParty binding',
        tenantPartyId: command.tenantPartyId,
        tenantPartyStatus: tenantParty.status
      })
    }

    if (profile.partyBinding?.tenantPartyId === command.tenantPartyId) {
      return profile
    }

    if (profile.partyBinding) {
      throw ExceptionFactory.application(SRM_FAILED_PRECONDITION, {
        reason: 'supplier profile already has a different formal binding',
        supplierId: profile.id
      })
    }

    const conflict = await this.profileRepository.findByTenantPartyId(command.tenantId, command.tenantPartyId)
    if (conflict && conflict.id !== profile.id) {
      throw ExceptionFactory.application(SRM_ALREADY_EXISTS, {
        reason: 'tenantParty is already bound to another supplier profile',
        tenantPartyId: command.tenantPartyId,
        supplierId: conflict.id
      })
    }

    profile.partyBinding = {
      supplierPartyBindingId: randomUUID(),
      supplierId: profile.id,
      tenantId: profile.tenantId,
      tenantPartyId: command.tenantPartyId,
      bindingStatus: SupplierPartyBindingStatus.ACTIVE,
      partyDisplayName: tenantParty.partyDisplayName ?? null
    }

    return this.profileRepository.save(profile)
  }
}
