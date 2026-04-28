export interface TenantPartyLookupResult {
    tenantId: string;
    tenantPartyId: string;
    status: string;
    partyDisplayName?: string | null;
}
/** TenantPartyLookupPort validates whether one tenant-scoped party reference exists and is bindable for SRM. */
export interface TenantPartyLookupPort {
    getTenantPartyById(tenantId: string, tenantPartyId: string): Promise<TenantPartyLookupResult | null>;
}
