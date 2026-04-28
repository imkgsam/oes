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
exports.GetItemCompositionHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
const get_item_composition_query_1 = require("./get-item-composition.query");
/** GetItemCompositionHandler reads bundle composition and preserves the empty-components success shape. */
let GetItemCompositionHandler = class GetItemCompositionHandler {
    constructor(itemRepository, compositionRepository) {
        this.itemRepository = itemRepository;
        this.compositionRepository = compositionRepository;
    }
    async execute(query) {
        assertRequired(query.tenantId, 'tenantId');
        assertRequired(query.itemId, 'itemId');
        const parent = await this.itemRepository.findById(query.tenantId, query.itemId);
        if (!parent) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_NOT_FOUND, {
                itemId: query.itemId
            });
        }
        if (!parent.isBundle()) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_FAILED_PRECONDITION, {
                reason: 'composition parent must be BUNDLE'
            });
        }
        const records = await this.compositionRepository.listByParentId(query.tenantId, query.itemId);
        if (records.length === 0) {
            return {
                itemId: query.itemId,
                components: []
            };
        }
        const componentIds = records
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((record) => record.componentItemId);
        const components = await this.itemRepository.findByIds(query.tenantId, componentIds);
        const componentMap = new Map(components.map((item) => [item.id, item]));
        return {
            itemId: query.itemId,
            components: componentIds.map((componentId) => componentMap.get(componentId)).filter(Boolean)
        };
    }
};
exports.GetItemCompositionHandler = GetItemCompositionHandler;
exports.GetItemCompositionHandler = GetItemCompositionHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(get_item_composition_query_1.GetItemCompositionQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_COMPOSITION_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], GetItemCompositionHandler);
/** assertRequired rejects missing composition read coordinates. */
function assertRequired(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, { field });
    }
}
//# sourceMappingURL=get-item-composition.handler.js.map