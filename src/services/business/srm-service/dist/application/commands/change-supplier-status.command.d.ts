import { SupplierStatus } from '../../domain/models/srm-records';
/** ChangeSupplierStatusCommand carries the phase 1 SRM status transition payload. */
export declare class ChangeSupplierStatusCommand {
    readonly payload: {
        tenantId: string;
        supplierId: string;
        targetStatus: SupplierStatus;
    };
    constructor(payload: {
        tenantId: string;
        supplierId: string;
        targetStatus: SupplierStatus;
    });
    get tenantId(): string;
    get supplierId(): string;
    get targetStatus(): SupplierStatus;
}
