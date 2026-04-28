/** ItemStructureType captures the only frozen phase 1 structure categories. */
export declare enum ItemStructureType {
    SINGLE = "SINGLE",
    BUNDLE = "BUNDLE"
}
/** ItemNatureType captures the only frozen phase 1 nature categories. */
export declare enum ItemNatureType {
    PHYSICAL = "PHYSICAL",
    VIRTUAL = "VIRTUAL",
    SERVICE = "SERVICE"
}
/** ItemStatus keeps phase 1 lifecycle semantics to the minimal active or inactive summary. */
export declare enum ItemStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}
export interface ItemCapabilitiesProps {
    sellable: boolean;
    purchasable: boolean;
    stockable: boolean;
    manufacturable: boolean;
}
/** ItemCapabilities groups the frozen phase 1 capability set and exposes replacement-friendly helpers. */
export declare class ItemCapabilities {
    readonly sellable: boolean;
    readonly purchasable: boolean;
    readonly stockable: boolean;
    readonly manufacturable: boolean;
    constructor(sellable: boolean, purchasable: boolean, stockable: boolean, manufacturable: boolean);
    /** none creates the default empty capability set for new items. */
    static none(): ItemCapabilities;
    /** from rebuilds the capability value object from a plain shape. */
    static from(input?: Partial<ItemCapabilitiesProps>): ItemCapabilities;
    /** toPrimitives flattens the capability value object for persistence and gRPC presentation. */
    toPrimitives(): ItemCapabilitiesProps;
}
