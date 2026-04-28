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
exports.SetOrderCommercialGateHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const sales_errors_1 = require("../../common/errors/sales.errors");
const sales_assertions_1 = require("../support/sales-assertions");
const set_order_commercial_gate_command_1 = require("./set-order-commercial-gate.command");
/** SetOrderCommercialGateHandler updates one gate flag without collapsing the three execution gates together. */
let SetOrderCommercialGateHandler = class SetOrderCommercialGateHandler {
    constructor(salesOrderRepository) {
        this.salesOrderRepository = salesOrderRepository;
    }
    async execute(command) {
        (0, sales_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, sales_assertions_1.assertRequiredString)(command.salesOrderId, 'salesOrderId');
        assertGateName(command.gateName);
        const order = await this.salesOrderRepository.findById(command.tenantId, command.salesOrderId);
        if (!order) {
            throw exceptions_1.ExceptionFactory.domain(sales_errors_1.SALES_NOT_FOUND, {
                salesOrderId: command.salesOrderId
            });
        }
        if (!order.commercialGateSummary.orderEstablished) {
            throw exceptions_1.ExceptionFactory.application(sales_errors_1.SALES_FAILED_PRECONDITION, {
                reason: 'sales order is not established'
            });
        }
        const updated = {
            ...order,
            commercialGateSummary: {
                ...order.commercialGateSummary,
                productionGate: command.gateName === 'production_gate'
                    ? command.allowed
                    : order.commercialGateSummary.productionGate,
                stockingGate: command.gateName === 'stocking_gate'
                    ? command.allowed
                    : order.commercialGateSummary.stockingGate,
                shippingGate: command.gateName === 'shipping_gate'
                    ? command.allowed
                    : order.commercialGateSummary.shippingGate
            }
        };
        return this.salesOrderRepository.save(updated);
    }
};
exports.SetOrderCommercialGateHandler = SetOrderCommercialGateHandler;
exports.SetOrderCommercialGateHandler = SetOrderCommercialGateHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(set_order_commercial_gate_command_1.SetOrderCommercialGateCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SALES_ORDER_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], SetOrderCommercialGateHandler);
/** assertGateName rejects any gate mutation outside the three frozen phase 1 commercial gates. */
function assertGateName(value) {
    if (value !== 'production_gate' && value !== 'stocking_gate' && value !== 'shipping_gate') {
        throw exceptions_1.ExceptionFactory.application(sales_errors_1.SALES_INVALID_ARGUMENT, {
            field: 'gateName'
        });
    }
}
//# sourceMappingURL=set-order-commercial-gate.handler.js.map