import { AuditEnvelope } from '@oes/common'
import {
  CustomerAccountRecord,
  CustomerAddressRecord,
  CustomerContactRecord
} from '../../domain/models/crm-records'

/** CrmInMemoryStore keeps the phase 1 CRM state local to one runtime process for command and query wiring. */
export class CrmInMemoryStore {
  public readonly customerAccounts = new Map<string, CustomerAccountRecord>()
  public readonly customerContacts = new Map<string, CustomerContactRecord>()
  public readonly customerAddresses = new Map<string, CustomerAddressRecord>()
  public readonly auditEnvelopes: AuditEnvelope[] = []

  private customerAccountSequence = 1

  /** nextCustomerAccountNo reserves the next globally unique CRM account number summary for runtime usage. */
  nextCustomerAccountNo(): string {
    const value = this.customerAccountSequence++
    return `CA-${String(value).padStart(4, '0')}`
  }
}
