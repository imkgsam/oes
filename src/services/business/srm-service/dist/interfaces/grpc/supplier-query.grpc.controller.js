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
exports.SupplierQueryGrpcController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@oes/common/cqrs");
const filters_1 = require("@oes/common/filters");
const srm_service_1 = require("@oes/common/generated/srm_service");
const get_supplier_query_1 = require("../../application/queries/get-supplier.query");
const list_supplier_addresses_query_1 = require("../../application/queries/list-supplier-addresses.query");
const list_supplier_contacts_query_1 = require("../../application/queries/list-supplier-contacts.query");
const list_supplier_offerings_by_item_query_1 = require("../../application/queries/list-supplier-offerings-by-item.query");
const list_supplier_offerings_by_supplier_query_1 = require("../../application/queries/list-supplier-offerings-by-supplier.query");
const search_suppliers_query_1 = require("../../application/queries/search-suppliers.query");
const srm_records_1 = require("../../domain/models/srm-records");
const supplier_grpc_presenter_1 = require("./supplier-grpc.presenter");
const supplier_rpc_context_validator_1 = require("./supplier-rpc-context.validator");
/** SupplierQueryGrpcController exposes the phase 1 SRM read-only query contract. */
let SupplierQueryGrpcController = class SupplierQueryGrpcController {
    constructor(queryBus) {
        this.queryBus = queryBus;
    }
    async getSupplier(request) {
        supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertQueryContext(request);
        const profile = await this.queryBus.execute(new get_supplier_query_1.GetSupplierQuery(request.tenantId ?? '', request.supplierId ?? ''));
        return supplier_grpc_presenter_1.SupplierGrpcPresenter.toGetSupplierResponse(profile);
    }
    async searchSuppliers(request) {
        supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertQueryContext(request);
        const result = await this.queryBus.execute(new search_suppliers_query_1.SearchSuppliersQuery({
            tenantId: request.tenantId ?? '',
            keyword: request.keyword ?? undefined,
            status: toDomainSupplierStatus(request.status),
            tenantPartyId: request.tenantPartyId ?? undefined,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        }));
        return supplier_grpc_presenter_1.SupplierGrpcPresenter.toSearchSuppliersResponse(result);
    }
    async listSupplierContacts(request) {
        supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertQueryContext(request);
        const result = await this.queryBus.execute(new list_supplier_contacts_query_1.ListSupplierContactsQuery(request.tenantId ?? '', request.supplierId ?? ''));
        return supplier_grpc_presenter_1.SupplierGrpcPresenter.toListSupplierContactsResponse(result);
    }
    async listSupplierAddresses(request) {
        supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertQueryContext(request);
        const result = await this.queryBus.execute(new list_supplier_addresses_query_1.ListSupplierAddressesQuery(request.tenantId ?? '', request.supplierId ?? ''));
        return supplier_grpc_presenter_1.SupplierGrpcPresenter.toListSupplierAddressesResponse(result);
    }
    async listSupplierOfferingsBySupplier(request) {
        supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertQueryContext(request);
        const result = await this.queryBus.execute(new list_supplier_offerings_by_supplier_query_1.ListSupplierOfferingsBySupplierQuery({
            tenantId: request.tenantId ?? '',
            supplierId: request.supplierId ?? '',
            status: toDomainSupplierOfferingStatus(request.status),
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        }));
        return supplier_grpc_presenter_1.SupplierGrpcPresenter.toListSupplierOfferingsBySupplierResponse(result);
    }
    async listSupplierOfferingsByItem(request) {
        supplier_rpc_context_validator_1.SupplierRpcContextValidator.assertQueryContext(request);
        const result = await this.queryBus.execute(new list_supplier_offerings_by_item_query_1.ListSupplierOfferingsByItemQuery({
            tenantId: request.tenantId ?? '',
            itemId: request.itemId ?? '',
            status: toDomainSupplierOfferingStatus(request.status),
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        }));
        return supplier_grpc_presenter_1.SupplierGrpcPresenter.toListSupplierOfferingsByItemResponse(result);
    }
};
exports.SupplierQueryGrpcController = SupplierQueryGrpcController;
exports.SupplierQueryGrpcController = SupplierQueryGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.Controller)(),
    (0, srm_service_1.SupplierQueryServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingQueryBus])
], SupplierQueryGrpcController);
/** toDomainSupplierStatus maps the generated SRM enum filter into the minimal domain status filter. */
function toDomainSupplierStatus(value) {
    if (value === srm_service_1.SupplierStatus.SUPPLIER_STATUS_ACTIVE) {
        return srm_records_1.SupplierStatus.ACTIVE;
    }
    if (value === srm_service_1.SupplierStatus.SUPPLIER_STATUS_INACTIVE) {
        return srm_records_1.SupplierStatus.INACTIVE;
    }
    return undefined;
}
/** toDomainSupplierOfferingStatus maps the generated offering enum filter into the minimal domain status filter. */
function toDomainSupplierOfferingStatus(value) {
    if (value === srm_service_1.SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE) {
        return srm_records_1.SupplierOfferingStatus.ACTIVE;
    }
    if (value === srm_service_1.SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_INACTIVE) {
        return srm_records_1.SupplierOfferingStatus.INACTIVE;
    }
    return undefined;
}
//# sourceMappingURL=supplier-query.grpc.controller.js.map