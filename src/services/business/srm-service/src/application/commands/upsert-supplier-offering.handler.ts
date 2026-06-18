import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  SRM_FAILED_PRECONDITION,
  SRM_NOT_FOUND
} from '../../common/errors/srm.errors'
import {
  SupplierOfferingRecord,
  SupplierOfferingStatus,
  SupplierStatus
} from '../../domain/models/srm-records'
import { SupplierOfferingRepository } from '../../domain/repositories/supplier-offering.repository'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { ItemLookupPort } from '../ports/item-lookup.port'
import {
  assertKnownSupplierOfferingStatus,
  assertRequiredString
} from '../support/srm-assertions'
import { UpsertSupplierOfferingCommand } from './upsert-supplier-offering.command'

/** UpsertSupplierOfferingHandler keeps exactly one current supplierId + itemId supplyability fact per tenant. */
@Injectable()
@CommandHandler(UpsertSupplierOfferingCommand)
export class UpsertSupplierOfferingHandler
  implements ICommandHandler<UpsertSupplierOfferingCommand, SupplierOfferingRecord>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly profileRepository: SupplierProfileRepository,
    @Inject(TOKENS.SUPPLIER_OFFERING_REPOSITORY)
    private readonly offeringRepository: SupplierOfferingRepository,
    @Inject(TOKENS.ITEM_LOOKUP_PORT)
    private readonly itemLookup: ItemLookupPort
  ) {}

  async execute(command: UpsertSupplierOfferingCommand): Promise<SupplierOfferingRecord> {
    assertRequiredString(command.tenantId, 'tenantId')
    assertRequiredString(command.supplierId, 'supplierId')
    assertRequiredString(command.itemId, 'itemId')
    assertKnownSupplierOfferingStatus(command.targetStatus)

    const supplier = await this.profileRepository.findById(command.tenantId, command.supplierId)
    if (!supplier) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'supplierProfile',
        supplierId: command.supplierId
      })
    }

    const item = await this.itemLookup.getItemById(command.tenantId, command.itemId)
    if (!item) {
      throw ExceptionFactory.application(SRM_NOT_FOUND, {
        resource: 'item',
        itemId: command.itemId
      })
    }

    if (command.targetStatus === SupplierOfferingStatus.ACTIVE) {
      if (supplier.status !== SupplierStatus.ACTIVE) {
        throw ExceptionFactory.application(SRM_FAILED_PRECONDITION, {
          reason: 'active offering requires active supplier',
          supplierId: supplier.id
        })
      }

      if (!item.active) {
        throw ExceptionFactory.application(SRM_FAILED_PRECONDITION, {
          reason: 'active offering requires active item',
          itemId: item.itemId
        })
      }

      if (!item.purchasable) {
        throw ExceptionFactory.application(SRM_FAILED_PRECONDITION, {
          reason: 'active offering requires purchasable item',
          itemId: item.itemId
        })
      }
    }

    let existing: SupplierOfferingRecord | null = null
    if (command.supplierOfferingId) {
      existing = await this.offeringRepository.findById(command.tenantId, command.supplierOfferingId)
      if (!existing) {
        throw ExceptionFactory.application(SRM_NOT_FOUND, {
          resource: 'supplierOffering',
          supplierOfferingId: command.supplierOfferingId
        })
      }

      if (existing.supplierId !== command.supplierId || existing.itemId !== command.itemId) {
        throw ExceptionFactory.application(SRM_FAILED_PRECONDITION, {
          reason: 'supplier offering cannot be rebound to a different supplier or item',
          supplierOfferingId: existing.supplierOfferingId
        })
      }
    } else {
      existing = await this.offeringRepository.findBySupplierAndItem(
        command.tenantId,
        command.supplierId,
        command.itemId
      )
    }

    const offering: SupplierOfferingRecord = existing ?? {
      supplierOfferingId: randomUUID(),
      tenantId: command.tenantId,
      supplierId: command.supplierId,
      itemId: command.itemId,
      itemCode: null,
      itemName: null,
      status: SupplierOfferingStatus.INACTIVE
    }

    offering.itemCode = item.itemCode
    offering.itemName = item.itemName
    offering.status = command.targetStatus
    return this.offeringRepository.save(offering)
  }
}
