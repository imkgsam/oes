/** GetLocationQuery captures one tenant-scoped location lookup by location_id. */
export declare class GetLocationQuery {
    readonly tenantId: string;
    readonly locationId: string;
    constructor(tenantId: string, locationId: string);
}
