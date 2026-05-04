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
exports.GetReceiptHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const wms_assertions_1 = require("../support/wms-assertions");
const get_receipt_query_1 = require("./get-receipt.query");
/** GetReceiptHandler returns one WMS-owned receipt aggregate for the query surface. */
let GetReceiptHandler = class GetReceiptHandler {
    constructor(receiptRepository) {
        this.receiptRepository = receiptRepository;
    }
    async execute(query) {
        (0, wms_assertions_1.assertRequiredString)(query.tenantId, 'tenantId');
        (0, wms_assertions_1.assertRequiredString)(query.receiptId, 'receiptId');
        return (0, wms_assertions_1.assertExists)(await this.receiptRepository.findById(query.tenantId, query.receiptId), 'receipt', query.receiptId);
    }
};
exports.GetReceiptHandler = GetReceiptHandler;
exports.GetReceiptHandler = GetReceiptHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(get_receipt_query_1.GetReceiptQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.RECEIPT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], GetReceiptHandler);
//# sourceMappingURL=get-receipt.handler.js.map