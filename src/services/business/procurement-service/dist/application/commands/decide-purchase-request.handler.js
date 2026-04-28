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
exports.DecidePurchaseRequestHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const procurement_records_1 = require("../../domain/models/procurement-records");
const procurement_assertions_1 = require("../support/procurement-assertions");
const procurement_write_support_1 = require("../support/procurement-write-support");
const decide_purchase_request_command_1 = require("./decide-purchase-request.command");
/** DecidePurchaseRequestHandler freezes one APPROVED or REJECTED snapshot on a submitted PR. */
let DecidePurchaseRequestHandler = class DecidePurchaseRequestHandler {
    constructor(purchaseRequestRepository) {
        this.purchaseRequestRepository = purchaseRequestRepository;
    }
    async execute(command) {
        (0, procurement_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.purchaseRequestId, 'purchaseRequestId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.decidedBy.operatorId, 'decidedBy.operatorId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.decidedBy.displayName, 'decidedBy.displayName');
        const decision = (0, procurement_assertions_1.assertKnownPurchaseRequestDecision)(command.payload.decision);
        const existing = (0, procurement_assertions_1.assertExists)(await this.purchaseRequestRepository.findById(command.payload.tenantId, command.payload.purchaseRequestId), 'purchase_request', command.payload.purchaseRequestId);
        (0, procurement_assertions_1.assertPrecondition)(existing.status === procurement_records_1.PurchaseRequestStatus.SUBMITTED, 'only SUBMITTED purchase requests can be decided');
        const decidedAt = (0, procurement_write_support_1.nowIso)();
        return this.purchaseRequestRepository.save({
            ...existing,
            status: decision === procurement_records_1.PurchaseRequestDecision.APPROVED
                ? procurement_records_1.PurchaseRequestStatus.APPROVED
                : procurement_records_1.PurchaseRequestStatus.REJECTED,
            approvalSnapshot: {
                purchaseRequestApprovalSnapshotId: existing.approvalSnapshot?.purchaseRequestApprovalSnapshotId ?? (0, node_crypto_1.randomUUID)(),
                decision,
                decidedBy: {
                    operatorId: command.payload.decidedBy.operatorId.trim(),
                    displayName: command.payload.decidedBy.displayName.trim()
                },
                decidedAt,
                comment: (0, procurement_assertions_1.normalizeOptionalString)(command.payload.comment) ?? null,
                approvalReference: (0, procurement_assertions_1.normalizeOptionalString)(command.payload.approvalReference) ?? null
            },
            decidedAt,
            updatedAt: decidedAt
        });
    }
};
exports.DecidePurchaseRequestHandler = DecidePurchaseRequestHandler;
exports.DecidePurchaseRequestHandler = DecidePurchaseRequestHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(decide_purchase_request_command_1.DecidePurchaseRequestCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_REQUEST_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], DecidePurchaseRequestHandler);
//# sourceMappingURL=decide-purchase-request.handler.js.map