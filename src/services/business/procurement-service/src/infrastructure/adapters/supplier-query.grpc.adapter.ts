import { Injectable } from '@nestjs/common'
import {
  SupplierOfferingReferenceLookupResult,
  SupplierReferenceLookupPort,
  SupplierReferenceLookupResult
} from '../../application/ports/supplier-reference-lookup.port'

export const PROCUREMENT_SRM_PREPARED_NOT_ACTIVATED =
  'PROCUREMENT_SRM_PREPARED_NOT_ACTIVATED' as const

/** Keeps Procurement supplier validation fail-closed until trusted inbound can activate HUMAN_OBO. */
@Injectable()
export class SupplierQueryGrpcAdapter implements SupplierReferenceLookupPort {
  async getSupplierById(
    _tenantId: string,
    _supplierId: string
  ): Promise<SupplierReferenceLookupResult | null> {
    throw new Error(PROCUREMENT_SRM_PREPARED_NOT_ACTIVATED)
  }

  async getActiveSupplierOffering(
    _tenantId: string,
    _supplierId: string,
    _itemId: string
  ): Promise<SupplierOfferingReferenceLookupResult | null> {
    throw new Error(PROCUREMENT_SRM_PREPARED_NOT_ACTIVATED)
  }
}
