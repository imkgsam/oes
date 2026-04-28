"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertSupplierOfferingCommand = void 0;
const class_validator_1 = require("class-validator");
/** UpsertSupplierOfferingCommand carries one create-or-update current supplyability fact for supplierId + itemId. */
class UpsertSupplierOfferingCommand {
    constructor(payload) {
        this.payload = payload;
    }
    get tenantId() {
        return this.payload.tenantId;
    }
    get supplierOfferingId() {
        return this.payload.supplierOfferingId;
    }
    get supplierId() {
        return this.payload.supplierId;
    }
    get itemId() {
        return this.payload.itemId;
    }
    get targetStatus() {
        return this.payload.targetStatus;
    }
}
exports.UpsertSupplierOfferingCommand = UpsertSupplierOfferingCommand;
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], UpsertSupplierOfferingCommand.prototype, "payload", void 0);
//# sourceMappingURL=upsert-supplier-offering.command.js.map