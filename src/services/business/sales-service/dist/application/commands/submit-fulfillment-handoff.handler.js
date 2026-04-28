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
exports.SubmitFulfillmentHandoffHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const sales_errors_1 = require("../../common/errors/sales.errors");
const sales_records_1 = require("../../domain/models/sales-records");
const sales_assertions_1 = require("../support/sales-assertions");
const submit_fulfillment_handoff_command_1 = require("./submit-fulfillment-handoff.command");
/** SubmitFulfillmentHandoffHandler records sales-side handoff submission without changing any physical release truth. */
let SubmitFulfillmentHandoffHandler = class SubmitFulfillmentHandoffHandler {
    constructor(salesOrderRepository) {
        this.salesOrderRepository = salesOrderRepository;
    }
    async execute(command) {
        (0, sales_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, sales_assertions_1.assertRequiredString)(command.salesOrderId, 'salesOrderId');
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
        return this.salesOrderRepository.save({
            ...order,
            fulfillmentHandoffStatus: {
                status: sales_records_1.SalesFulfillmentHandoffStatus.SUBMITTED,
                submittedAt: new Date().toISOString()
            }
        });
    }
};
exports.SubmitFulfillmentHandoffHandler = SubmitFulfillmentHandoffHandler;
exports.SubmitFulfillmentHandoffHandler = SubmitFulfillmentHandoffHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(submit_fulfillment_handoff_command_1.SubmitFulfillmentHandoffCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SALES_ORDER_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], SubmitFulfillmentHandoffHandler);
//# sourceMappingURL=submit-fulfillment-handoff.handler.js.map