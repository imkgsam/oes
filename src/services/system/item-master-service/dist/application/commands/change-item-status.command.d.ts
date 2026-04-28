import { ItemStatus } from '../../domain/value-objects/item.value-objects';
/** ChangeItemStatusCommand captures the minimal phase 1 status transition intent. */
export declare class ChangeItemStatusCommand {
    readonly input: {
        tenantId: string;
        itemId: string;
        targetStatus: ItemStatus;
    };
    constructor(input: {
        tenantId: string;
        itemId: string;
        targetStatus: ItemStatus;
    });
    get tenantId(): string;
    get itemId(): string;
    get targetStatus(): ItemStatus;
}
