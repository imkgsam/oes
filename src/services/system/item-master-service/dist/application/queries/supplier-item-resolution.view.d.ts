export interface SupplierItemMappingResolvedView {
    supplierId: string;
    supplierItemCode?: string;
    supplierItemName?: string;
    itemId: string;
    itemCode: string;
    itemName: string;
}
/** SupplierItemResolutionView keeps the query-layer match outcome aligned with the frozen MATCHED or NO_MATCH contract. */
export declare enum SupplierItemResolutionView {
    MATCHED = "MATCHED",
    NO_MATCH = "NO_MATCH"
}
/** SupplierItemResolutionStatus preserves the legacy enum name expected by tests while reusing the same values. */
export declare const SupplierItemResolutionStatus: typeof SupplierItemResolutionView;
export interface ResolveSupplierItemMappingResult {
    resolutionStatus: SupplierItemResolutionView;
    mapping?: SupplierItemMappingResolvedView;
}
