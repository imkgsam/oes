/** SearchSelectableCustomersQuery carries the CRM selector read filters frozen for phase 1 downstream use. */
export declare class SearchSelectableCustomersQuery {
    readonly input: {
        tenantId: string;
        keyword?: string;
        page?: number;
        pageSize?: number;
    };
    constructor(input: {
        tenantId: string;
        keyword?: string;
        page?: number;
        pageSize?: number;
    });
}
