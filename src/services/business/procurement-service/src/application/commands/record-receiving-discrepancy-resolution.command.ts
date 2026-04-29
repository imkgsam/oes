import { Allow } from 'class-validator'
import { ReceivingResolutionCode } from '../../domain/models/procurement-records'

/** RecordReceivingDiscrepancyResolutionCommand carries the procurement-side resolution summary for one discrepancy. */
export class RecordReceivingDiscrepancyResolutionCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    receivingExpectationId: string
    receivingDiscrepancyId: string
    resolutionCode: ReceivingResolutionCode | string
    resolutionNote?: string
    resolutionReferences?: Array<{
      referenceType: string
      referenceId: string
    }>
  }

  constructor(payload: RecordReceivingDiscrepancyResolutionCommand['payload']) {
    this.payload = payload
  }
}
