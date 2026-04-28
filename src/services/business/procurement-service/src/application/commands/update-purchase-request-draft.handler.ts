import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseRequestRecord, PurchaseRequestStatus } from '../../domain/models/procurement-records'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port'
import { assertExists, assertPrecondition, assertRequiredString, normalizeOptionalString } from '../support/procurement-assertions'
import { materializePurchaseRequestLines, nowIso } from '../support/procurement-write-support'
import { UpdatePurchaseRequestDraftCommand } from './update-purchase-request-draft.command'

/** UpdatePurchaseRequestDraftHandler replaces the editable contents of one PR draft without changing its demand nature. */
@Injectable()
@CommandHandler(UpdatePurchaseRequestDraftCommand)
export class UpdatePurchaseRequestDraftHandler
  implements ICommandHandler<UpdatePurchaseRequestDraftCommand, PurchaseRequestRecord>
{
  constructor(
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository,
    @Inject(TOKENS.ITEM_REFERENCE_LOOKUP_PORT)
    private readonly itemLookup: ItemReferenceLookupPort
  ) {}

  async execute(command: UpdatePurchaseRequestDraftCommand): Promise<PurchaseRequestRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseRequestId, 'purchaseRequestId')

    const existing = assertExists(
      await this.purchaseRequestRepository.findById(command.payload.tenantId, command.payload.purchaseRequestId),
      'purchase_request',
      command.payload.purchaseRequestId
    )
    assertPrecondition(existing.status === PurchaseRequestStatus.DRAFT, 'only DRAFT purchase requests can be updated')

    const lines = await materializePurchaseRequestLines(
      command.payload.tenantId,
      command.payload.lines,
      this.itemLookup
    )

    return this.purchaseRequestRepository.save({
      ...existing,
      title: normalizeOptionalString(command.payload.title) ?? null,
      reason: normalizeOptionalString(command.payload.reason) ?? null,
      updatedAt: nowIso(),
      lines
    })
  }
}
