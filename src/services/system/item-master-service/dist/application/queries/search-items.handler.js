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
exports.SearchItemsHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
const item_value_objects_1 = require("../../domain/value-objects/item.value-objects");
const search_items_query_1 = require("./search-items.query");
/** SearchItemsHandler applies filter and pagination validation while preserving empty-page normal responses. */
let SearchItemsHandler = class SearchItemsHandler {
    constructor(itemRepository) {
        this.itemRepository = itemRepository;
    }
    async execute(query) {
        assertRequired(query.tenantId, 'tenantId');
        const page = query.page && query.page > 0 ? query.page : 1;
        const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;
        if ((query.page ?? 1) <= 0 || (query.pageSize ?? 20) <= 0) {
            throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
                reason: 'page and page_size must be positive'
            });
        }
        return this.itemRepository.search({
            tenantId: query.tenantId,
            keyword: query.keyword?.trim() || undefined,
            structureType: toDomainStructureType(query.structureType),
            natureType: toDomainNatureType(query.natureType),
            capabilityFilters: query.capabilityFilters,
            status: toDomainStatus(query.status),
            page,
            pageSize
        });
    }
};
exports.SearchItemsHandler = SearchItemsHandler;
exports.SearchItemsHandler = SearchItemsHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(search_items_query_1.SearchItemsQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], SearchItemsHandler);
/** assertRequired rejects blank catalog search coordinates before repository access. */
function assertRequired(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, { field });
    }
}
/** toDomainStructureType converts proto numeric enums into optional domain filters. */
function toDomainStructureType(value) {
    if (value === 2) {
        return item_value_objects_1.ItemStructureType.BUNDLE;
    }
    if (value === 1) {
        return item_value_objects_1.ItemStructureType.SINGLE;
    }
    return undefined;
}
/** toDomainNatureType converts proto numeric enums into optional domain filters. */
function toDomainNatureType(value) {
    if (value === 2) {
        return item_value_objects_1.ItemNatureType.VIRTUAL;
    }
    if (value === 3) {
        return item_value_objects_1.ItemNatureType.SERVICE;
    }
    if (value === 1) {
        return item_value_objects_1.ItemNatureType.PHYSICAL;
    }
    return undefined;
}
/** toDomainStatus converts proto numeric enums into optional domain filters. */
function toDomainStatus(value) {
    if (value === 2) {
        return item_value_objects_1.ItemStatus.INACTIVE;
    }
    if (value === 1) {
        return item_value_objects_1.ItemStatus.ACTIVE;
    }
    return undefined;
}
//# sourceMappingURL=search-items.handler.js.map