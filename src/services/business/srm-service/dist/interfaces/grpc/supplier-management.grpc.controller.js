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
exports.SupplierManagementGrpcController = void 0;
const common_1 = require("@nestjs/common");
const authorization_1 = require("@oes/common/authorization");
const constants_1 = require("@oes/common/constants");
const cqrs_1 = require("@oes/common/cqrs");
const filters_1 = require("@oes/common/filters");
const srm_service_1 = require("@oes/common/generated/srm_service");
const bind_supplier_to_tenant_party_command_1 = require("../../application/commands/bind-supplier-to-tenant-party.command");
const change_supplier_status_command_1 = require("../../application/commands/change-supplier-status.command");
const create_supplier_profile_command_1 = require("../../application/commands/create-supplier-profile.command");
const update_supplier_profile_basics_command_1 = require("../../application/commands/update-supplier-profile-basics.command");
const upsert_supplier_address_command_1 = require("../../application/commands/upsert-supplier-address.command");
const upsert_supplier_contact_command_1 = require("../../application/commands/upsert-supplier-contact.command");
const upsert_supplier_offering_command_1 = require("../../application/commands/upsert-supplier-offering.command");
const srm_audit_service_1 = require("../../application/services/srm-audit.service");
const srm_assertions_1 = require("../../application/support/srm-assertions");
const srm_records_1 = require("../../domain/models/srm-records");
const supplier_grpc_presenter_1 = require("./supplier-grpc.presenter");
const supplier_rpc_context_validator_1 = require("./supplier-rpc-context.validator");
/** SupplierManagementGrpcController exposes the SRM phase 1 command contract with local audit envelope recording. */
let SupplierManagementGrpcController = class SupplierManagementGrpcController {
    constructor(commandBus, auditService, requestContextStore) {
        this.commandBus = commandBus;
        this.auditService = auditService;
        this.requestContextStore = requestContextStore;
    }
    async createSupplierProfile(request) {
        const context = supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'CreateSupplierProfile',
            resourceType: 'supplier_profile',
            targetId: null,
            requestSummary: {
                displayName: request.displayName ?? '',
                supplierNo: request.supplierNo ?? ''
            }
        }, async () => {
            const profile = await this.commandBus.execute(new create_supplier_profile_command_1.CreateSupplierProfileCommand({
                tenantId: request.tenantId ?? '',
                displayName: request.displayName ?? '',
                supplierNo: (0, srm_assertions_1.normalizeOptionalString)(request.supplierNo),
                supplierCategory: (0, srm_assertions_1.normalizeOptionalString)(request.supplierCategory),
                tags: request.tags ?? []
            }));
            return supplier_grpc_presenter_1.SupplierGrpcPresenter.toCreateSupplierProfileResponse(profile);
        });
    }
    async updateSupplierProfileBasics(request) {
        const context = supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'UpdateSupplierProfileBasics',
            resourceType: 'supplier_profile',
            targetId: request.supplierId ?? null,
            requestSummary: {
                supplierId: request.supplierId ?? ''
            }
        }, async () => {
            const profile = await this.commandBus.execute(new update_supplier_profile_basics_command_1.UpdateSupplierProfileBasicsCommand({
                tenantId: request.tenantId ?? '',
                supplierId: request.supplierId ?? '',
                displayName: (0, srm_assertions_1.normalizeOptionalString)(request.displayName),
                supplierNo: (0, srm_assertions_1.normalizeOptionalString)(request.supplierNo),
                supplierCategory: request.supplierCategory !== undefined
                    ? (0, srm_assertions_1.normalizeOptionalString)(request.supplierCategory) ?? ''
                    : undefined,
                tags: request.tags
            }));
            return supplier_grpc_presenter_1.SupplierGrpcPresenter.toUpdateSupplierProfileBasicsResponse(profile);
        });
    }
    async bindSupplierToTenantParty(request) {
        const context = supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'BindSupplierToTenantParty',
            resourceType: 'supplier_party_binding',
            targetId: request.supplierId ?? null,
            requestSummary: {
                supplierId: request.supplierId ?? '',
                tenantPartyId: request.tenantPartyId ?? ''
            }
        }, async () => {
            const profile = await this.commandBus.execute(new bind_supplier_to_tenant_party_command_1.BindSupplierToTenantPartyCommand({
                tenantId: request.tenantId ?? '',
                supplierId: request.supplierId ?? '',
                tenantPartyId: request.tenantPartyId ?? ''
            }));
            return supplier_grpc_presenter_1.SupplierGrpcPresenter.toBindSupplierToTenantPartyResponse(profile);
        });
    }
    async upsertSupplierContact(request) {
        const context = supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'UpsertSupplierContact',
            resourceType: 'supplier_contact',
            targetId: request.supplierContactId ?? request.supplierId ?? null,
            requestSummary: {
                supplierId: request.supplierId ?? '',
                supplierContactId: request.supplierContactId ?? ''
            }
        }, async () => {
            const contact = await this.commandBus.execute(new upsert_supplier_contact_command_1.UpsertSupplierContactCommand({
                tenantId: request.tenantId ?? '',
                supplierId: request.supplierId ?? '',
                supplierContactId: (0, srm_assertions_1.normalizeOptionalString)(request.supplierContactId),
                displayName: request.displayName ?? '',
                roleTitle: (0, srm_assertions_1.normalizeOptionalString)(request.roleTitle),
                email: (0, srm_assertions_1.normalizeOptionalString)(request.email),
                phone: (0, srm_assertions_1.normalizeOptionalString)(request.phone),
                isPrimaryContact: request.isPrimaryContact,
                isActive: request.isActive
            }));
            return supplier_grpc_presenter_1.SupplierGrpcPresenter.toUpsertSupplierContactResponse(contact);
        });
    }
    async upsertSupplierAddress(request) {
        const context = supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'UpsertSupplierAddress',
            resourceType: 'supplier_address',
            targetId: request.supplierAddressId ?? request.supplierId ?? null,
            requestSummary: {
                supplierId: request.supplierId ?? '',
                supplierAddressId: request.supplierAddressId ?? ''
            }
        }, async () => {
            const address = await this.commandBus.execute(new upsert_supplier_address_command_1.UpsertSupplierAddressCommand({
                tenantId: request.tenantId ?? '',
                supplierId: request.supplierId ?? '',
                supplierAddressId: (0, srm_assertions_1.normalizeOptionalString)(request.supplierAddressId),
                label: request.label ?? '',
                countryCode: request.countryCode ?? '',
                region: (0, srm_assertions_1.normalizeOptionalString)(request.region),
                locality: (0, srm_assertions_1.normalizeOptionalString)(request.locality),
                addressLine1: request.addressLine1 ?? '',
                addressLine2: (0, srm_assertions_1.normalizeOptionalString)(request.addressLine2),
                postalCode: (0, srm_assertions_1.normalizeOptionalString)(request.postalCode),
                isPrimaryAddress: request.isPrimaryAddress,
                isActive: request.isActive
            }));
            return supplier_grpc_presenter_1.SupplierGrpcPresenter.toUpsertSupplierAddressResponse(address);
        });
    }
    async upsertSupplierOffering(request) {
        const context = supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertManagementContext(request);
        return this.requestContextStore.run(buildDownstreamRequestContext(context), () => this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'UpsertSupplierOffering',
            resourceType: 'supplier_offering',
            targetId: request.supplierOfferingId ?? request.supplierId ?? null,
            requestSummary: {
                supplierId: request.supplierId ?? '',
                itemId: request.itemId ?? '',
                targetStatus: request.targetStatus ?? 0
            }
        }, async () => {
            const offering = await this.commandBus.execute(new upsert_supplier_offering_command_1.UpsertSupplierOfferingCommand({
                tenantId: request.tenantId ?? '',
                supplierOfferingId: (0, srm_assertions_1.normalizeOptionalString)(request.supplierOfferingId),
                supplierId: request.supplierId ?? '',
                itemId: request.itemId ?? '',
                targetStatus: toDomainSupplierOfferingStatus(request.targetStatus)
            }));
            return supplier_grpc_presenter_1.SupplierGrpcPresenter.toUpsertSupplierOfferingResponse(offering);
        }));
    }
    async changeSupplierStatus(request) {
        const context = supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertManagementContext(request);
        return this.auditService.recordCommand({
            tenantId: context.tenantId,
            operatorContext: context.operatorContext,
            traceContext: context.traceContext,
            auditContext: context.auditContext,
            commandName: 'ChangeSupplierStatus',
            resourceType: 'supplier_profile',
            targetId: request.supplierId ?? null,
            requestSummary: {
                supplierId: request.supplierId ?? '',
                targetStatus: request.targetStatus ?? 0
            }
        }, async () => {
            const profile = await this.commandBus.execute(new change_supplier_status_command_1.ChangeSupplierStatusCommand({
                tenantId: request.tenantId ?? '',
                supplierId: request.supplierId ?? '',
                targetStatus: toDomainSupplierStatus(request.targetStatus)
            }));
            return supplier_grpc_presenter_1.SupplierGrpcPresenter.toChangeSupplierStatusResponse(profile);
        });
    }
};
exports.SupplierManagementGrpcController = SupplierManagementGrpcController;
exports.SupplierManagementGrpcController = SupplierManagementGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.Controller)(),
    (0, srm_service_1.SupplierManagementServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingCommandBus,
        srm_audit_service_1.SrmAuditService,
        authorization_1.GrpcRequestContextStore])
], SupplierManagementGrpcController);
/** toDomainSupplierStatus maps the generated SRM status enum into the frozen domain status set. */
function toDomainSupplierStatus(value) {
    if (value === srm_service_1.SupplierStatus.SUPPLIER_STATUS_INACTIVE) {
        return srm_records_1.SupplierStatus.INACTIVE;
    }
    return srm_records_1.SupplierStatus.ACTIVE;
}
/** toDomainSupplierOfferingStatus maps the generated offering enum into the frozen domain status set. */
function toDomainSupplierOfferingStatus(value) {
    if (value === srm_service_1.SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_INACTIVE) {
        return srm_records_1.SupplierOfferingStatus.INACTIVE;
    }
    return srm_records_1.SupplierOfferingStatus.ACTIVE;
}
/** buildDownstreamRequestContext bridges the validated SRM RPC payload context into downstream guarded gRPC calls. */
function buildDownstreamRequestContext(context) {
    const issuedAt = new Date();
    return {
        internalServiceName: constants_1.SERVICE_NAMES.SRM,
        requestId: context.traceContext.requestId,
        traceId: context.traceContext.traceId,
        operatorContext: {
            operator_id: context.operatorContext.operatorId,
            operator_type: context.operatorContext.operatorType,
            tenant_id: context.tenantId,
            org_id: context.operatorContext.orgId ?? undefined,
            issued_at: issuedAt.toISOString(),
            expires_at: new Date(issuedAt.getTime() + 5 * 60 * 1000).toISOString(),
            issuer: constants_1.SERVICE_NAMES.SRM,
            signature: 'srm-runtime-context'
        }
    };
}
//# sourceMappingURL=supplier-management.grpc.controller.js.map