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
exports.BatchGetItemsHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
const batch_get_items_query_1 = require("./batch-get-items.query");
/** BatchGetItemsHandler preserves normal partial-miss semantics instead of escalating missing ids to errors. */
let BatchGetItemsHandler = class BatchGetItemsHandler {
    constructor(itemRepository) {
        this.itemRepository = itemRepository;
    }
    async execute(query) {
        assertRequired(query.tenantId, 'tenantId');
        if (!Array.isArray(query.itemIds)) {
            throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
                field: 'itemIds'
            });
        }
        if (query.itemIds.length === 0) {
            return {
                items: [],
                missingItemIds: []
            };
        }
        const items = await this.itemRepository.findByIds(query.tenantId, query.itemIds);
        const foundIds = new Set(items.map((item) => item.id));
        return {
            items,
            missingItemIds: query.itemIds.filter((itemId) => !foundIds.has(itemId))
        };
    }
};
exports.BatchGetItemsHandler = BatchGetItemsHandler;
exports.BatchGetItemsHandler = BatchGetItemsHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(batch_get_items_query_1.BatchGetItemsQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], BatchGetItemsHandler);
/** assertRequired rejects blank query coordinates before repository access. */
function assertRequired(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, { field });
    }
}
//# sourceMappingURL=batch-get-items.handler.js.map