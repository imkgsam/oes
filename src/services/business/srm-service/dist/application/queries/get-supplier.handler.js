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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSupplierHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const srm_errors_1 = require("../../common/errors/srm.errors");
const srm_assertions_1 = require("../support/srm-assertions");
const get_supplier_query_1 = require("./get-supplier.query");
/** GetSupplierHandler loads one SRM supplier-profile shell and its active primary binding summary. */
let GetSupplierHandler = class GetSupplierHandler {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }
    async execute(query) {
        (0, srm_assertions_1.assertRequiredString)(query.tenantId, 'tenantId');
        (0, srm_assertions_1.assertRequiredString)(query.supplierId, 'supplierId');
        const account = await this.accountRepository.findById(query.tenantId, query.supplierId);
        if (!account) {
            throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_NOT_FOUND, {
                resource: 'supplierProfile',
                supplierId: query.supplierId
            });
        }
        return account;
    }
};
exports.GetSupplierHandler = GetSupplierHandler;
exports.GetSupplierHandler = GetSupplierHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(get_supplier_query_1.GetSupplierQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_PROFILE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], GetSupplierHandler);
//# sourceMappingURL=get-supplier.handler.js.map