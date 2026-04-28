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
exports.UpdateItemBasicsHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
const update_item_basics_command_1 = require("./update-item-basics.command");
/** UpdateItemBasicsHandler updates only code and name while rejecting classification mutations. */
let UpdateItemBasicsHandler = class UpdateItemBasicsHandler {
    constructor(itemRepository) {
        this.itemRepository = itemRepository;
    }
    async execute(command) {
        assertRequired(command.tenantId, 'tenantId');
        assertRequired(command.itemId, 'itemId');
        assertRequired(command.itemCode, 'itemCode');
        assertRequired(command.itemName, 'itemName');
        if (command.structureType !== undefined || command.natureType !== undefined) {
            throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
                reason: 'UpdateItemBasics cannot mutate structure_type or nature_type'
            });
        }
        const item = await this.itemRepository.findById(command.tenantId, command.itemId);
        if (!item) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_NOT_FOUND, {
                itemId: command.itemId
            });
        }
        const existing = await this.itemRepository.findByCode(command.tenantId, command.itemCode);
        if (existing && existing.id !== item.id) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_ALREADY_EXISTS, {
                field: 'itemCode'
            });
        }
        item.updateBasics({
            itemCode: command.itemCode,
            itemName: command.itemName
        });
        return this.itemRepository.save(item);
    }
};
exports.UpdateItemBasicsHandler = UpdateItemBasicsHandler;
exports.UpdateItemBasicsHandler = UpdateItemBasicsHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(update_item_basics_command_1.UpdateItemBasicsCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], UpdateItemBasicsHandler);
/** assertRequired rejects blank update fields before business logic runs. */
function assertRequired(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, { field });
    }
}
//# sourceMappingURL=update-item-basics.handler.js.map