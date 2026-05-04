import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { ReceiptRecord, ReceiptStatus } from '../../domain/models/wms-records'
import { ReceiptRepository } from '../../domain/repositories/receipt.repository'
import { assertExists, assertPrecondition, assertRequiredString } from '../support/wms-assertions'
import { nowIso } from '../support/wms-write-support'
import { CancelReceiptDraftCommand } from './cancel-receipt-draft.command'

/** CancelReceiptDraftHandler closes a draft receipt without touching immutable ledger or inventory truth. */
@Injectable()
@CommandHandler(CancelReceiptDraftCommand)
export class CancelReceiptDraftHandler
  implements ICommandHandler<CancelReceiptDraftCommand, ReceiptRecord>
{
  constructor(
    @Inject(TOKENS.RECEIPT_REPOSITORY)
    private readonly receiptRepository: ReceiptRepository
  ) {}

  async execute(command: CancelReceiptDraftCommand): Promise<ReceiptRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.receiptId, 'receiptId')
    assertRequiredString(command.payload.cancelReason, 'cancelReason')

    const receipt = assertExists(
      await this.receiptRepository.findById(command.payload.tenantId, command.payload.receiptId),
      'receipt',
      command.payload.receiptId
    )
    assertPrecondition(receipt.status === ReceiptStatus.DRAFT, 'only draft receipts can be cancelled')

    const cancelledAt = nowIso()
    return this.receiptRepository.save({
      ...receipt,
      status: ReceiptStatus.CANCELLED,
      cancelReason: command.payload.cancelReason.trim(),
      cancelledAt,
      updatedAt: cancelledAt
    })
  }
}
