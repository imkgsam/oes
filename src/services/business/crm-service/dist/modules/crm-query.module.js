"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmQueryModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const get_customer_account_handler_1 = require("../application/queries/get-customer-account.handler");
const list_customer_addresses_handler_1 = require("../application/queries/list-customer-addresses.handler");
const list_customer_contacts_handler_1 = require("../application/queries/list-customer-contacts.handler");
const search_customer_accounts_handler_1 = require("../application/queries/search-customer-accounts.handler");
const search_selectable_customers_handler_1 = require("../application/queries/search-selectable-customers.handler");
const customer_query_grpc_controller_1 = require("../interfaces/grpc/customer-query.grpc.controller");
/** CrmQueryModule wires the phase 1 CRM query handlers and gRPC controller surface. */
let CrmQueryModule = class CrmQueryModule {
};
exports.CrmQueryModule = CrmQueryModule;
exports.CrmQueryModule = CrmQueryModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule],
        providers: [
            cqrs_2.ValidatingQueryBus,
            get_customer_account_handler_1.GetCustomerAccountHandler,
            search_selectable_customers_handler_1.SearchSelectableCustomersHandler,
            search_customer_accounts_handler_1.SearchCustomerAccountsHandler,
            list_customer_contacts_handler_1.ListCustomerContactsHandler,
            list_customer_addresses_handler_1.ListCustomerAddressesHandler
        ],
        controllers: [customer_query_grpc_controller_1.CustomerQueryGrpcController]
    })
], CrmQueryModule);
//# sourceMappingURL=crm-query.module.js.map