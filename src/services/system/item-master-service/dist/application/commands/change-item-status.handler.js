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
exports.ChangeItemStatusHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
const change_item_status_command_1 = require("./change-item-status.command");
/** ChangeItemStatusHandler switches the minimal lifecycle summary and keeps same-status transitions as no-ops. */
let ChangeItemStatusHandler = class ChangeItemStatusHandler {
    constructor(itemRepository) {
        this.itemRepository = itemRepository;
    }
    async execute(command) {
        assertRequired(command.tenantId, 'tenantId');
        assertRequired(command.itemId, 'itemId');
        const item = await this.itemRepository.findById(command.tenantId, command.itemId);
        if (!item) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_NOT_FOUND, {
                itemId: command.itemId
            });
        }
        if (item.status === command.targetStatus) {
            return item;
        }
        item.changeStatus(command.targetStatus);
        return this.itemRepository.save(item);
    }
};
exports.ChangeItemStatusHandler = ChangeItemStatusHandler;
exports.ChangeItemStatusHandler = ChangeItemStatusHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(change_item_status_command_1.ChangeItemStatusCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], ChangeItemStatusHandler);
/** assertRequired rejects missing status transition coordinates. */
function assertRequired(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, { field });
    }
}
//# sourceMappingURL=change-item-status.handler.js.map