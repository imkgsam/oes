import { Injectable } from '@nestjs/common'
import {
  ReceivingExpectationLookupPort,
  ReceivingExpectationLookupResult
} from '../../application/ports/receiving-expectation-lookup.port'

export const WMS_PROCUREMENT_PREPARED_NOT_ACTIVATED =
  'WMS_PROCUREMENT_PREPARED_NOT_ACTIVATED' as const

/** Keeps WMS receipt expectation lookup fail-closed until WMS trusted inbound is migrated. */
@Injectable()
export class ProcurementReceivingExpectationGrpcAdapter implements ReceivingExpectationLookupPort {
  async getReceivingExpectationById(
    _tenantId: string,
    _receivingExpectationId: string
  ): Promise<ReceivingExpectationLookupResult | null> {
    throw new Error(WMS_PROCUREMENT_PREPARED_NOT_ACTIVATED)
  }
}
