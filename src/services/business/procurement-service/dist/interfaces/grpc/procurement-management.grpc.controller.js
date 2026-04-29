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
exports.ProcurementManagementGrpcController = void 0;
const common_1 = require("@nestjs/common");
const authorization_1 = require("@oes/common/authorization");
const constants_1 = require("@oes/common/constants");
const cqrs_1 = require("@oes/common/cqrs");
const filters_1 = require("@oes/common/filters");
const procurement_service_1 = require("@oes/common/generated/procurement_service");
const create_purchase_request_command_1 = require("../../application/commands/create-purchase-request.command");
const update_purchase_request_draft_command_1 = require("../../application/commands/update-purchase-request-draft.command");
const submit_purchase_request_command_1 = require("../../application/commands/submit-purchase-request.command");
const decide_purchase_request_command_1 = require("../../application/commands/decide-purchase-request.command");
const cancel_purchase_request_command_1 = require("../../application/commands/cancel-purchase-request.command");
const convert_purchase_request_to_purchase_order_command_1 = require("../../application/commands/convert-purchase-request-to-purchase-order.command");
const create_purchase_order_draft_command_1 = require("../../application/commands/create-purchase-order-draft.command");
const update_purchase_order_draft_command_1 = require("../../application/commands/update-purchase-order-draft.command");
const issue_purchase_order_command_1 = require("../../application/commands/issue-purchase-order.command");
const confirm_supplier_acknowledgement_command_1 = require("../../application/commands/confirm-supplier-acknowledgement.command");
const apply_purchase_order_change_command_1 = require("../../application/commands/apply-purchase-order-change.command");
const cancel_purchase_order_command_1 = require("../../application/commands/cancel-purchase-order.command");
const create_receiving_expectation_command_1 = require("../../application/commands/create-receiving-expectation.command");
const record_receiving_discrepancy_resolution_command_1 = require("../../application/commands/record-receiving-discrepancy-resolution.command");
const procurement_audit_service_1 = require("../../application/services/procurement-audit.service");
const procurement_assertions_1 = require("../../application/support/procurement-assertions");
const procurement_records_1 = require("../../domain/models/procurement-records");
const procurement_grpc_presenter_1 = require("./procurement-grpc.presenter");
const procurement_rpc_context_validator_1 = require("./procurement-rpc-context.validator");
/** ProcurementManagementGrpcController exposes the phase 1 procurement command contract with local audit envelope recording. */
let ProcurementManagementGrpcController = class ProcurementManagementGrpcController {
    constructor(commandBus, auditService, requestContextStore) {
        this.commandBus = commandBus;
        this.auditService = auditService;
        this.requestContextStore = requestContextStore;
    }
    async createPurchaseRequest(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'CreatePurchaseRequest',
            resourceType: 'purchase_request',
            targetId: null,
            requestSummary: {
                requestType: request.requestType ?? 0,
                lineCount: request.lines?.length ?? 0
            }
        }, async () => {
            const record = await this.commandBus.execute(new create_purchase_request_command_1.CreatePurchaseRequestCommand({
                tenantId: request.tenantId ?? '',
                orgId: request.orgId ?? undefined,
                requester: {
                    operatorId: request.operatorContext?.operatorId ?? '',
                    displayName: request.operatorContext?.operatorId ?? ''
                },
                requestType: toDomainPurchaseRequestType(request.requestType),
                title: request.title ?? undefined,
                reason: request.reason ?? undefined,
                lines: (request.lines ?? []).map((line) => ({
                    lineType: toDomainPurchaseRequestLineType(line.lineType),
                    itemId: line.itemId ?? undefined,
                    description: line.description ?? '',
                    requestedQuantity: line.requestedQuantity ?? '',
                    uom: line.uom ?? '',
                    neededByDate: line.neededByDate ?? undefined,
                    demandReferenceType: line.demandReferenceType ?? undefined,
                    demandReferenceId: line.demandReferenceId ?? undefined
                }))
            }));
            return procurement_grpc_presenter_1.ProcurementGrpcPresenter.toCreatePurchaseRequestResponse(record);
        }));
    }
    async updatePurchaseRequestDraft(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'UpdatePurchaseRequestDraft',
            resourceType: 'purchase_request',
            targetId: request.purchaseRequestId ?? null,
            requestSummary: {
                purchaseRequestId: request.purchaseRequestId ?? '',
                lineCount: request.lines?.length ?? 0
            }
        }, async () => {
            const record = await this.commandBus.execute(new update_purchase_request_draft_command_1.UpdatePurchaseRequestDraftCommand({
                tenantId: request.tenantId ?? '',
                purchaseRequestId: request.purchaseRequestId ?? '',
                title: request.title ?? undefined,
                reason: request.reason ?? undefined,
                lines: (request.lines ?? []).map((line) => ({
                    lineType: toDomainPurchaseRequestLineType(line.lineType),
                    itemId: line.itemId ?? undefined,
                    description: line.description ?? '',
                    requestedQuantity: line.requestedQuantity ?? '',
                    uom: line.uom ?? '',
                    neededByDate: line.neededByDate ?? undefined,
                    demandReferenceType: line.demandReferenceType ?? undefined,
                    demandReferenceId: line.demandReferenceId ?? undefined
                }))
            }));
            return procurement_grpc_presenter_1.ProcurementGrpcPresenter.toUpdatePurchaseRequestDraftResponse(record);
        }));
    }
    async submitPurchaseRequest(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'SubmitPurchaseRequest',
            resourceType: 'purchase_request',
            targetId: request.purchaseRequestId ?? null,
            requestSummary: {
                purchaseRequestId: request.purchaseRequestId ?? ''
            }
        }, async () => procurement_grpc_presenter_1.ProcurementGrpcPresenter.toSubmitPurchaseRequestResponse(await this.commandBus.execute(new submit_purchase_request_command_1.SubmitPurchaseRequestCommand({
            tenantId: request.tenantId ?? '',
            purchaseRequestId: request.purchaseRequestId ?? '',
            submissionComment: request.submissionComment ?? undefined
        })))));
    }
    async decidePurchaseRequest(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'DecidePurchaseRequest',
            resourceType: 'purchase_request',
            targetId: request.purchaseRequestId ?? null,
            requestSummary: {
                purchaseRequestId: request.purchaseRequestId ?? '',
                decision: request.decision ?? 0
            }
        }, async () => procurement_grpc_presenter_1.ProcurementGrpcPresenter.toUpdatePurchaseRequestDraftResponse(await this.commandBus.execute(new decide_purchase_request_command_1.DecidePurchaseRequestCommand({
            tenantId: request.tenantId ?? '',
            purchaseRequestId: request.purchaseRequestId ?? '',
            decision: toDomainPurchaseRequestDecision(request.decision),
            comment: request.comment ?? undefined,
            approvalReference: request.approvalReference ?? undefined,
            decidedBy: {
                operatorId: request.operatorContext?.operatorId ?? '',
                displayName: request.operatorContext?.operatorId ?? ''
            }
        })))));
    }
    async cancelPurchaseRequest(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'CancelPurchaseRequest',
            resourceType: 'purchase_request',
            targetId: request.purchaseRequestId ?? null,
            requestSummary: {
                purchaseRequestId: request.purchaseRequestId ?? ''
            }
        }, async () => procurement_grpc_presenter_1.ProcurementGrpcPresenter.toCancelPurchaseRequestResponse(await this.commandBus.execute(new cancel_purchase_request_command_1.CancelPurchaseRequestCommand({
            tenantId: request.tenantId ?? '',
            purchaseRequestId: request.purchaseRequestId ?? '',
            cancelReason: request.cancelReason ?? ''
        })))));
    }
    async convertPurchaseRequestToPurchaseOrder(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'ConvertPurchaseRequestToPurchaseOrder',
            resourceType: 'purchase_order',
            targetId: request.targetPurchaseOrderId ?? request.sourceLines?.[0]?.purchaseRequestId ?? null,
            requestSummary: {
                purchaseRequestId: request.sourceLines?.[0]?.purchaseRequestId ?? '',
                supplierId: request.supplierId ?? '',
                lineCount: request.sourceLines?.length ?? 0
            }
        }, async () => procurement_grpc_presenter_1.ProcurementGrpcPresenter.toConvertPurchaseRequestToPurchaseOrderResponse(await this.commandBus.execute(new convert_purchase_request_to_purchase_order_command_1.ConvertPurchaseRequestToPurchaseOrderCommand({
            tenantId: request.tenantId ?? '',
            targetPurchaseOrderId: request.targetPurchaseOrderId ?? undefined,
            supplierId: request.supplierId ?? undefined,
            currencyCode: request.currencyCode ?? undefined,
            paymentTermsSnapshot: request.paymentTermsSnapshot
                ? {
                    paymentTermsCode: request.paymentTermsSnapshot.paymentTermsCode ?? undefined,
                    paymentTermsText: request.paymentTermsSnapshot.paymentTermsText ?? undefined
                }
                : undefined,
            supplierCommercialTermsSnapshot: request.supplierCommercialTermsSnapshot
                ? {
                    incotermCode: request.supplierCommercialTermsSnapshot.incotermCode ?? undefined,
                    commercialTermsText: request.supplierCommercialTermsSnapshot.commercialTermsText ?? undefined
                }
                : undefined,
            sourceLines: (request.sourceLines ?? []).map((line) => ({
                purchaseRequestId: line.purchaseRequestId ?? '',
                purchaseRequestLineId: line.purchaseRequestLineId ?? '',
                purchaseOrderQuantity: line.purchaseOrderQuantity ?? '',
                orderedUnitPrice: line.orderedUnitPrice ?? undefined,
                generalStockExcessReason: line.generalStockExcessReason ?? undefined
            }))
        })))));
    }
    async createPurchaseOrderDraft(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'CreatePurchaseOrderDraft',
            resourceType: 'purchase_order',
            targetId: null,
            requestSummary: {
                supplierId: request.supplierId ?? '',
                lineCount: request.lines?.length ?? 0
            }
        }, async () => procurement_grpc_presenter_1.ProcurementGrpcPresenter.toCreatePurchaseOrderDraftResponse(await this.commandBus.execute(new create_purchase_order_draft_command_1.CreatePurchaseOrderDraftCommand({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            supplierId: request.supplierId ?? '',
            currencyCode: request.currencyCode ?? '',
            paymentTermsSnapshot: request.paymentTermsSnapshot
                ? {
                    paymentTermsCode: request.paymentTermsSnapshot.paymentTermsCode ?? undefined,
                    paymentTermsText: request.paymentTermsSnapshot.paymentTermsText ?? undefined
                }
                : undefined,
            supplierCommercialTermsSnapshot: request.supplierCommercialTermsSnapshot
                ? {
                    incotermCode: request.supplierCommercialTermsSnapshot.incotermCode ?? undefined,
                    commercialTermsText: request.supplierCommercialTermsSnapshot.commercialTermsText ?? undefined
                }
                : undefined,
            sourcePurchaseRequestIds: request.sourcePurchaseRequestIds ?? [],
            lines: (request.lines ?? []).map((line) => this.toPurchaseOrderLineInput(line))
        })))));
    }
    async updatePurchaseOrderDraft(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'UpdatePurchaseOrderDraft',
            resourceType: 'purchase_order',
            targetId: request.purchaseOrderId ?? null,
            requestSummary: {
                purchaseOrderId: request.purchaseOrderId ?? '',
                lineCount: request.lines?.length ?? 0
            }
        }, async () => procurement_grpc_presenter_1.ProcurementGrpcPresenter.toUpdatePurchaseOrderDraftResponse(await this.commandBus.execute(new update_purchase_order_draft_command_1.UpdatePurchaseOrderDraftCommand({
            tenantId: request.tenantId ?? '',
            purchaseOrderId: request.purchaseOrderId ?? '',
            supplierId: request.supplierId ?? '',
            currencyCode: request.currencyCode ?? '',
            paymentTermsSnapshot: request.paymentTermsSnapshot
                ? {
                    paymentTermsCode: request.paymentTermsSnapshot.paymentTermsCode ?? undefined,
                    paymentTermsText: request.paymentTermsSnapshot.paymentTermsText ?? undefined
                }
                : undefined,
            supplierCommercialTermsSnapshot: request.supplierCommercialTermsSnapshot
                ? {
                    incotermCode: request.supplierCommercialTermsSnapshot.incotermCode ?? undefined,
                    commercialTermsText: request.supplierCommercialTermsSnapshot.commercialTermsText ?? undefined
                }
                : undefined,
            sourcePurchaseRequestIds: request.sourcePurchaseRequestIds ?? [],
            lines: (request.lines ?? []).map((line) => this.toPurchaseOrderLineInput(line))
        })))));
    }
    async issuePurchaseOrder(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'IssuePurchaseOrder',
            resourceType: 'purchase_order',
            targetId: request.purchaseOrderId ?? null,
            requestSummary: {
                purchaseOrderId: request.purchaseOrderId ?? ''
            }
        }, async () => procurement_grpc_presenter_1.ProcurementGrpcPresenter.toCreatePurchaseOrderDraftResponse(await this.commandBus.execute(new issue_purchase_order_command_1.IssuePurchaseOrderCommand({
            tenantId: request.tenantId ?? '',
            purchaseOrderId: request.purchaseOrderId ?? '',
            issueComment: request.issueComment ?? undefined
        })))));
    }
    async confirmSupplierAcknowledgement(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'ConfirmSupplierAcknowledgement',
            resourceType: 'purchase_order',
            targetId: request.purchaseOrderId ?? null,
            requestSummary: {
                purchaseOrderId: request.purchaseOrderId ?? ''
            }
        }, async () => procurement_grpc_presenter_1.ProcurementGrpcPresenter.toConfirmSupplierAcknowledgementResponse(await this.commandBus.execute(new confirm_supplier_acknowledgement_command_1.ConfirmSupplierAcknowledgementCommand({
            tenantId: request.tenantId ?? '',
            purchaseOrderId: request.purchaseOrderId ?? '',
            externalReference: request.externalReference ?? undefined,
            comment: request.comment ?? undefined,
            acknowledgedAt: request.acknowledgedAt ?? undefined
        })))));
    }
    async applyPurchaseOrderChange(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'ApplyPurchaseOrderChange',
            resourceType: 'purchase_order_change',
            targetId: request.purchaseOrderId ?? null,
            requestSummary: {
                purchaseOrderId: request.purchaseOrderId ?? '',
                changeType: request.changeType ?? ''
            }
        }, async () => procurement_grpc_presenter_1.ProcurementGrpcPresenter.toApplyPurchaseOrderChangeResponse(await this.commandBus.execute(new apply_purchase_order_change_command_1.ApplyPurchaseOrderChangeCommand({
            tenantId: request.tenantId ?? '',
            purchaseOrderId: request.purchaseOrderId ?? '',
            changeType: request.changeType ?? '',
            changeReason: request.changeReason ?? '',
            appliedBy: {
                operatorId: request.operatorContext?.operatorId ?? '',
                displayName: request.operatorContext?.operatorId ?? ''
            },
            targetState: {
                lines: (request.targetState?.lines ?? []).map((line) => this.toPurchaseOrderLineInput(line)),
                supplierAcknowledgement: request.targetState?.supplierAcknowledgement
                    ? {
                        acknowledgementStatus: (0, procurement_assertions_1.normalizeOptionalString)(`${request.targetState.supplierAcknowledgement.acknowledgementStatus ?? ''}`) ??
                            undefined,
                        acknowledgedAt: request.targetState.supplierAcknowledgement.acknowledgedAt ?? undefined,
                        externalReference: request.targetState.supplierAcknowledgement.externalReference ?? undefined,
                        comment: request.targetState.supplierAcknowledgement.comment ?? undefined
                    }
                    : undefined
            }
        })))));
    }
    async cancelPurchaseOrder(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'CancelPurchaseOrder',
            resourceType: 'purchase_order',
            targetId: request.purchaseOrderId ?? null,
            requestSummary: {
                purchaseOrderId: request.purchaseOrderId ?? ''
            }
        }, async () => procurement_grpc_presenter_1.ProcurementGrpcPresenter.toCancelPurchaseOrderResponse(await this.commandBus.execute(new cancel_purchase_order_command_1.CancelPurchaseOrderCommand({
            tenantId: request.tenantId ?? '',
            purchaseOrderId: request.purchaseOrderId ?? '',
            cancelReason: request.cancelReason ?? ''
        })))));
    }
    async createReceivingExpectation(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'CreateReceivingExpectation',
            resourceType: 'receiving_expectation',
            targetId: request.purchaseOrderLineId ?? null,
            requestSummary: {
                purchaseOrderId: request.purchaseOrderId ?? '',
                purchaseOrderLineId: request.purchaseOrderLineId ?? ''
            }
        }, async () => procurement_grpc_presenter_1.ProcurementGrpcPresenter.toCreateReceivingExpectationResponse(await this.commandBus.execute(new create_receiving_expectation_command_1.CreateReceivingExpectationCommand({
            tenantId: request.tenantId ?? '',
            purchaseOrderId: request.purchaseOrderId ?? '',
            purchaseOrderLineId: request.purchaseOrderLineId ?? '',
            allocationGroupingKey: request.allocationGroupingKey ?? '',
            sourceAllocationIds: request.sourceAllocationIds ?? [],
            targetWarehouseId: request.targetWarehouseId ?? undefined,
            targetReceivingAddressId: request.targetReceivingAddressId ?? undefined,
            expectedQuantity: request.expectedQuantity ?? '',
            expectedReceiptDate: request.expectedReceiptDate ?? undefined
        })))));
    }
    async recordReceivingDiscrepancyResolution(request) {
        const context = procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'RecordReceivingDiscrepancyResolution',
            resourceType: 'receiving_discrepancy',
            targetId: request.receivingDiscrepancyId ?? null,
            requestSummary: {
                receivingExpectationId: request.receivingExpectationId ?? '',
                receivingDiscrepancyId: request.receivingDiscrepancyId ?? ''
            }
        }, async () => procurement_grpc_presenter_1.ProcurementGrpcPresenter.toRecordReceivingDiscrepancyResolutionResponse(await this.commandBus.execute(new record_receiving_discrepancy_resolution_command_1.RecordReceivingDiscrepancyResolutionCommand({
            tenantId: request.tenantId ?? '',
            receivingExpectationId: request.receivingExpectationId ?? '',
            receivingDiscrepancyId: request.receivingDiscrepancyId ?? '',
            resolutionCode: toDomainReceivingResolutionCode(request.resolutionCode),
            resolutionNote: request.resolutionNote ?? undefined,
            resolutionReferences: (request.resolutionReferences ?? []).map((reference) => ({
                referenceType: reference.referenceType ?? '',
                referenceId: reference.referenceId ?? ''
            }))
        })))));
    }
    toPurchaseOrderLineInput(line) {
        return {
            purchaseOrderLineId: line.purchaseOrderLineId ?? undefined,
            lineType: toDomainPurchaseRequestLineType(line.lineType),
            itemId: line.itemId ?? undefined,
            description: line.description ?? '',
            orderedQuantity: line.orderedQuantity ?? '',
            uom: line.uom ?? '',
            orderedUnitPrice: line.orderedUnitPrice ?? undefined,
            sourcePurchaseRequestLineId: line.sourcePurchaseRequestLineId ?? undefined,
            generalStockExcessReason: line.generalStockExcessReason ?? undefined,
            allocations: (line.allocations ?? []).map((allocation) => ({
                allocationType: toDomainPurchaseOrderAllocationType(allocation.allocationType),
                sourceReferenceId: allocation.sourceReferenceId ?? undefined,
                quantity: allocation.quantity ?? '',
                reason: allocation.reason ?? undefined,
                targetWarehouseId: allocation.targetWarehouseId ?? undefined,
                targetReceivingAddressId: allocation.targetReceivingAddressId ?? undefined
            }))
        };
    }
    runWithContext(context, work) {
        return this.requestContextStore.run(buildDownstreamRequestContext(context), work);
    }
};
exports.ProcurementManagementGrpcController = ProcurementManagementGrpcController;
exports.ProcurementManagementGrpcController = ProcurementManagementGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.Controller)(),
    (0, procurement_service_1.PurchaseRequestManagementServiceControllerMethods)(),
    (0, procurement_service_1.PurchaseOrderManagementServiceControllerMethods)(),
    (0, procurement_service_1.ReceivingExpectationManagementServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingCommandBus,
        procurement_audit_service_1.ProcurementAuditService,
        authorization_1.GrpcRequestContextStore])
], ProcurementManagementGrpcController);
function toDomainPurchaseRequestType(value) {
    switch (value) {
        case procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_SALES_DEDICATED:
            return procurement_records_1.PurchaseRequestType.SALES_DEDICATED;
        case procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_PRODUCTION_PACKAGING:
            return procurement_records_1.PurchaseRequestType.PRODUCTION_PACKAGING;
        case procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_MAINTENANCE:
            return procurement_records_1.PurchaseRequestType.MAINTENANCE;
        case procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_SAMPLE:
            return procurement_records_1.PurchaseRequestType.SAMPLE;
        default:
            return procurement_records_1.PurchaseRequestType.DEPARTMENTAL;
    }
}
function toDomainPurchaseRequestLineType(value) {
    return value === procurement_service_1.PurchaseRequestLineType.PURCHASE_REQUEST_LINE_TYPE_TEXT
        ? procurement_records_1.PurchaseRequestLineType.TEXT
        : procurement_records_1.PurchaseRequestLineType.STANDARD_ITEM;
}
function toDomainPurchaseRequestDecision(value) {
    return value === procurement_service_1.PurchaseRequestDecision.PURCHASE_REQUEST_DECISION_REJECTED
        ? procurement_records_1.PurchaseRequestDecision.REJECTED
        : procurement_records_1.PurchaseRequestDecision.APPROVED;
}
function toDomainPurchaseOrderAllocationType(value) {
    if (value === 1) {
        return procurement_records_1.PurchaseOrderLineAllocationType.PURCHASE_REQUEST_LINE;
    }
    if (value === 2) {
        return procurement_records_1.PurchaseOrderLineAllocationType.SALES_ORDER_LINE;
    }
    if (value === 3) {
        return procurement_records_1.PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND;
    }
    return procurement_records_1.PurchaseOrderLineAllocationType.GENERAL_STOCK;
}
function toDomainReceivingResolutionCode(value) {
    switch (value) {
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_CLOSE_UNRECEIVED:
            return procurement_records_1.ReceivingResolutionCode.CLOSE_UNRECEIVED;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REQUEST_RESEND:
            return procurement_records_1.ReceivingResolutionCode.REQUEST_RESEND;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_PO_CHANGE:
            return procurement_records_1.ReceivingResolutionCode.ACCEPT_WITH_PO_CHANGE;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REJECT_EXCESS:
            return procurement_records_1.ReceivingResolutionCode.REJECT_EXCESS;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_TEMP_HOLD:
            return procurement_records_1.ReceivingResolutionCode.TEMP_HOLD;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REJECT_DAMAGED:
            return procurement_records_1.ReceivingResolutionCode.REJECT_DAMAGED;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_RECEIVE_WITH_RESTRICTION:
            return procurement_records_1.ReceivingResolutionCode.RECEIVE_WITH_RESTRICTION;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_CLAIM:
            return procurement_records_1.ReceivingResolutionCode.CLAIM;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REJECT_WRONG_ITEM:
            return procurement_records_1.ReceivingResolutionCode.REJECT_WRONG_ITEM;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_TEMP_RECEIVE_PENDING_DECISION:
            return procurement_records_1.ReceivingResolutionCode.TEMP_RECEIVE_PENDING_DECISION;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_CONTROLLED_CHANGE:
            return procurement_records_1.ReceivingResolutionCode.ACCEPT_WITH_CONTROLLED_CHANGE;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_WAIT_INSPECTION:
            return procurement_records_1.ReceivingResolutionCode.WAIT_INSPECTION;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_ALLOWANCE:
            return procurement_records_1.ReceivingResolutionCode.ACCEPT_WITH_ALLOWANCE;
        case procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_RETURN_TO_SUPPLIER:
            return procurement_records_1.ReceivingResolutionCode.RETURN_TO_SUPPLIER;
        default:
            return procurement_records_1.ReceivingResolutionCode.WAIT_REDELIVERY;
    }
}
function buildDownstreamRequestContext(context) {
    const issuedAt = new Date();
    return {
        internalServiceName: constants_1.SERVICE_NAMES.PROCUREMENT,
        requestId: context.traceContext.requestId,
        traceId: context.traceContext.traceId,
        operatorContext: {
            operator_id: context.operatorContext.operatorId,
            operator_type: context.operatorContext.operatorType,
            tenant_id: context.tenantId,
            org_id: context.operatorContext.orgId ?? undefined,
            issued_at: issuedAt.toISOString(),
            expires_at: new Date(issuedAt.getTime() + 5 * 60 * 1000).toISOString(),
            issuer: constants_1.SERVICE_NAMES.PROCUREMENT,
            signature: 'procurement-runtime-context'
        }
    };
}
//# sourceMappingURL=procurement-management.grpc.controller.js.map