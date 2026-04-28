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
exports.SearchItemsQuery = void 0;
const class_validator_1 = require("class-validator");
/** SearchItemsQuery captures the frozen phase 1 catalog search filters and pagination controls. */
class SearchItemsQuery {
    constructor(input) {
        this.input = input;
        this.tenantId = input.tenantId;
        this.keyword = input.keyword;
        this.structureType = input.structureType;
        this.natureType = input.natureType;
        this.capabilityFilters = input.capabilityFilters;
        this.status = input.status;
        this.page = input.page;
        this.pageSize = input.pageSize;
    }
}
exports.SearchItemsQuery = SearchItemsQuery;
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], SearchItemsQuery.prototype, "input", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", String)
], SearchItemsQuery.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", String)
], SearchItemsQuery.prototype, "keyword", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Number)
], SearchItemsQuery.prototype, "structureType", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Number)
], SearchItemsQuery.prototype, "natureType", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], SearchItemsQuery.prototype, "capabilityFilters", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Number)
], SearchItemsQuery.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Number)
], SearchItemsQuery.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Number)
], SearchItemsQuery.prototype, "pageSize", void 0);
//# sourceMappingURL=search-items.query.js.map