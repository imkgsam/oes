"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementManagementModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const create_purchase_request_handler_1 = require("../application/commands/create-purchase-request.handler");
const update_purchase_request_draft_handler_1 = require("../application/commands/update-purchase-request-draft.handler");
const submit_purchase_request_handler_1 = require("../application/commands/submit-purchase-request.handler");
const decide_purchase_request_handler_1 = require("../application/commands/decide-purchase-request.handler");
const cancel_purchase_request_handler_1 = require("../application/commands/cancel-purchase-request.handler");
const convert_purchase_request_to_purchase_order_handler_1 = require("../application/commands/convert-purchase-request-to-purchase-order.handler");
const create_purchase_order_draft_handler_1 = require("../application/commands/create-purchase-order-draft.handler");
const update_purchase_order_draft_handler_1 = require("../application/commands/update-purchase-order-draft.handler");
const issue_purchase_order_handler_1 = require("../application/commands/issue-purchase-order.handler");
const confirm_supplier_acknowledgement_handler_1 = require("../application/commands/confirm-supplier-acknowledgement.handler");
const apply_purchase_order_change_handler_1 = require("../application/commands/apply-purchase-order-change.handler");
const cancel_purchase_order_handler_1 = require("../application/commands/cancel-purchase-order.handler");
const create_receiving_expectation_handler_1 = require("../application/commands/create-receiving-expectation.handler");
const record_receiving_discrepancy_resolution_handler_1 = require("../application/commands/record-receiving-discrepancy-resolution.handler");
const procurement_audit_service_1 = require("../application/services/procurement-audit.service");
const procurement_management_grpc_controller_1 = require("../interfaces/grpc/procurement-management.grpc.controller");
/** ProcurementManagementModule wires the phase 1 procurement command handlers, audit service, and gRPC controller surface. */
let ProcurementManagementModule = class ProcurementManagementModule {
};
exports.ProcurementManagementModule = ProcurementManagementModule;
exports.ProcurementManagementModule = ProcurementManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule],
        providers: [
            cqrs_2.ValidatingCommandBus,
            procurement_audit_service_1.ProcurementAuditService,
            create_purchase_request_handler_1.CreatePurchaseRequestHandler,
            update_purchase_request_draft_handler_1.UpdatePurchaseRequestDraftHandler,
            submit_purchase_request_handler_1.SubmitPurchaseRequestHandler,
            decide_purchase_request_handler_1.DecidePurchaseRequestHandler,
            cancel_purchase_request_handler_1.CancelPurchaseRequestHandler,
            convert_purchase_request_to_purchase_order_handler_1.ConvertPurchaseRequestToPurchaseOrderHandler,
            create_purchase_order_draft_handler_1.CreatePurchaseOrderDraftHandler,
            update_purchase_order_draft_handler_1.UpdatePurchaseOrderDraftHandler,
            issue_purchase_order_handler_1.IssuePurchaseOrderHandler,
            confirm_supplier_acknowledgement_handler_1.ConfirmSupplierAcknowledgementHandler,
            apply_purchase_order_change_handler_1.ApplyPurchaseOrderChangeHandler,
            cancel_purchase_order_handler_1.CancelPurchaseOrderHandler,
            create_receiving_expectation_handler_1.CreateReceivingExpectationHandler,
            record_receiving_discrepancy_resolution_handler_1.RecordReceivingDiscrepancyResolutionHandler
        ],
        controllers: [procurement_management_grpc_controller_1.ProcurementManagementGrpcController]
    })
], ProcurementManagementModule);
//# sourceMappingURL=procurement-management.module.js.map