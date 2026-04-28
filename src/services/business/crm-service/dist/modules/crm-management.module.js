"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmManagementModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const bind_customer_account_to_tenant_party_handler_1 = require("../application/commands/bind-customer-account-to-tenant-party.handler");
const change_customer_status_handler_1 = require("../application/commands/change-customer-status.handler");
const create_customer_account_handler_1 = require("../application/commands/create-customer-account.handler");
const update_customer_account_basics_handler_1 = require("../application/commands/update-customer-account-basics.handler");
const upsert_customer_address_handler_1 = require("../application/commands/upsert-customer-address.handler");
const upsert_customer_contact_handler_1 = require("../application/commands/upsert-customer-contact.handler");
const crm_audit_service_1 = require("../application/services/crm-audit.service");
const customer_management_grpc_controller_1 = require("../interfaces/grpc/customer-management.grpc.controller");
/** CrmManagementModule wires the phase 1 CRM command handlers, audit service, and gRPC controller surface. */
let CrmManagementModule = class CrmManagementModule {
};
exports.CrmManagementModule = CrmManagementModule;
exports.CrmManagementModule = CrmManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule],
        providers: [
            cqrs_2.ValidatingCommandBus,
            crm_audit_service_1.CrmAuditService,
            create_customer_account_handler_1.CreateCustomerAccountHandler,
            update_customer_account_basics_handler_1.UpdateCustomerAccountBasicsHandler,
            bind_customer_account_to_tenant_party_handler_1.BindCustomerAccountToTenantPartyHandler,
            upsert_customer_contact_handler_1.UpsertCustomerContactHandler,
            upsert_customer_address_handler_1.UpsertCustomerAddressHandler,
            change_customer_status_handler_1.ChangeCustomerStatusHandler
        ],
        controllers: [customer_management_grpc_controller_1.CustomerManagementGrpcController]
    })
], CrmManagementModule);
//# sourceMappingURL=crm-management.module.js.map