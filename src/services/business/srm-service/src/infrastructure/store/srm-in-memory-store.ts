import { AuditEnvelope } from '@oes/common'
import {
  SupplierProfileRecord,
  SupplierAddressRecord,
  SupplierContactRecord,
  SupplierOfferingRecord
} from '../../domain/models/srm-records'

/** SrmInMemoryStore keeps the phase 1 SRM state local to one runtime process for command and query wiring. */
export class SrmInMemoryStore {
  public readonly supplierProfiles = new Map<string, SupplierProfileRecord>()
  public readonly supplierContacts = new Map<string, SupplierContactRecord>()
  public readonly supplierAddresses = new Map<string, SupplierAddressRecord>()
  public readonly supplierOfferings = new Map<string, SupplierOfferingRecord>()
  public readonly auditEnvelopes: AuditEnvelope[] = []

  private supplierProfileSequence = 1

  /** nextSupplierProfileNo reserves the next globally unique SRM account number summary for runtime usage. */
  nextSupplierProfileNo(): string {
    const value = this.supplierProfileSequence++
    return `CA-${String(value).padStart(4, '0')}`
  }
}
