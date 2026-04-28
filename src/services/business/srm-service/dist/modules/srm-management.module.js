"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SrmManagementModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const bind_supplier_to_tenant_party_handler_1 = require("../application/commands/bind-supplier-to-tenant-party.handler");
const change_supplier_status_handler_1 = require("../application/commands/change-supplier-status.handler");
const create_supplier_profile_handler_1 = require("../application/commands/create-supplier-profile.handler");
const update_supplier_profile_basics_handler_1 = require("../application/commands/update-supplier-profile-basics.handler");
const upsert_supplier_address_handler_1 = require("../application/commands/upsert-supplier-address.handler");
const upsert_supplier_contact_handler_1 = require("../application/commands/upsert-supplier-contact.handler");
const upsert_supplier_offering_handler_1 = require("../application/commands/upsert-supplier-offering.handler");
const srm_audit_service_1 = require("../application/services/srm-audit.service");
const supplier_management_grpc_controller_1 = require("../interfaces/grpc/supplier-management.grpc.controller");
/** SrmManagementModule wires the phase 1 SRM command handlers, audit service, and gRPC controller surface. */
let SrmManagementModule = class SrmManagementModule {
};
exports.SrmManagementModule = SrmManagementModule;
exports.SrmManagementModule = SrmManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule],
        providers: [
            cqrs_2.ValidatingCommandBus,
            srm_audit_service_1.SrmAuditService,
            create_supplier_profile_handler_1.CreateSupplierProfileHandler,
            update_supplier_profile_basics_handler_1.UpdateSupplierProfileBasicsHandler,
            bind_supplier_to_tenant_party_handler_1.BindSupplierToTenantPartyHandler,
            upsert_supplier_contact_handler_1.UpsertSupplierContactHandler,
            upsert_supplier_address_handler_1.UpsertSupplierAddressHandler,
            upsert_supplier_offering_handler_1.UpsertSupplierOfferingHandler,
            change_supplier_status_handler_1.ChangeSupplierStatusHandler
        ],
        controllers: [supplier_management_grpc_controller_1.SupplierManagementGrpcController]
    })
], SrmManagementModule);
//# sourceMappingURL=srm-management.module.js.map