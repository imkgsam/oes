import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  ReceivingDiscrepancyRecord,
  ReceivingExpectationRecord,
  ReceivingResolutionCode
} from '../../domain/models/procurement-records'
import { ReceivingRepository } from '../../domain/repositories/receiving.repository'
import {
  assertExists,
  assertKnownReceivingResolutionCode,
  assertPrecondition,
  assertRequiredString,
  normalizeOptionalString
} from '../support/procurement-assertions'
import { nowIso } from '../support/procurement-write-support'
import { RecordReceivingDiscrepancyResolutionCommand } from './record-receiving-discrepancy-resolution.command'

/** RecordReceivingDiscrepancyResolutionHandler records procurement-side discrepancy decisions without mutating inventory truth. */
@Injectable()
@CommandHandler(RecordReceivingDiscrepancyResolutionCommand)
export class RecordReceivingDiscrepancyResolutionHandler
  implements ICommandHandler<RecordReceivingDiscrepancyResolutionCommand, { receivingExpectation: ReceivingExpectationRecord; receivingDiscrepancy: NonNullable<ReceivingExpectationRecord['discrepancy']> }>
{
  constructor(
    @Inject(TOKENS.RECEIVING_REPOSITORY)
    private readonly receivingRepository: ReceivingRepository
  ) {}

  async execute(
    command: RecordReceivingDiscrepancyResolutionCommand
  ): Promise<{ receivingExpectation: ReceivingExpectationRecord; receivingDiscrepancy: NonNullable<ReceivingExpectationRecord['discrepancy']> }> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.receivingExpectationId, 'receivingExpectationId')
    assertRequiredString(command.payload.receivingDiscrepancyId, 'receivingDiscrepancyId')

    const resolutionCode = assertKnownReceivingResolutionCode(
      command.payload.resolutionCode as ReceivingResolutionCode
    )
    const existing = assertExists(
      await this.receivingRepository.findById(command.payload.tenantId, command.payload.receivingExpectationId),
      'receiving_expectation',
      command.payload.receivingExpectationId
    )
    const discrepancy = assertExists(existing.discrepancy, 'receiving_discrepancy', command.payload.receivingDiscrepancyId)
    assertPrecondition(
      discrepancy.receivingDiscrepancyId === command.payload.receivingDiscrepancyId,
      'receiving discrepancy does not belong to expectation'
    )
    assertPrecondition(discrepancy.status === 'OPEN', 'receiving discrepancy must be OPEN before resolution')
    assertResolutionCompatible(discrepancy, resolutionCode, command.payload.resolutionReferences ?? [])

    const resolvedAt = nowIso()
    const updatedDiscrepancy = {
      ...discrepancy,
      status: 'RESOLVED',
      resolutionCode,
      resolutionNote: normalizeOptionalString(command.payload.resolutionNote) ?? null,
      resolutionReferences: (command.payload.resolutionReferences ?? []).map((reference) => ({
        referenceType: reference.referenceType.trim(),
        referenceId: reference.referenceId.trim()
      })),
      resolvedAt
    } as NonNullable<ReceivingExpectationRecord['discrepancy']>

    const receivingExpectation = await this.receivingRepository.save({
      ...existing,
      updatedAt: resolvedAt,
      discrepancy: updatedDiscrepancy
    })

    return {
      receivingExpectation,
      receivingDiscrepancy: updatedDiscrepancy
    }
  }
}

function assertResolutionCompatible(
  discrepancy: ReceivingDiscrepancyRecord,
  resolutionCode: ReceivingResolutionCode,
  resolutionReferences: Array<{ referenceType: string; referenceId: string }>
): void {
  const allowed = new Map([
    [
      'SHORT_RECEIVED',
      [
        ReceivingResolutionCode.WAIT_REDELIVERY,
        ReceivingResolutionCode.CLOSE_UNRECEIVED,
        ReceivingResolutionCode.REQUEST_RESEND
      ]
    ],
    [
      'OVER_RECEIVED',
      [
        ReceivingResolutionCode.ACCEPT_WITH_PO_CHANGE,
        ReceivingResolutionCode.REJECT_EXCESS,
        ReceivingResolutionCode.TEMP_HOLD
      ]
    ],
    [
      'DAMAGED',
      [
        ReceivingResolutionCode.REJECT_DAMAGED,
        ReceivingResolutionCode.RECEIVE_WITH_RESTRICTION,
        ReceivingResolutionCode.CLAIM,
        ReceivingResolutionCode.REQUEST_RESEND
      ]
    ],
    [
      'WRONG_ITEM',
      [
        ReceivingResolutionCode.REJECT_WRONG_ITEM,
        ReceivingResolutionCode.TEMP_RECEIVE_PENDING_DECISION,
        ReceivingResolutionCode.ACCEPT_WITH_CONTROLLED_CHANGE
      ]
    ],
    [
      'QUALITY_HOLD',
      [
        ReceivingResolutionCode.WAIT_INSPECTION,
        ReceivingResolutionCode.CLAIM,
        ReceivingResolutionCode.ACCEPT_WITH_ALLOWANCE,
        ReceivingResolutionCode.RETURN_TO_SUPPLIER
      ]
    ]
  ])
  assertPrecondition(
    allowed.get(discrepancy.discrepancyType)?.includes(resolutionCode),
    'resolution code must match discrepancy type'
  )
  if (
    resolutionCode === ReceivingResolutionCode.CLOSE_UNRECEIVED ||
    resolutionCode === ReceivingResolutionCode.ACCEPT_WITH_PO_CHANGE
  ) {
    assertPrecondition(
      resolutionReferences.length > 0,
      'purchase-order-change-backed resolution requires references'
    )
  }
}
