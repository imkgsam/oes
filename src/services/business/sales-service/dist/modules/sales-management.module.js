"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesManagementModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const convert_quote_version_to_order_handler_1 = require("../application/commands/convert-quote-version-to-order.handler");
const create_quote_handler_1 = require("../application/commands/create-quote.handler");
const publish_quote_handler_1 = require("../application/commands/publish-quote.handler");
const set_order_commercial_gate_handler_1 = require("../application/commands/set-order-commercial-gate.handler");
const submit_fulfillment_handoff_handler_1 = require("../application/commands/submit-fulfillment-handoff.handler");
const update_quote_draft_handler_1 = require("../application/commands/update-quote-draft.handler");
const sales_audit_service_1 = require("../application/services/sales-audit.service");
const sales_management_grpc_controller_1 = require("../interfaces/grpc/sales-management.grpc.controller");
/** SalesManagementModule wires the phase 1 sales command handlers, audit service, and gRPC management controller. */
let SalesManagementModule = class SalesManagementModule {
};
exports.SalesManagementModule = SalesManagementModule;
exports.SalesManagementModule = SalesManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule],
        providers: [
            cqrs_2.ValidatingCommandBus,
            sales_audit_service_1.SalesAuditService,
            create_quote_handler_1.CreateQuoteHandler,
            update_quote_draft_handler_1.UpdateQuoteDraftHandler,
            publish_quote_handler_1.PublishQuoteHandler,
            convert_quote_version_to_order_handler_1.ConvertQuoteVersionToOrderHandler,
            set_order_commercial_gate_handler_1.SetOrderCommercialGateHandler,
            submit_fulfillment_handoff_handler_1.SubmitFulfillmentHandoffHandler
        ],
        controllers: [sales_management_grpc_controller_1.SalesManagementGrpcController]
    })
], SalesManagementModule);
//# sourceMappingURL=sales-management.module.js.map