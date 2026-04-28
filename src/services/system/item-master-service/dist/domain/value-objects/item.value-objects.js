"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemCapabilities = exports.ItemStatus = exports.ItemNatureType = exports.ItemStructureType = void 0;
/** ItemStructureType captures the only frozen phase 1 structure categories. */
var ItemStructureType;
(function (ItemStructureType) {
    ItemStructureType["SINGLE"] = "SINGLE";
    ItemStructureType["BUNDLE"] = "BUNDLE";
})(ItemStructureType || (exports.ItemStructureType = ItemStructureType = {}));
/** ItemNatureType captures the only frozen phase 1 nature categories. */
var ItemNatureType;
(function (ItemNatureType) {
    ItemNatureType["PHYSICAL"] = "PHYSICAL";
    ItemNatureType["VIRTUAL"] = "VIRTUAL";
    ItemNatureType["SERVICE"] = "SERVICE";
})(ItemNatureType || (exports.ItemNatureType = ItemNatureType = {}));
/** ItemStatus keeps phase 1 lifecycle semantics to the minimal active or inactive summary. */
var ItemStatus;
(function (ItemStatus) {
    ItemStatus["ACTIVE"] = "ACTIVE";
    ItemStatus["INACTIVE"] = "INACTIVE";
})(ItemStatus || (exports.ItemStatus = ItemStatus = {}));
/** ItemCapabilities groups the frozen phase 1 capability set and exposes replacement-friendly helpers. */
class ItemCapabilities {
    constructor(sellable, purchasable, stockable, manufacturable) {
        this.sellable = sellable;
        this.purchasable = purchasable;
        this.stockable = stockable;
        this.manufacturable = manufacturable;
    }
    /** none creates the default empty capability set for new items. */
    static none() {
        return new ItemCapabilities(false, false, false, false);
    }
    /** from rebuilds the capability value object from a plain shape. */
    static from(input = {}) {
        return new ItemCapabilities(Boolean(input.sellable), Boolean(input.purchasable), Boolean(input.stockable), Boolean(input.manufacturable));
    }
    /** toPrimitives flattens the capability value object for persistence and gRPC presentation. */
    toPrimitives() {
        return {
            sellable: this.sellable,
            purchasable: this.purchasable,
            stockable: this.stockable,
            manufacturable: this.manufacturable
        };
    }
}
exports.ItemCapabilities = ItemCapabilities;
//# sourceMappingURL=item.value-objects.js.map