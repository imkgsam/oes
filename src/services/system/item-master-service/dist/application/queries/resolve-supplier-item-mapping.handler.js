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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolveSupplierItemMappingHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
const resolve_supplier_item_mapping_query_1 = require("./resolve-supplier-item-mapping.query");
const supplier_item_resolution_view_1 = require("./supplier-item-resolution.view");
/** ResolveSupplierItemMappingHandler returns MATCHED or NO_MATCH without using exceptions for absent mappings. */
let ResolveSupplierItemMappingHandler = class ResolveSupplierItemMappingHandler {
    constructor(supplierItemMappingRepository, itemRepository) {
        this.supplierItemMappingRepository = supplierItemMappingRepository;
        this.itemRepository = itemRepository;
    }
    async execute(query) {
        assertRequired(query.tenantId, 'tenantId');
        assertRequired(query.supplierId, 'supplierId');
        assertHasCodeOrName(query.supplierItemCode, query.supplierItemName);
        const mapping = await this.supplierItemMappingRepository.resolve({
            tenantId: query.tenantId,
            supplierId: query.supplierId,
            supplierItemCode: query.supplierItemCode,
            supplierItemName: query.supplierItemName
        });
        if (!mapping) {
            return {
                resolutionStatus: supplier_item_resolution_view_1.SupplierItemResolutionView.NO_MATCH
            };
        }
        const item = await this.itemRepository.findById(query.tenantId, mapping.itemId);
        if (!item) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_NOT_FOUND, {
                itemId: mapping.itemId
            });
        }
        return {
            resolutionStatus: supplier_item_resolution_view_1.SupplierItemResolutionView.MATCHED,
            mapping: {
                supplierId: mapping.supplierId,
                supplierItemCode: mapping.supplierItemCode,
                supplierItemName: mapping.supplierItemName,
                itemId: item.id,
                itemCode: item.itemCode,
                itemName: item.itemName
            }
        };
    }
};
exports.ResolveSupplierItemMappingHandler = ResolveSupplierItemMappingHandler;
exports.ResolveSupplierItemMappingHandler = ResolveSupplierItemMappingHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(resolve_supplier_item_mapping_query_1.ResolveSupplierItemMappingQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_ITEM_MAPPING_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], ResolveSupplierItemMappingHandler);
/** assertRequired rejects missing supplier mapping lookup coordinates. */
function assertRequired(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, { field });
    }
}
/** assertHasCodeOrName preserves the frozen code-or-name minimum lookup contract. */
function assertHasCodeOrName(code, name) {
    if ((!code || code.trim().length === 0) && (!name || name.trim().length === 0)) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
            reason: 'supplier_item_code or supplier_item_name is required'
        });
    }
}
//# sourceMappingURL=resolve-supplier-item-mapping.handler.js.map