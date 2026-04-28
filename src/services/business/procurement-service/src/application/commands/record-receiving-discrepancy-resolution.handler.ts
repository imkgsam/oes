import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { ReceivingExpectationRecord, ReceivingExpectationStatus, ReceivingResolutionCode } from '../../domain/models/procurement-records'
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

    const resolvedAt = nowIso()
    const updatedDiscrepancy = {
      ...discrepancy,
      status: 'RESOLVED',
      resolutionCode,
      resolutionNote: normalizeOptionalString(command.payload.resolutionNote) ?? null,
      resolvedAt
    } as NonNullable<ReceivingExpectationRecord['discrepancy']>
    const closesExpectation =
      resolutionCode === ReceivingResolutionCode.ACCEPT_SHORT_CLOSE ||
      resolutionCode === ReceivingResolutionCode.RETURN_OR_REJECT_EXCESS

    const receivingExpectation = await this.receivingRepository.save({
      ...existing,
      status: closesExpectation ? ReceivingExpectationStatus.COMPLETED : existing.status,
      openQuantity: closesExpectation ? '0' : existing.openQuantity,
      updatedAt: resolvedAt,
      discrepancy: updatedDiscrepancy
    })

    return {
      receivingExpectation,
      receivingDiscrepancy: updatedDiscrepancy
    }
  }
}
