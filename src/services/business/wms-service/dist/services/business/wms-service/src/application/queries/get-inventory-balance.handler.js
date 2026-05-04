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
exports.GetInventoryBalanceHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const wms_assertions_1 = require("../support/wms-assertions");
const get_inventory_balance_query_1 = require("./get-inventory-balance.query");
/** GetInventoryBalanceHandler returns one balance projection snapshot derived from immutable ledger truth. */
let GetInventoryBalanceHandler = class GetInventoryBalanceHandler {
    inventoryRepository;
    constructor(inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }
    async execute(query) {
        (0, wms_assertions_1.assertRequiredString)(query.payload.tenantId, 'tenantId');
        (0, wms_assertions_1.assertRequiredString)(query.payload.warehouseId, 'warehouseId');
        (0, wms_assertions_1.assertRequiredString)(query.payload.itemId, 'itemId');
        return (0, wms_assertions_1.assertExists)(await this.inventoryRepository.getInventoryBalance(query.payload), 'inventory_balance', `${query.payload.warehouseId}:${query.payload.locationId ?? '__WAREHOUSE__'}:${query.payload.itemId}`);
    }
};
exports.GetInventoryBalanceHandler = GetInventoryBalanceHandler;
exports.GetInventoryBalanceHandler = GetInventoryBalanceHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(get_inventory_balance_query_1.GetInventoryBalanceQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.INVENTORY_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], GetInventoryBalanceHandler);
//# sourceMappingURL=get-inventory-balance.handler.js.map