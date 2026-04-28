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
exports.SubmitPurchaseRequestHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const procurement_records_1 = require("../../domain/models/procurement-records");
const procurement_assertions_1 = require("../support/procurement-assertions");
const procurement_write_support_1 = require("../support/procurement-write-support");
const submit_purchase_request_command_1 = require("./submit-purchase-request.command");
/** SubmitPurchaseRequestHandler freezes one PR draft for decision without creating a procurement commitment. */
let SubmitPurchaseRequestHandler = class SubmitPurchaseRequestHandler {
    constructor(purchaseRequestRepository) {
        this.purchaseRequestRepository = purchaseRequestRepository;
    }
    async execute(command) {
        (0, procurement_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.purchaseRequestId, 'purchaseRequestId');
        const existing = (0, procurement_assertions_1.assertExists)(await this.purchaseRequestRepository.findById(command.payload.tenantId, command.payload.purchaseRequestId), 'purchase_request', command.payload.purchaseRequestId);
        (0, procurement_assertions_1.assertPrecondition)(existing.status === procurement_records_1.PurchaseRequestStatus.DRAFT, 'only DRAFT purchase requests can be submitted');
        (0, procurement_assertions_1.assertPrecondition)(existing.lines.length > 0, 'purchase request must have at least one line before submit');
        const submittedAt = (0, procurement_write_support_1.nowIso)();
        return this.purchaseRequestRepository.save({
            ...existing,
            status: procurement_records_1.PurchaseRequestStatus.SUBMITTED,
            submissionComment: (0, procurement_assertions_1.normalizeOptionalString)(command.payload.submissionComment) ?? null,
            submittedAt,
            updatedAt: submittedAt
        });
    }
};
exports.SubmitPurchaseRequestHandler = SubmitPurchaseRequestHandler;
exports.SubmitPurchaseRequestHandler = SubmitPurchaseRequestHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(submit_purchase_request_command_1.SubmitPurchaseRequestCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_REQUEST_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], SubmitPurchaseRequestHandler);
//# sourceMappingURL=submit-purchase-request.handler.js.map