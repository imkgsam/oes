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
exports.SetItemCompositionHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
const set_item_composition_command_1 = require("./set-item-composition.command");
/** SetItemCompositionHandler replaces bundle composition while rejecting non-bundle, self, and nested bundle inputs. */
let SetItemCompositionHandler = class SetItemCompositionHandler {
    constructor(itemRepository, compositionRepository) {
        this.itemRepository = itemRepository;
        this.compositionRepository = compositionRepository;
    }
    async execute(command) {
        assertRequired(command.tenantId, 'tenantId');
        assertRequired(command.itemId, 'itemId');
        const parent = await this.itemRepository.findById(command.tenantId, command.itemId);
        if (!parent) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_NOT_FOUND, {
                itemId: command.itemId
            });
        }
        if (!parent.isBundle()) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_FAILED_PRECONDITION, {
                reason: 'composition parent must be BUNDLE'
            });
        }
        assertNoDuplicates(command.componentItemIds);
        const componentItems = [];
        for (const componentItemId of command.componentItemIds) {
            if (componentItemId === command.itemId) {
                throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_FAILED_PRECONDITION, {
                    reason: 'self reference is not allowed'
                });
            }
            const component = await this.itemRepository.findById(command.tenantId, componentItemId);
            if (!component) {
                throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_NOT_FOUND, {
                    itemId: componentItemId
                });
            }
            if (component.isBundle()) {
                throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_FAILED_PRECONDITION, {
                    reason: 'nested bundle is deferred'
                });
            }
            componentItems.push(component);
        }
        const records = await this.compositionRepository.replaceForParent(command.tenantId, command.itemId, command.componentItemIds);
        return {
            itemId: command.itemId,
            components: records
                .sort((left, right) => left.sortOrder - right.sortOrder)
                .map((record) => componentItems.find((item) => item.id === record.componentItemId))
        };
    }
};
exports.SetItemCompositionHandler = SetItemCompositionHandler;
exports.SetItemCompositionHandler = SetItemCompositionHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(set_item_composition_command_1.SetItemCompositionCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_COMPOSITION_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], SetItemCompositionHandler);
/** assertRequired rejects missing composition coordinates. */
function assertRequired(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, { field });
    }
}
/** assertNoDuplicates rejects patch-like duplicate component ids from a full replacement request. */
function assertNoDuplicates(componentItemIds) {
    if (new Set(componentItemIds).size !== componentItemIds.length) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
            reason: 'component_item_ids must be unique'
        });
    }
}
//# sourceMappingURL=set-item-composition.handler.js.map