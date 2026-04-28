import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseRequestRecord, PurchaseRequestStatus, PurchaseRequestType } from '../../domain/models/procurement-records'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { assertRequiredString, normalizeOptionalString } from '../support/procurement-assertions'
import { materializePurchaseRequestLines, nowIso } from '../support/procurement-write-support'
import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port'
import { CreatePurchaseRequestCommand } from './create-purchase-request.command'

/** CreatePurchaseRequestHandler creates one procurement demand draft without turning it into a procurement commitment. */
@Injectable()
@CommandHandler(CreatePurchaseRequestCommand)
export class CreatePurchaseRequestHandler implements ICommandHandler<CreatePurchaseRequestCommand, PurchaseRequestRecord> {
  constructor(
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository,
    @Inject(TOKENS.ITEM_REFERENCE_LOOKUP_PORT)
    private readonly itemLookup: ItemReferenceLookupPort
  ) {}

  async execute(command: CreatePurchaseRequestCommand): Promise<PurchaseRequestRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.requester.operatorId, 'requester.operatorId')
    assertRequiredString(command.payload.requester.displayName, 'requester.displayName')

    const createdAt = nowIso()
    const lines = await materializePurchaseRequestLines(
      command.payload.tenantId,
      command.payload.lines,
      this.itemLookup
    )

    const record: PurchaseRequestRecord = {
      purchaseRequestId: randomUUID(),
      requestNo: await this.purchaseRequestRepository.nextRequestNo(command.payload.tenantId),
      tenantId: command.payload.tenantId,
      orgId: normalizeOptionalString(command.payload.orgId) ?? null,
      requestType: toPurchaseRequestType(command.payload.requestType),
      status: PurchaseRequestStatus.DRAFT,
      requester: {
        operatorId: command.payload.requester.operatorId.trim(),
        displayName: command.payload.requester.displayName.trim()
      },
      title: normalizeOptionalString(command.payload.title) ?? null,
      reason: normalizeOptionalString(command.payload.reason) ?? null,
      submissionComment: null,
      cancelReason: null,
      createdAt,
      updatedAt: createdAt,
      submittedAt: null,
      decidedAt: null,
      cancelledAt: null,
      approvalSnapshot: null,
      lines
    }

    return this.purchaseRequestRepository.save(record)
  }
}

function toPurchaseRequestType(value: PurchaseRequestType | string): PurchaseRequestType {
  const normalized = value as PurchaseRequestType
  if (Object.values(PurchaseRequestType).includes(normalized)) {
    return normalized
  }

  return PurchaseRequestType.DEPARTMENTAL
}
