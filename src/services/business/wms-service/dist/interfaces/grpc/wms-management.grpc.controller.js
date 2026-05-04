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
exports.WmsManagementGrpcController = void 0;
const common_1 = require("@nestjs/common");
const authorization_1 = require("@oes/common/authorization");
const constants_1 = require("@oes/common/constants");
const cqrs_1 = require("@oes/common/cqrs");
const filters_1 = require("@oes/common/filters");
const wms_service_1 = require("@oes/common/generated/wms_service");
const wms_audit_service_1 = require("../../application/services/wms-audit.service");
const add_or_replace_receipt_lines_command_1 = require("../../application/commands/add-or-replace-receipt-lines.command");
const cancel_receipt_draft_command_1 = require("../../application/commands/cancel-receipt-draft.command");
const create_receipt_draft_command_1 = require("../../application/commands/create-receipt-draft.command");
const post_receipt_command_1 = require("../../application/commands/post-receipt.command");
const wms_records_1 = require("../../domain/models/wms-records");
const wms_grpc_presenter_1 = require("./wms-grpc.presenter");
const wms_rpc_context_validator_1 = require("./wms-rpc-context.validator");
/** WmsManagementGrpcController exposes the phase 1 receipt command contract with local audit envelope recording. */
let WmsManagementGrpcController = class WmsManagementGrpcController {
    constructor(commandBus, auditService, requestContextStore) {
        this.commandBus = commandBus;
        this.auditService = auditService;
        this.requestContextStore = requestContextStore;
    }
    async createReceiptDraft(request) {
        const context = wms_rpc_context_validator_1.WmsRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'CreateReceiptDraft',
            resourceType: 'receipt',
            targetId: null,
            requestSummary: {
                warehouseId: request.warehouseId ?? '',
                receiptSourceType: request.receiptSourceType ?? 0
            }
        }, async () => wms_grpc_presenter_1.WmsGrpcPresenter.toCreateReceiptDraftResponse(await this.commandBus.execute(new create_receipt_draft_command_1.CreateReceiptDraftCommand({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            warehouseId: request.warehouseId ?? '',
            receiptSourceType: toDomainReceiptSourceType(request.receiptSourceType),
            receiptDate: request.receiptDate ?? undefined,
            referencedReceivingExpectationIds: request.referencedReceivingExpectationIds ?? [],
            note: request.note ?? undefined,
            attachmentRefs: request.attachmentRefs ?? []
        })))));
    }
    async addOrReplaceReceiptLines(request) {
        const context = wms_rpc_context_validator_1.WmsRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'AddOrReplaceReceiptLines',
            resourceType: 'receipt',
            targetId: request.receiptId ?? null,
            requestSummary: {
                receiptId: request.receiptId ?? '',
                lineCount: request.lines?.length ?? 0
            }
        }, async () => wms_grpc_presenter_1.WmsGrpcPresenter.toAddOrReplaceReceiptLinesResponse(await this.commandBus.execute(new add_or_replace_receipt_lines_command_1.AddOrReplaceReceiptLinesCommand({
            tenantId: request.tenantId ?? '',
            receiptId: request.receiptId ?? '',
            lines: (request.lines ?? []).map((line) => ({
                receiptLineId: line.receiptLineId ?? undefined,
                itemId: line.itemId ?? '',
                receivingExpectationId: line.receivingExpectationId ?? undefined,
                targetLocationId: line.targetLocationId ?? '',
                confirmedQuantity: line.confirmedQuantity ?? '',
                uom: line.uom ?? '',
                inventoryStatus: toDomainInventoryStatus(line.inventoryStatus),
                restrictedReason: line.restrictedReason
                    ? {
                        reasonCode: toDomainRestrictedStatusReasonCode(line.restrictedReason.reasonCode),
                        reasonNote: line.restrictedReason.reasonNote ?? undefined
                    }
                    : undefined,
                trackingRefs: (line.trackingRefs ?? []).map((trackingRef) => ({
                    trackingRefType: toDomainReceiptTrackingRefType(trackingRef.trackingRefType),
                    trackingRefValue: trackingRef.trackingRefValue ?? ''
                })),
                physicalDiscrepancy: line.physicalDiscrepancy
                    ? {
                        discrepancyType: toDomainReceiptPhysicalDiscrepancyType(line.physicalDiscrepancy.discrepancyType),
                        discrepancyQuantity: line.physicalDiscrepancy.discrepancyQuantity ?? undefined,
                        note: line.physicalDiscrepancy.note ?? undefined
                    }
                    : undefined,
                evidenceAttachmentRefs: line.evidenceAttachmentRefs ?? []
            }))
        })))));
    }
    async postReceipt(request) {
        const context = wms_rpc_context_validator_1.WmsRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'PostReceipt',
            resourceType: 'receipt',
            targetId: request.receiptId ?? null,
            requestSummary: {
                receiptId: request.receiptId ?? ''
            }
        }, async () => wms_grpc_presenter_1.WmsGrpcPresenter.toPostReceiptResponse(await this.commandBus.execute(new post_receipt_command_1.PostReceiptCommand({
            tenantId: request.tenantId ?? '',
            receiptId: request.receiptId ?? '',
            postComment: request.postComment ?? undefined
        })))));
    }
    async cancelReceiptDraft(request) {
        const context = wms_rpc_context_validator_1.WmsRpcContextValidator.assertManagementContext(request);
        return this.runWithContext(context, () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'CancelReceiptDraft',
            resourceType: 'receipt',
            targetId: request.receiptId ?? null,
            requestSummary: {
                receiptId: request.receiptId ?? ''
            }
        }, async () => wms_grpc_presenter_1.WmsGrpcPresenter.toCancelReceiptDraftResponse(await this.commandBus.execute(new cancel_receipt_draft_command_1.CancelReceiptDraftCommand({
            tenantId: request.tenantId ?? '',
            receiptId: request.receiptId ?? '',
            cancelReason: request.cancelReason ?? ''
        })))));
    }
    runWithContext(context, work) {
        return this.requestContextStore.run(buildDownstreamRequestContext(context), work);
    }
};
exports.WmsManagementGrpcController = WmsManagementGrpcController;
exports.WmsManagementGrpcController = WmsManagementGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.Controller)(),
    (0, wms_service_1.ReceiptManagementServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingCommandBus,
        wms_audit_service_1.WmsAuditService,
        authorization_1.GrpcRequestContextStore])
], WmsManagementGrpcController);
function toDomainReceiptSourceType(value) {
    return value === wms_service_1.ReceiptSourceType.RECEIPT_SOURCE_TYPE_RECEIVING_EXPECTATION_REFERENCE
        ? wms_records_1.ReceiptSourceType.RECEIVING_EXPECTATION_REFERENCE
        : wms_records_1.ReceiptSourceType.MANUAL;
}
function toDomainInventoryStatus(value) {
    return value === wms_service_1.InventoryStatus.INVENTORY_STATUS_RESTRICTED
        ? wms_records_1.InventoryStatus.RESTRICTED
        : wms_records_1.InventoryStatus.AVAILABLE;
}
function toDomainRestrictedStatusReasonCode(value) {
    switch (value) {
        case wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_DAMAGED:
            return wms_records_1.RestrictedStatusReasonCode.DAMAGED;
        case wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_QUALITY_HOLD:
            return wms_records_1.RestrictedStatusReasonCode.QUALITY_HOLD;
        case wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_IDENTIFICATION:
            return wms_records_1.RestrictedStatusReasonCode.PENDING_IDENTIFICATION;
        case wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_DECISION:
            return wms_records_1.RestrictedStatusReasonCode.PENDING_DECISION;
        default:
            return wms_records_1.RestrictedStatusReasonCode.OTHER;
    }
}
function toDomainReceiptTrackingRefType(value) {
    switch (value) {
        case wms_service_1.ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_UNIT_CODE:
            return wms_records_1.ReceiptTrackingRefType.UNIT_CODE;
        case wms_service_1.ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_EXTERNAL_CODE:
            return wms_records_1.ReceiptTrackingRefType.EXTERNAL_CODE;
        case wms_service_1.ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_FREE_TEXT:
            return wms_records_1.ReceiptTrackingRefType.FREE_TEXT;
        default:
            return wms_records_1.ReceiptTrackingRefType.BOX_CODE;
    }
}
function toDomainReceiptPhysicalDiscrepancyType(value) {
    switch (value) {
        case wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_SHORT_RECEIVED:
            return wms_records_1.ReceiptPhysicalDiscrepancyType.SHORT_RECEIVED;
        case wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OVER_RECEIVED:
            return wms_records_1.ReceiptPhysicalDiscrepancyType.OVER_RECEIVED;
        case wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_DAMAGED:
            return wms_records_1.ReceiptPhysicalDiscrepancyType.DAMAGED;
        case wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_WRONG_ITEM:
            return wms_records_1.ReceiptPhysicalDiscrepancyType.WRONG_ITEM;
        case wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_QUALITY_HOLD:
            return wms_records_1.ReceiptPhysicalDiscrepancyType.QUALITY_HOLD;
        default:
            return wms_records_1.ReceiptPhysicalDiscrepancyType.OTHER;
    }
}
function buildDownstreamRequestContext(context) {
    const issuedAt = new Date();
    return {
        internalServiceName: constants_1.SERVICE_NAMES.WMS,
        requestId: context.traceContext.requestId,
        traceId: context.traceContext.traceId,
        operatorContext: {
            operator_id: context.operatorContext.operatorId,
            operator_type: context.operatorContext.operatorType,
            tenant_id: context.tenantId,
            org_id: context.operatorContext.orgId ?? undefined,
            issued_at: issuedAt.toISOString(),
            expires_at: new Date(issuedAt.getTime() + 5 * 60 * 1000).toISOString(),
            issuer: constants_1.SERVICE_NAMES.WMS,
            signature: 'wms-runtime-context'
        }
    };
}
//# sourceMappingURL=wms-management.grpc.controller.js.map