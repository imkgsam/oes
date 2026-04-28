import { AuditEnvelope } from '@oes/common';
import { CustomerAccountRecord, CustomerAddressRecord, CustomerContactRecord } from '../../domain/models/crm-records';
/** CrmInMemoryStore keeps the phase 1 CRM state local to one runtime process for command and query wiring. */
export declare class CrmInMemoryStore {
    readonly customerAccounts: Map<string, CustomerAccountRecord>;
    readonly customerContacts: Map<string, CustomerContactRecord>;
    readonly customerAddresses: Map<string, CustomerAddressRecord>;
    readonly auditEnvelopes: AuditEnvelope[];
    private customerAccountSequence;
    /** nextCustomerAccountNo reserves the next globally unique CRM account number summary for runtime usage. */
    nextCustomerAccountNo(): string;
}
