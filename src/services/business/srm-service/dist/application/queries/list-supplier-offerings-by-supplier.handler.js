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
exports.ListSupplierOfferingsBySupplierHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const srm_errors_1 = require("../../common/errors/srm.errors");
const srm_assertions_1 = require("../support/srm-assertions");
const list_supplier_offerings_by_supplier_query_1 = require("./list-supplier-offerings-by-supplier.query");
/** ListSupplierOfferingsBySupplierHandler returns the current offering facts for one existing supplier profile. */
let ListSupplierOfferingsBySupplierHandler = class ListSupplierOfferingsBySupplierHandler {
    constructor(profileRepository, offeringRepository) {
        this.profileRepository = profileRepository;
        this.offeringRepository = offeringRepository;
    }
    async execute(query) {
        (0, srm_assertions_1.assertRequiredString)(query.input.tenantId, 'tenantId');
        (0, srm_assertions_1.assertRequiredString)(query.input.supplierId, 'supplierId');
        const supplier = await this.profileRepository.findById(query.input.tenantId, query.input.supplierId);
        if (!supplier) {
            throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_NOT_FOUND, {
                resource: 'supplierProfile',
                supplierId: query.input.supplierId
            });
        }
        const { page, pageSize } = (0, srm_assertions_1.normalizePageInput)(query.input.page, query.input.pageSize);
        const result = await this.offeringRepository.listBySupplierId(query.input.tenantId, query.input.supplierId, query.input.status, page, pageSize);
        return {
            offerings: result.items,
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        };
    }
};
exports.ListSupplierOfferingsBySupplierHandler = ListSupplierOfferingsBySupplierHandler;
exports.ListSupplierOfferingsBySupplierHandler = ListSupplierOfferingsBySupplierHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(list_supplier_offerings_by_supplier_query_1.ListSupplierOfferingsBySupplierQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_PROFILE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_OFFERING_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], ListSupplierOfferingsBySupplierHandler);
//# sourceMappingURL=list-supplier-offerings-by-supplier.handler.js.map