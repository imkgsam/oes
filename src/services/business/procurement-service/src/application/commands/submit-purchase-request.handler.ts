import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseRequestRecord, PurchaseRequestStatus } from '../../domain/models/procurement-records'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { assertExists, assertPrecondition, assertRequiredString, normalizeOptionalString } from '../support/procurement-assertions'
import { nowIso } from '../support/procurement-write-support'
import { SubmitPurchaseRequestCommand } from './submit-purchase-request.command'

/** SubmitPurchaseRequestHandler freezes one PR draft for decision without creating a procurement commitment. */
@Injectable()
@CommandHandler(SubmitPurchaseRequestCommand)
export class SubmitPurchaseRequestHandler
  implements ICommandHandler<SubmitPurchaseRequestCommand, PurchaseRequestRecord>
{
  constructor(
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository
  ) {}

  async execute(command: SubmitPurchaseRequestCommand): Promise<PurchaseRequestRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseRequestId, 'purchaseRequestId')

    const existing = assertExists(
      await this.purchaseRequestRepository.findById(command.payload.tenantId, command.payload.purchaseRequestId),
      'purchase_request',
      command.payload.purchaseRequestId
    )
    assertPrecondition(existing.status === PurchaseRequestStatus.DRAFT, 'only DRAFT purchase requests can be submitted')
    assertPrecondition(existing.lines.length > 0, 'purchase request must have at least one line before submit')

    const submittedAt = nowIso()
    return this.purchaseRequestRepository.save({
      ...existing,
      status: PurchaseRequestStatus.SUBMITTED,
      submissionComment: normalizeOptionalString(command.payload.submissionComment) ?? null,
      submittedAt,
      updatedAt: submittedAt
    })
  }
}
