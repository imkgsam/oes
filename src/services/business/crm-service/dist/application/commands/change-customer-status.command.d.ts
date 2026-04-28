import { CustomerStatus } from '../../domain/models/crm-records';
/** ChangeCustomerStatusCommand carries the phase 1 CRM status transition payload. */
export declare class ChangeCustomerStatusCommand {
    readonly payload: {
        tenantId: string;
        customerAccountId: string;
        targetStatus: CustomerStatus;
    };
    constructor(payload: {
        tenantId: string;
        customerAccountId: string;
        targetStatus: CustomerStatus;
    });
    get tenantId(): string;
    get customerAccountId(): string;
    get targetStatus(): CustomerStatus;
}
