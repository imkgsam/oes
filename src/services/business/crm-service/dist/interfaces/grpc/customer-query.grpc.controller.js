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
exports.CustomerQueryGrpcController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@oes/common/cqrs");
const filters_1 = require("@oes/common/filters");
const crm_service_1 = require("@oes/common/generated/crm_service");
const get_customer_account_query_1 = require("../../application/queries/get-customer-account.query");
const list_customer_addresses_query_1 = require("../../application/queries/list-customer-addresses.query");
const list_customer_contacts_query_1 = require("../../application/queries/list-customer-contacts.query");
const search_customer_accounts_query_1 = require("../../application/queries/search-customer-accounts.query");
const search_selectable_customers_query_1 = require("../../application/queries/search-selectable-customers.query");
const crm_records_1 = require("../../domain/models/crm-records");
const customer_grpc_presenter_1 = require("./customer-grpc.presenter");
const customer_rpc_context_validator_1 = require("./customer-rpc-context.validator");
/** CustomerQueryGrpcController exposes the phase 1 CRM read-only query contract. */
let CustomerQueryGrpcController = class CustomerQueryGrpcController {
    constructor(queryBus) {
        this.queryBus = queryBus;
    }
    async searchSelectableCustomers(request) {
        customer_rpc_context_validator_1.CustomerRpcContextValidator.assertQueryContext(request);
        const result = await this.queryBus.execute(new search_selectable_customers_query_1.SearchSelectableCustomersQuery({
            tenantId: request.tenantId ?? '',
            keyword: request.keyword ?? undefined,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        }));
        return customer_grpc_presenter_1.CustomerGrpcPresenter.toSearchSelectableCustomersResponse(result);
    }
    async getCustomerAccount(request) {
        customer_rpc_context_validator_1.CustomerRpcContextValidator.assertQueryContext(request);
        const account = await this.queryBus.execute(new get_customer_account_query_1.GetCustomerAccountQuery(request.tenantId ?? '', request.customerAccountId ?? ''));
        return customer_grpc_presenter_1.CustomerGrpcPresenter.toGetCustomerAccountResponse(account);
    }
    async searchCustomerAccounts(request) {
        customer_rpc_context_validator_1.CustomerRpcContextValidator.assertQueryContext(request);
        const result = await this.queryBus.execute(new search_customer_accounts_query_1.SearchCustomerAccountsQuery({
            tenantId: request.tenantId ?? '',
            keyword: request.keyword ?? undefined,
            status: toDomainCustomerStatus(request.status),
            primaryTenantPartyId: request.primaryTenantPartyId ?? undefined,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        }));
        return customer_grpc_presenter_1.CustomerGrpcPresenter.toSearchCustomerAccountsResponse(result);
    }
    async listCustomerContacts(request) {
        customer_rpc_context_validator_1.CustomerRpcContextValidator.assertQueryContext(request);
        const result = await this.queryBus.execute(new list_customer_contacts_query_1.ListCustomerContactsQuery(request.tenantId ?? '', request.customerAccountId ?? ''));
        return customer_grpc_presenter_1.CustomerGrpcPresenter.toListCustomerContactsResponse(result);
    }
    async listCustomerAddresses(request) {
        customer_rpc_context_validator_1.CustomerRpcContextValidator.assertQueryContext(request);
        const result = await this.queryBus.execute(new list_customer_addresses_query_1.ListCustomerAddressesQuery(request.tenantId ?? '', request.customerAccountId ?? ''));
        return customer_grpc_presenter_1.CustomerGrpcPresenter.toListCustomerAddressesResponse(result);
    }
};
exports.CustomerQueryGrpcController = CustomerQueryGrpcController;
exports.CustomerQueryGrpcController = CustomerQueryGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.Controller)(),
    (0, crm_service_1.CustomerQueryServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingQueryBus])
], CustomerQueryGrpcController);
/** toDomainCustomerStatus maps the generated CRM enum filter into the minimal domain status filter. */
function toDomainCustomerStatus(value) {
    if (value === crm_service_1.CustomerStatus.CUSTOMER_STATUS_BLOCKED) {
        return crm_records_1.CustomerStatus.BLOCKED;
    }
    if (value === crm_service_1.CustomerStatus.CUSTOMER_STATUS_ARCHIVED) {
        return crm_records_1.CustomerStatus.ARCHIVED;
    }
    if (value === crm_service_1.CustomerStatus.CUSTOMER_STATUS_ACTIVE_CUSTOMER) {
        return crm_records_1.CustomerStatus.ACTIVE_CUSTOMER;
    }
    return undefined;
}
//# sourceMappingURL=customer-query.grpc.controller.js.map