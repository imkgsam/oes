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
exports.ListSupplierItemMappingsByItemHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
const list_supplier_item_mappings_by_item_query_1 = require("./list-supplier-item-mappings-by-item.query");
/** ListSupplierItemMappingsByItemHandler validates item existence and returns one supplier mapping page. */
let ListSupplierItemMappingsByItemHandler = class ListSupplierItemMappingsByItemHandler {
    constructor(supplierItemMappingRepository, itemRepository) {
        this.supplierItemMappingRepository = supplierItemMappingRepository;
        this.itemRepository = itemRepository;
    }
    async execute(query) {
        assertRequired(query.tenantId, 'tenantId');
        assertRequired(query.itemId, 'itemId');
        if ((query.page ?? 1) <= 0 || (query.pageSize ?? 20) <= 0) {
            throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
                reason: 'page and page_size must be positive'
            });
        }
        const item = await this.itemRepository.findById(query.tenantId, query.itemId);
        if (!item) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_NOT_FOUND, {
                itemId: query.itemId
            });
        }
        return this.supplierItemMappingRepository.listByItem({
            tenantId: query.tenantId,
            itemId: query.itemId,
            page: query.page && query.page > 0 ? query.page : 1,
            pageSize: query.pageSize && query.pageSize > 0 ? query.pageSize : 20
        });
    }
};
exports.ListSupplierItemMappingsByItemHandler = ListSupplierItemMappingsByItemHandler;
exports.ListSupplierItemMappingsByItemHandler = ListSupplierItemMappingsByItemHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(list_supplier_item_mappings_by_item_query_1.ListSupplierItemMappingsByItemQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_ITEM_MAPPING_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], ListSupplierItemMappingsByItemHandler);
/** assertRequired rejects blank list coordinates before touching repositories. */
function assertRequired(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, { field });
    }
}
//# sourceMappingURL=list-supplier-item-mappings-by-item.handler.js.map