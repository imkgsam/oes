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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesManagementGrpcController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@oes/common/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const filters_1 = require("@oes/common/filters");
const sales_service_1 = require("@oes/common/generated/sales_service");
const create_quote_command_1 = require("../../application/commands/create-quote.command");
const update_quote_draft_command_1 = require("../../application/commands/update-quote-draft.command");
const publish_quote_command_1 = require("../../application/commands/publish-quote.command");
const convert_quote_version_to_order_command_1 = require("../../application/commands/convert-quote-version-to-order.command");
const set_order_commercial_gate_command_1 = require("../../application/commands/set-order-commercial-gate.command");
const submit_fulfillment_handoff_command_1 = require("../../application/commands/submit-fulfillment-handoff.command");
const sales_audit_service_1 = require("../../application/services/sales-audit.service");
const sales_errors_1 = require("../../common/errors/sales.errors");
const sales_grpc_presenter_1 = require("./sales-grpc.presenter");
const sales_rpc_context_validator_1 = require("./sales-rpc-context.validator");
/** SalesManagementGrpcController exposes the phase 1 sales command contract with local audit envelope recording. */
let SalesManagementGrpcController = class SalesManagementGrpcController {
    constructor(commandBus, auditService) {
        this.commandBus = commandBus;
        this.auditService = auditService;
    }
    async createQuote(request) {
        const context = sales_rpc_context_validator_1.SalesRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'CreateQuote',
            resourceType: 'quote',
            targetId: null,
            requestSummary: {
                customerTenantPartyId: request.customerTenantPartyId ?? '',
                lineCount: request.draftLines?.length ?? 0
            }
        }, async () => {
            const quote = await this.commandBus.execute(new create_quote_command_1.CreateQuoteCommand({
                tenantId: request.tenantId ?? '',
                customerTenantPartyId: request.customerTenantPartyId ?? '',
                opportunityRef: request.opportunityRef
                    ? {
                        opportunityId: request.opportunityRef.opportunityId ?? '',
                        opportunityNo: request.opportunityRef.opportunityNo ?? '',
                        opportunityName: request.opportunityRef.opportunityName ?? ''
                    }
                    : undefined,
                draftLines: (request.draftLines ?? []).map((line) => ({
                    lineNo: line.lineNo ?? 0,
                    itemId: line.itemId ?? '',
                    itemSnapshot: {
                        itemCode: line.itemSnapshot?.itemCode ?? '',
                        itemName: line.itemSnapshot?.itemName ?? ''
                    },
                    salesConfigSnapshot: {
                        salesUom: line.salesConfigSnapshot?.salesUom ?? '',
                        salesUnitLabel: line.salesConfigSnapshot?.salesUnitLabel ?? '',
                        notes: line.salesConfigSnapshot?.notes ?? ''
                    },
                    packagingRequirementSnapshot: {
                        packageMode: line.packagingRequirementSnapshot?.packageMode ?? '',
                        packageLabel: line.packagingRequirementSnapshot?.packageLabel ?? '',
                        specialInstructions: line.packagingRequirementSnapshot?.specialInstructions ?? ''
                    },
                    priceQuantityDeliverySnapshot: {
                        currencyCode: line.priceQuantityDeliverySnapshot?.currencyCode ?? '',
                        unitPrice: line.priceQuantityDeliverySnapshot?.unitPrice ?? '',
                        quantity: line.priceQuantityDeliverySnapshot?.quantity ?? '',
                        deliveryTerm: line.priceQuantityDeliverySnapshot?.deliveryTerm ?? '',
                        requestedDeliveryDate: line.priceQuantityDeliverySnapshot?.requestedDeliveryDate ?? ''
                    },
                    customerItemSnapshot: {
                        customerSku: line.customerItemSnapshot?.customerSku ?? '',
                        customerModel: line.customerItemSnapshot?.customerModel ?? '',
                        customerDisplayName: line.customerItemSnapshot?.customerDisplayName ?? ''
                    }
                }))
            }));
            return sales_grpc_presenter_1.SalesGrpcPresenter.toCreateQuoteResponse(quote);
        });
    }
    async updateQuoteDraft(request) {
        const context = sales_rpc_context_validator_1.SalesRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'UpdateQuoteDraft',
            resourceType: 'quote',
            targetId: request.quoteId ?? null,
            requestSummary: {
                quoteId: request.quoteId ?? '',
                lineCount: request.draftMutation?.lines?.length ?? 0
            }
        }, async () => {
            const quote = await this.commandBus.execute(new update_quote_draft_command_1.UpdateQuoteDraftCommand({
                tenantId: request.tenantId ?? '',
                quoteId: request.quoteId ?? '',
                draftMutation: {
                    customerTenantPartyId: request.draftMutation?.customerTenantPartyId ?? '',
                    opportunityRef: request.draftMutation?.opportunityRef
                        ? {
                            opportunityId: request.draftMutation.opportunityRef.opportunityId ?? '',
                            opportunityNo: request.draftMutation.opportunityRef.opportunityNo ?? '',
                            opportunityName: request.draftMutation.opportunityRef.opportunityName ?? ''
                        }
                        : undefined,
                    lines: (request.draftMutation?.lines ?? []).map((line) => ({
                        lineNo: line.lineNo ?? 0,
                        itemId: line.itemId ?? '',
                        itemSnapshot: {
                            itemCode: line.itemSnapshot?.itemCode ?? '',
                            itemName: line.itemSnapshot?.itemName ?? ''
                        },
                        salesConfigSnapshot: {
                            salesUom: line.salesConfigSnapshot?.salesUom ?? '',
                            salesUnitLabel: line.salesConfigSnapshot?.salesUnitLabel ?? '',
                            notes: line.salesConfigSnapshot?.notes ?? ''
                        },
                        packagingRequirementSnapshot: {
                            packageMode: line.packagingRequirementSnapshot?.packageMode ?? '',
                            packageLabel: line.packagingRequirementSnapshot?.packageLabel ?? '',
                            specialInstructions: line.packagingRequirementSnapshot?.specialInstructions ?? ''
                        },
                        priceQuantityDeliverySnapshot: {
                            currencyCode: line.priceQuantityDeliverySnapshot?.currencyCode ?? '',
                            unitPrice: line.priceQuantityDeliverySnapshot?.unitPrice ?? '',
                            quantity: line.priceQuantityDeliverySnapshot?.quantity ?? '',
                            deliveryTerm: line.priceQuantityDeliverySnapshot?.deliveryTerm ?? '',
                            requestedDeliveryDate: line.priceQuantityDeliverySnapshot?.requestedDeliveryDate ?? ''
                        },
                        customerItemSnapshot: {
                            customerSku: line.customerItemSnapshot?.customerSku ?? '',
                            customerModel: line.customerItemSnapshot?.customerModel ?? '',
                            customerDisplayName: line.customerItemSnapshot?.customerDisplayName ?? ''
                        }
                    }))
                }
            }));
            return {
                quote: sales_grpc_presenter_1.SalesGrpcPresenter.toQuote(quote)
            };
        });
    }
    async publishQuote(request) {
        const context = sales_rpc_context_validator_1.SalesRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'PublishQuote',
            resourceType: 'quote_version',
            targetId: request.quoteId ?? null,
            requestSummary: {
                quoteId: request.quoteId ?? ''
            }
        }, async () => {
            const result = await this.commandBus.execute(new publish_quote_command_1.PublishQuoteCommand({
                tenantId: request.tenantId ?? '',
                quoteId: request.quoteId ?? ''
            }));
            return sales_grpc_presenter_1.SalesGrpcPresenter.toPublishQuoteResponse(result);
        });
    }
    async convertQuoteVersionToOrder(request) {
        const context = sales_rpc_context_validator_1.SalesRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'ConvertQuoteVersionToOrder',
            resourceType: 'sales_order',
            targetId: request.quoteVersionId ?? null,
            requestSummary: {
                quoteVersionId: request.quoteVersionId ?? ''
            }
        }, async () => {
            const order = await this.commandBus.execute(new convert_quote_version_to_order_command_1.ConvertQuoteVersionToOrderCommand({
                tenantId: request.tenantId ?? '',
                quoteVersionId: request.quoteVersionId ?? ''
            }));
            return sales_grpc_presenter_1.SalesGrpcPresenter.toConvertQuoteVersionToOrderResponse(order);
        });
    }
    async setOrderCommercialGate(request) {
        const context = sales_rpc_context_validator_1.SalesRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'SetOrderCommercialGate',
            resourceType: 'sales_order',
            targetId: request.salesOrderId ?? null,
            requestSummary: {
                salesOrderId: request.salesOrderId ?? '',
                gateName: request.gateName ?? 0,
                allowed: request.allowed ?? false
            }
        }, async () => {
            const order = await this.commandBus.execute(new set_order_commercial_gate_command_1.SetOrderCommercialGateCommand({
                tenantId: request.tenantId ?? '',
                salesOrderId: request.salesOrderId ?? '',
                gateName: toDomainGateName(request.gateName),
                allowed: request.allowed ?? false
            }));
            return sales_grpc_presenter_1.SalesGrpcPresenter.toSetOrderCommercialGateResponse(order);
        });
    }
    async submitFulfillmentHandoff(request) {
        const context = sales_rpc_context_validator_1.SalesRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'SubmitFulfillmentHandoff',
            resourceType: 'fulfillment_handoff',
            targetId: request.salesOrderId ?? null,
            requestSummary: {
                salesOrderId: request.salesOrderId ?? ''
            }
        }, async () => {
            const order = await this.commandBus.execute(new submit_fulfillment_handoff_command_1.SubmitFulfillmentHandoffCommand({
                tenantId: request.tenantId ?? '',
                salesOrderId: request.salesOrderId ?? ''
            }));
            return sales_grpc_presenter_1.SalesGrpcPresenter.toSubmitFulfillmentHandoffResponse(order);
        });
    }
};
exports.SalesManagementGrpcController = SalesManagementGrpcController;
exports.SalesManagementGrpcController = SalesManagementGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.Controller)(),
    (0, sales_service_1.SalesManagementServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingCommandBus,
        sales_audit_service_1.SalesAuditService])
], SalesManagementGrpcController);
/** toDomainGateName maps the generated commercial gate enum into the frozen domain gate identifiers. */
function toDomainGateName(value) {
    switch (value) {
        case sales_service_1.CommercialGateName.COMMERCIAL_GATE_NAME_PRODUCTION_GATE:
            return 'production_gate';
        case sales_service_1.CommercialGateName.COMMERCIAL_GATE_NAME_STOCKING_GATE:
            return 'stocking_gate';
        case sales_service_1.CommercialGateName.COMMERCIAL_GATE_NAME_SHIPPING_GATE:
            return 'shipping_gate';
        default:
            throw exceptions_1.ExceptionFactory.application(sales_errors_1.SALES_INVALID_ARGUMENT, {
                field: 'gateName'
            });
    }
}
//# sourceMappingURL=sales-management.grpc.controller.js.map