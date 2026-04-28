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
exports.ResolveSupplierItemMappingQuery = void 0;
const class_validator_1 = require("class-validator");
/** ResolveSupplierItemMappingQuery captures the supplier identifier lookup request. */
class ResolveSupplierItemMappingQuery {
    constructor(input) {
        this.input = input;
        this.tenantId = input.tenantId;
        this.supplierId = input.supplierId;
        this.supplierItemCode = input.supplierItemCode;
        this.supplierItemName = input.supplierItemName;
    }
}
exports.ResolveSupplierItemMappingQuery = ResolveSupplierItemMappingQuery;
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], ResolveSupplierItemMappingQuery.prototype, "input", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", String)
], ResolveSupplierItemMappingQuery.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", String)
], ResolveSupplierItemMappingQuery.prototype, "supplierId", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", String)
], ResolveSupplierItemMappingQuery.prototype, "supplierItemCode", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", String)
], ResolveSupplierItemMappingQuery.prototype, "supplierItemName", void 0);
//# sourceMappingURL=resolve-supplier-item-mapping.query.js.map