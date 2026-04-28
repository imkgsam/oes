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
exports.ListSupplierItemMappingsByItemQuery = void 0;
const class_validator_1 = require("class-validator");
/** ListSupplierItemMappingsByItemQuery captures one item-scoped supplier mapping page request. */
class ListSupplierItemMappingsByItemQuery {
    constructor(input) {
        this.input = input;
        this.tenantId = input.tenantId;
        this.itemId = input.itemId;
        this.page = input.page;
        this.pageSize = input.pageSize;
    }
}
exports.ListSupplierItemMappingsByItemQuery = ListSupplierItemMappingsByItemQuery;
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], ListSupplierItemMappingsByItemQuery.prototype, "input", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", String)
], ListSupplierItemMappingsByItemQuery.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", String)
], ListSupplierItemMappingsByItemQuery.prototype, "itemId", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Number)
], ListSupplierItemMappingsByItemQuery.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Number)
], ListSupplierItemMappingsByItemQuery.prototype, "pageSize", void 0);
//# sourceMappingURL=list-supplier-item-mappings-by-item.query.js.map