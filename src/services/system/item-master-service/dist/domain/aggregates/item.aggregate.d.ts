import { ItemCapabilities, ItemCapabilitiesProps, ItemNatureType, ItemStatus, ItemStructureType } from '../value-objects/item.value-objects';
import { ItemCategoryReference } from '../value-objects/item-category.value-objects';
export interface ItemState {
    id: string;
    tenantId: string;
    itemCode: string;
    itemName: string;
    structureType: ItemStructureType;
    natureType: ItemNatureType;
    status: ItemStatus;
    capabilities: ItemCapabilities;
    primaryCategory?: ItemCategoryReference;
}
/** Item models the tenant-scoped item master aggregate and enforces phase 1 classification and capability rules. */
export declare class Item {
    private readonly state;
    private constructor();
    /** create builds a new phase 1 item aggregate with immutable classification and empty capabilities. */
    static create(input: {
        id: string;
        tenantId: string;
        itemCode: string;
        itemName: string;
        structureType: ItemStructureType;
        natureType: ItemNatureType;
    }): Item;
    /** reconstitute rebuilds an aggregate from already validated persistence state. */
    static reconstitute(state: ItemState): Item;
    get id(): string;
    get tenantId(): string;
    get itemCode(): string;
    get itemName(): string;
    get structureType(): ItemStructureType;
    get natureType(): ItemNatureType;
    get status(): ItemStatus;
    get capabilities(): ItemCapabilities;
    get primaryCategory(): ItemCategoryReference | undefined;
    /** isBundle reports whether the item is the only phase 1 structure type allowed to own composition. */
    isBundle(): boolean;
    /** isPhysical reports whether the item may carry stockable or manufacturable capabilities in phase 1. */
    isPhysical(): boolean;
    /** updateBasics replaces the only mutable phase 1 basic fields: item_code and item_name. */
    updateBasics(input: {
        itemCode: string;
        itemName: string;
    }): Item;
    /** replaceCapabilities applies the full replacement capability contract and guards PHYSICAL-only flags. */
    replaceCapabilities(capabilities: ItemCapabilities): Item;
    /** changeStatus switches the minimal phase 1 lifecycle summary while supporting no-op transitions. */
    changeStatus(targetStatus: ItemStatus): Item;
    /** setPrimaryCategory replaces the phase 1 single-value primary-category association or clears it. */
    setPrimaryCategory(primaryCategory?: ItemCategoryReference): Item;
    /** toPrimitives exposes aggregate state for persistence and gRPC presentation. */
    toPrimitives(): Omit<ItemState, 'capabilities'> & {
        capabilities: ItemCapabilitiesProps;
    };
}
