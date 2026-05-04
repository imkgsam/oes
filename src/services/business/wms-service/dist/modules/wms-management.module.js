"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WmsManagementModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const add_or_replace_receipt_lines_handler_1 = require("../application/commands/add-or-replace-receipt-lines.handler");
const cancel_receipt_draft_handler_1 = require("../application/commands/cancel-receipt-draft.handler");
const create_receipt_draft_handler_1 = require("../application/commands/create-receipt-draft.handler");
const post_receipt_handler_1 = require("../application/commands/post-receipt.handler");
const wms_audit_service_1 = require("../application/services/wms-audit.service");
const wms_management_grpc_controller_1 = require("../interfaces/grpc/wms-management.grpc.controller");
/** WmsManagementModule wires the phase 1 WMS command handlers, audit service, and gRPC controller surface. */
let WmsManagementModule = class WmsManagementModule {
};
exports.WmsManagementModule = WmsManagementModule;
exports.WmsManagementModule = WmsManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule],
        providers: [
            cqrs_2.ValidatingCommandBus,
            wms_audit_service_1.WmsAuditService,
            create_receipt_draft_handler_1.CreateReceiptDraftHandler,
            add_or_replace_receipt_lines_handler_1.AddOrReplaceReceiptLinesHandler,
            post_receipt_handler_1.PostReceiptHandler,
            cancel_receipt_draft_handler_1.CancelReceiptDraftHandler
        ],
        controllers: [wms_management_grpc_controller_1.WmsManagementGrpcController]
    })
], WmsManagementModule);
//# sourceMappingURL=wms-management.module.js.map