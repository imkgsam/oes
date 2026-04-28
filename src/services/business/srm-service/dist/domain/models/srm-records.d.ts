export declare enum SupplierStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}
export declare enum SupplierPartyBindingStatus {
    ACTIVE = "ACTIVE"
}
export declare enum SupplierOfferingStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}
export interface SrmOperatorContext {
    operatorId: string;
    operatorType: string;
    orgId?: string | null;
}
export interface SrmTraceContext {
    traceId: string;
    requestId: string;
}
export interface SrmAuditContext {
    auditId: string;
    reason: string;
    source: string;
}
export interface SupplierPartyBindingRecord {
    supplierPartyBindingId: string;
    supplierId: string;
    tenantId: string;
    tenantPartyId: string;
    bindingStatus: SupplierPartyBindingStatus;
    partyDisplayName?: string | null;
}
export interface SupplierOfferingRecord {
    supplierOfferingId: string;
    tenantId: string;
    supplierId: string;
    itemId: string;
    itemCode?: string | null;
    itemName?: string | null;
    status: SupplierOfferingStatus;
}
export interface SupplierProfileRecord {
    id: string;
    supplierNo: string;
    tenantId: string;
    displayName: string;
    status: SupplierStatus;
    supplierCategory?: string | null;
    tags: string[];
    partyBinding?: SupplierPartyBindingRecord | null;
}
export interface SupplierContactRecord {
    supplierContactId: string;
    tenantId: string;
    supplierId: string;
    displayName: string;
    roleTitle?: string | null;
    email?: string | null;
    phone?: string | null;
    isPrimaryContact: boolean;
    isActive: boolean;
}
export interface SupplierAddressRecord {
    supplierAddressId: string;
    tenantId: string;
    supplierId: string;
    label: string;
    countryCode: string;
    region?: string | null;
    locality?: string | null;
    addressLine1: string;
    addressLine2?: string | null;
    postalCode?: string | null;
    isPrimaryAddress: boolean;
    isActive: boolean;
}
export interface PageResult<TItem> {
    items: TItem[];
    total: number;
    page: number;
    pageSize: number;
}
export interface SearchSuppliersInput {
    tenantId: string;
    keyword?: string;
    status?: SupplierStatus;
    tenantPartyId?: string;
    page?: number;
    pageSize?: number;
}
/** cloneRecord deep-clones plain SRM records so repositories do not leak mutable state across calls. */
export declare function cloneRecord<T>(value: T): T;
