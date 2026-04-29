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
exports.GetPurchaseRequestHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const procurement_assertions_1 = require("../support/procurement-assertions");
const procurement_query_enrichment_1 = require("../support/procurement-query-enrichment");
const get_purchase_request_query_1 = require("./get-purchase-request.query");
/** GetPurchaseRequestHandler loads one PR aggregate without mutating procurement demand state. */
let GetPurchaseRequestHandler = class GetPurchaseRequestHandler {
    constructor(purchaseRequestRepository, purchaseOrderRepository, receivingRepository) {
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.receivingRepository = receivingRepository;
    }
    async execute(query) {
        (0, procurement_assertions_1.assertRequiredString)(query.tenantId, 'tenantId');
        (0, procurement_assertions_1.assertRequiredString)(query.purchaseRequestId, 'purchaseRequestId');
        const purchaseRequest = (0, procurement_assertions_1.assertExists)(await this.purchaseRequestRepository.findById(query.tenantId, query.purchaseRequestId), 'purchase_request', query.purchaseRequestId);
        return (0, procurement_query_enrichment_1.enrichPurchaseRequestForQuery)(purchaseRequest, this.purchaseOrderRepository, this.receivingRepository);
    }
};
exports.GetPurchaseRequestHandler = GetPurchaseRequestHandler;
exports.GetPurchaseRequestHandler = GetPurchaseRequestHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(get_purchase_request_query_1.GetPurchaseRequestQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_REQUEST_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_ORDER_REPOSITORY)),
    __param(2, (0, common_1.Inject)(tokens_1.TOKENS.RECEIVING_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object])
], GetPurchaseRequestHandler);
//# sourceMappingURL=get-purchase-request.handler.js.map