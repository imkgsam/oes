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
exports.UpsertSupplierItemMappingHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
const upsert_supplier_item_mapping_command_1 = require("./upsert-supplier-item-mapping.command");
/** UpsertSupplierItemMappingHandler keeps supplier code or name aliases mapped to one item without procurement fields. */
let UpsertSupplierItemMappingHandler = class UpsertSupplierItemMappingHandler {
    constructor(supplierItemMappingRepository, itemRepository) {
        this.supplierItemMappingRepository = supplierItemMappingRepository;
        this.itemRepository = itemRepository;
    }
    async execute(command) {
        assertRequired(command.tenantId, 'tenantId');
        assertRequired(command.supplierId, 'supplierId');
        assertRequired(command.itemId, 'itemId');
        assertHasCodeOrName(command.supplierItemCode, command.supplierItemName);
        const item = await this.itemRepository.findById(command.tenantId, command.itemId);
        if (!item) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_NOT_FOUND, {
                itemId: command.itemId
            });
        }
        return this.supplierItemMappingRepository.upsert({
            tenantId: command.tenantId,
            supplierId: command.supplierId,
            supplierItemCode: command.supplierItemCode,
            supplierItemName: command.supplierItemName,
            itemId: command.itemId
        });
    }
};
exports.UpsertSupplierItemMappingHandler = UpsertSupplierItemMappingHandler;
exports.UpsertSupplierItemMappingHandler = UpsertSupplierItemMappingHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(upsert_supplier_item_mapping_command_1.UpsertSupplierItemMappingCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_ITEM_MAPPING_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], UpsertSupplierItemMappingHandler);
/** assertRequired rejects missing supplier mapping coordinates. */
function assertRequired(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, { field });
    }
}
/** assertHasCodeOrName preserves the frozen code-or-name minimum input contract. */
function assertHasCodeOrName(code, name) {
    if ((!code || code.trim().length === 0) && (!name || name.trim().length === 0)) {
        throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
            reason: 'supplier_item_code or supplier_item_name is required'
        });
    }
}
//# sourceMappingURL=upsert-supplier-item-mapping.handler.js.map