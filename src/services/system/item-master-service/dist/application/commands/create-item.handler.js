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
exports.CreateItemHandler = void 0;
const node_crypto_1 = require("node:crypto");
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
const item_aggregate_1 = require("../../domain/aggregates/item.aggregate");
const create_item_command_1 = require("./create-item.command");
/** CreateItemHandler creates tenant-scoped items while preserving code uniqueness and immutable classification. */
let CreateItemHandler = class CreateItemHandler {
    constructor(itemRepository) {
        this.itemRepository = itemRepository;
    }
    async execute(command) {
        assertRequired(command.tenantId, 'tenantId');
        assertRequired(command.itemCode, 'itemCode');
        assertRequired(command.itemName, 'itemName');
        const existing = await this.itemRepository.findByCode(command.tenantId, command.itemCode);
        if (existing) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_ALREADY_EXISTS, {
                field: 'itemCode'
            });
        }
        const item = item_aggregate_1.Item.create({
            id: (0, node_crypto_1.randomUUID)(),
            tenantId: command.tenantId,
            itemCode: command.itemCode,
            itemName: command.itemName,
            structureType: command.structureType,
            natureType: command.natureType
        });
        return this.itemRepository.save(item);
    }
};
exports.CreateItemHandler = CreateItemHandler;
exports.CreateItemHandler = CreateItemHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(create_item_command_1.CreateItemCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], CreateItemHandler);
/** assertRequired rejects blank command fields before repository access. */
function assertRequired(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, { field });
    }
}
//# sourceMappingURL=create-item.handler.js.map