"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SrmQueryModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const get_supplier_handler_1 = require("../application/queries/get-supplier.handler");
const list_supplier_addresses_handler_1 = require("../application/queries/list-supplier-addresses.handler");
const list_supplier_contacts_handler_1 = require("../application/queries/list-supplier-contacts.handler");
const list_supplier_offerings_by_item_handler_1 = require("../application/queries/list-supplier-offerings-by-item.handler");
const list_supplier_offerings_by_supplier_handler_1 = require("../application/queries/list-supplier-offerings-by-supplier.handler");
const search_suppliers_handler_1 = require("../application/queries/search-suppliers.handler");
const supplier_query_grpc_controller_1 = require("../interfaces/grpc/supplier-query.grpc.controller");
/** SrmQueryModule wires the phase 1 SRM query handlers and gRPC controller surface. */
let SrmQueryModule = class SrmQueryModule {
};
exports.SrmQueryModule = SrmQueryModule;
exports.SrmQueryModule = SrmQueryModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule],
        providers: [
            cqrs_2.ValidatingQueryBus,
            get_supplier_handler_1.GetSupplierHandler,
            search_suppliers_handler_1.SearchSuppliersHandler,
            list_supplier_contacts_handler_1.ListSupplierContactsHandler,
            list_supplier_addresses_handler_1.ListSupplierAddressesHandler,
            list_supplier_offerings_by_supplier_handler_1.ListSupplierOfferingsBySupplierHandler,
            list_supplier_offerings_by_item_handler_1.ListSupplierOfferingsByItemHandler
        ],
        controllers: [supplier_query_grpc_controller_1.SupplierQueryGrpcController]
    })
], SrmQueryModule);
//# sourceMappingURL=srm-query.module.js.map