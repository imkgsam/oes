"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Item = void 0;
const exceptions_1 = require("@oes/common/exceptions");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
const item_value_objects_1 = require("../value-objects/item.value-objects");
/** Item models the tenant-scoped item master aggregate and enforces phase 1 classification and capability rules. */
class Item {
    constructor(state) {
        this.state = state;
    }
    /** create builds a new phase 1 item aggregate with immutable classification and empty capabilities. */
    static create(input) {
        assertNonBlank(input.tenantId, 'tenantId');
        assertNonBlank(input.itemCode, 'itemCode');
        assertNonBlank(input.itemName, 'itemName');
        return new Item({
            id: input.id,
            tenantId: input.tenantId.trim(),
            itemCode: input.itemCode.trim(),
            itemName: input.itemName.trim(),
            structureType: input.structureType,
            natureType: input.natureType,
            status: item_value_objects_1.ItemStatus.ACTIVE,
            capabilities: item_value_objects_1.ItemCapabilities.none(),
            primaryCategory: undefined
        });
    }
    /** reconstitute rebuilds an aggregate from already validated persistence state. */
    static reconstitute(state) {
        return new Item({
            ...state,
            capabilities: item_value_objects_1.ItemCapabilities.from(state.capabilities.toPrimitives()),
            primaryCategory: state.primaryCategory ? { ...state.primaryCategory } : undefined
        });
    }
    get id() {
        return this.state.id;
    }
    get tenantId() {
        return this.state.tenantId;
    }
    get itemCode() {
        return this.state.itemCode;
    }
    get itemName() {
        return this.state.itemName;
    }
    get structureType() {
        return this.state.structureType;
    }
    get natureType() {
        return this.state.natureType;
    }
    get status() {
        return this.state.status;
    }
    get capabilities() {
        return this.state.capabilities;
    }
    get primaryCategory() {
        return this.state.primaryCategory ? { ...this.state.primaryCategory } : undefined;
    }
    /** isBundle reports whether the item is the only phase 1 structure type allowed to own composition. */
    isBundle() {
        return this.state.structureType === item_value_objects_1.ItemStructureType.BUNDLE;
    }
    /** isPhysical reports whether the item may carry stockable or manufacturable capabilities in phase 1. */
    isPhysical() {
        return this.state.natureType === item_value_objects_1.ItemNatureType.PHYSICAL;
    }
    /** updateBasics replaces the only mutable phase 1 basic fields: item_code and item_name. */
    updateBasics(input) {
        assertNonBlank(input.itemCode, 'itemCode');
        assertNonBlank(input.itemName, 'itemName');
        this.state.itemCode = input.itemCode.trim();
        this.state.itemName = input.itemName.trim();
        return this;
    }
    /** replaceCapabilities applies the full replacement capability contract and guards PHYSICAL-only flags. */
    replaceCapabilities(capabilities) {
        if ((capabilities.stockable || capabilities.manufacturable) && !this.isPhysical()) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_FAILED_PRECONDITION, {
                reason: 'stockable/manufacturable require PHYSICAL item'
            });
        }
        this.state.capabilities = item_value_objects_1.ItemCapabilities.from(capabilities.toPrimitives());
        return this;
    }
    /** changeStatus switches the minimal phase 1 lifecycle summary while supporting no-op transitions. */
    changeStatus(targetStatus) {
        this.state.status = targetStatus;
        return this;
    }
    /** setPrimaryCategory replaces the phase 1 single-value primary-category association or clears it. */
    setPrimaryCategory(primaryCategory) {
        this.state.primaryCategory = primaryCategory ? { ...primaryCategory } : undefined;
        return this;
    }
    /** toPrimitives exposes aggregate state for persistence and gRPC presentation. */
    toPrimitives() {
        return {
            ...this.state,
            capabilities: this.state.capabilities.toPrimitives(),
            primaryCategory: this.state.primaryCategory ? { ...this.state.primaryCategory } : undefined
        };
    }
}
exports.Item = Item;
/** assertNonBlank rejects empty strings before they can become aggregate state. */
function assertNonBlank(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
            field
        });
    }
}
//# sourceMappingURL=item.aggregate.js.map