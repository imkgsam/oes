import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  PurchaseRequestDecision,
  PurchaseRequestRecord,
  PurchaseRequestStatus
} from '../../domain/models/procurement-records'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import {
  assertExists,
  assertKnownPurchaseRequestDecision,
  assertPrecondition,
  assertRequiredString,
  normalizeOptionalString
} from '../support/procurement-assertions'
import { nowIso } from '../support/procurement-write-support'
import { DecidePurchaseRequestCommand } from './decide-purchase-request.command'

/** DecidePurchaseRequestHandler freezes one APPROVED or REJECTED snapshot on a submitted PR. */
@Injectable()
@CommandHandler(DecidePurchaseRequestCommand)
export class DecidePurchaseRequestHandler
  implements ICommandHandler<DecidePurchaseRequestCommand, PurchaseRequestRecord>
{
  constructor(
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository
  ) {}

  async execute(command: DecidePurchaseRequestCommand): Promise<PurchaseRequestRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseRequestId, 'purchaseRequestId')
    assertRequiredString(command.payload.decidedBy.operatorId, 'decidedBy.operatorId')
    assertRequiredString(command.payload.decidedBy.displayName, 'decidedBy.displayName')

    const decision = assertKnownPurchaseRequestDecision(
      command.payload.decision as PurchaseRequestDecision
    )
    const existing = assertExists(
      await this.purchaseRequestRepository.findById(command.payload.tenantId, command.payload.purchaseRequestId),
      'purchase_request',
      command.payload.purchaseRequestId
    )
    assertPrecondition(existing.status === PurchaseRequestStatus.SUBMITTED, 'only SUBMITTED purchase requests can be decided')

    const decidedAt = nowIso()
    return this.purchaseRequestRepository.save({
      ...existing,
      status:
        decision === PurchaseRequestDecision.APPROVED
          ? PurchaseRequestStatus.APPROVED
          : PurchaseRequestStatus.REJECTED,
      approvalSnapshot: {
        purchaseRequestApprovalSnapshotId:
          existing.approvalSnapshot?.purchaseRequestApprovalSnapshotId ?? randomUUID(),
        decision,
        decidedBy: {
          operatorId: command.payload.decidedBy.operatorId.trim(),
          displayName: command.payload.decidedBy.displayName.trim()
        },
        decidedAt,
        comment: normalizeOptionalString(command.payload.comment) ?? null,
        approvalReference: normalizeOptionalString(command.payload.approvalReference) ?? null
      },
      decidedAt,
      updatedAt: decidedAt
    })
  }
}
