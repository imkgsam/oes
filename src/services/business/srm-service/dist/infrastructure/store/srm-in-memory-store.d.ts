import { AuditEnvelope } from '@oes/common';
import { SupplierProfileRecord, SupplierAddressRecord, SupplierContactRecord, SupplierOfferingRecord } from '../../domain/models/srm-records';
/** SrmInMemoryStore keeps the phase 1 SRM state local to one runtime process for command and query wiring. */
export declare class SrmInMemoryStore {
    readonly supplierProfiles: Map<string, SupplierProfileRecord>;
    readonly supplierContacts: Map<string, SupplierContactRecord>;
    readonly supplierAddresses: Map<string, SupplierAddressRecord>;
    readonly supplierOfferings: Map<string, SupplierOfferingRecord>;
    readonly auditEnvelopes: AuditEnvelope[];
    private supplierProfileSequence;
    /** nextSupplierProfileNo reserves the next globally unique SRM account number summary for runtime usage. */
    nextSupplierProfileNo(): string;
}
