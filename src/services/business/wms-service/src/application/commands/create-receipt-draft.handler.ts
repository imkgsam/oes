import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { ReceiptRecord, ReceiptStatus } from '../../domain/models/wms-records'
import { ReceiptRepository } from '../../domain/repositories/receipt.repository'
import { assertKnownReceiptSourceType, assertRequiredString, normalizeOptionalString } from '../support/wms-assertions'
import { nowIso } from '../support/wms-write-support'
import { CreateReceiptDraftCommand } from './create-receipt-draft.command'

/** CreateReceiptDraftHandler creates one WMS receipt draft header without posting any inventory truth. */
@Injectable()
@CommandHandler(CreateReceiptDraftCommand)
export class CreateReceiptDraftHandler
  implements ICommandHandler<CreateReceiptDraftCommand, ReceiptRecord>
{
  constructor(
    @Inject(TOKENS.RECEIPT_REPOSITORY)
    private readonly receiptRepository: ReceiptRepository
  ) {}

  async execute(command: CreateReceiptDraftCommand): Promise<ReceiptRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.warehouseId, 'warehouseId')
    const createdAt = nowIso()

    return this.receiptRepository.save({
      receiptId: randomUUID(),
      receiptNo: await this.receiptRepository.nextReceiptNo(command.payload.tenantId),
      tenantId: command.payload.tenantId,
      orgId: normalizeOptionalString(command.payload.orgId) ?? null,
      warehouseId: command.payload.warehouseId,
      status: ReceiptStatus.DRAFT,
      receiptSourceType: assertKnownReceiptSourceType(command.payload.receiptSourceType),
      referencedReceivingExpectationIds: Array.from(
        new Set(command.payload.referencedReceivingExpectationIds.map((value) => value.trim()).filter(Boolean))
      ),
      receiptDate: normalizeOptionalString(command.payload.receiptDate) ?? createdAt.slice(0, 10),
      note: normalizeOptionalString(command.payload.note) ?? null,
      attachmentRefs: command.payload.attachmentRefs.map((value) => value.trim()).filter(Boolean),
      lineCount: 0,
      postedAt: null,
      cancelledAt: null,
      cancelReason: null,
      postComment: null,
      procurementReceiptSummary: null,
      createdAt,
      updatedAt: createdAt,
      lines: []
    })
  }
}
