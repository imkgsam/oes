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
exports.RecordReceivingDiscrepancyResolutionHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const procurement_records_1 = require("../../domain/models/procurement-records");
const procurement_assertions_1 = require("../support/procurement-assertions");
const procurement_write_support_1 = require("../support/procurement-write-support");
const record_receiving_discrepancy_resolution_command_1 = require("./record-receiving-discrepancy-resolution.command");
/** RecordReceivingDiscrepancyResolutionHandler records procurement-side discrepancy decisions without mutating inventory truth. */
let RecordReceivingDiscrepancyResolutionHandler = class RecordReceivingDiscrepancyResolutionHandler {
    constructor(receivingRepository) {
        this.receivingRepository = receivingRepository;
    }
    async execute(command) {
        (0, procurement_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.receivingExpectationId, 'receivingExpectationId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.receivingDiscrepancyId, 'receivingDiscrepancyId');
        const resolutionCode = (0, procurement_assertions_1.assertKnownReceivingResolutionCode)(command.payload.resolutionCode);
        const existing = (0, procurement_assertions_1.assertExists)(await this.receivingRepository.findById(command.payload.tenantId, command.payload.receivingExpectationId), 'receiving_expectation', command.payload.receivingExpectationId);
        const discrepancy = (0, procurement_assertions_1.assertExists)(existing.discrepancy, 'receiving_discrepancy', command.payload.receivingDiscrepancyId);
        (0, procurement_assertions_1.assertPrecondition)(discrepancy.receivingDiscrepancyId === command.payload.receivingDiscrepancyId, 'receiving discrepancy does not belong to expectation');
        (0, procurement_assertions_1.assertPrecondition)(discrepancy.status === 'OPEN', 'receiving discrepancy must be OPEN before resolution');
        assertResolutionCompatible(discrepancy, resolutionCode, command.payload.resolutionReferences ?? []);
        const resolvedAt = (0, procurement_write_support_1.nowIso)();
        const updatedDiscrepancy = {
            ...discrepancy,
            status: 'RESOLVED',
            resolutionCode,
            resolutionNote: (0, procurement_assertions_1.normalizeOptionalString)(command.payload.resolutionNote) ?? null,
            resolutionReferences: (command.payload.resolutionReferences ?? []).map((reference) => ({
                referenceType: reference.referenceType.trim(),
                referenceId: reference.referenceId.trim()
            })),
            resolvedAt
        };
        const receivingExpectation = await this.receivingRepository.save({
            ...existing,
            updatedAt: resolvedAt,
            discrepancy: updatedDiscrepancy
        });
        return {
            receivingExpectation,
            receivingDiscrepancy: updatedDiscrepancy
        };
    }
};
exports.RecordReceivingDiscrepancyResolutionHandler = RecordReceivingDiscrepancyResolutionHandler;
exports.RecordReceivingDiscrepancyResolutionHandler = RecordReceivingDiscrepancyResolutionHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(record_receiving_discrepancy_resolution_command_1.RecordReceivingDiscrepancyResolutionCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.RECEIVING_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], RecordReceivingDiscrepancyResolutionHandler);
function assertResolutionCompatible(discrepancy, resolutionCode, resolutionReferences) {
    const allowed = new Map([
        [
            'SHORT_RECEIVED',
            [
                procurement_records_1.ReceivingResolutionCode.WAIT_REDELIVERY,
                procurement_records_1.ReceivingResolutionCode.CLOSE_UNRECEIVED,
                procurement_records_1.ReceivingResolutionCode.REQUEST_RESEND
            ]
        ],
        [
            'OVER_RECEIVED',
            [
                procurement_records_1.ReceivingResolutionCode.ACCEPT_WITH_PO_CHANGE,
                procurement_records_1.ReceivingResolutionCode.REJECT_EXCESS,
                procurement_records_1.ReceivingResolutionCode.TEMP_HOLD
            ]
        ],
        [
            'DAMAGED',
            [
                procurement_records_1.ReceivingResolutionCode.REJECT_DAMAGED,
                procurement_records_1.ReceivingResolutionCode.RECEIVE_WITH_RESTRICTION,
                procurement_records_1.ReceivingResolutionCode.CLAIM,
                procurement_records_1.ReceivingResolutionCode.REQUEST_RESEND
            ]
        ],
        [
            'WRONG_ITEM',
            [
                procurement_records_1.ReceivingResolutionCode.REJECT_WRONG_ITEM,
                procurement_records_1.ReceivingResolutionCode.TEMP_RECEIVE_PENDING_DECISION,
                procurement_records_1.ReceivingResolutionCode.ACCEPT_WITH_CONTROLLED_CHANGE
            ]
        ],
        [
            'QUALITY_HOLD',
            [
                procurement_records_1.ReceivingResolutionCode.WAIT_INSPECTION,
                procurement_records_1.ReceivingResolutionCode.CLAIM,
                procurement_records_1.ReceivingResolutionCode.ACCEPT_WITH_ALLOWANCE,
                procurement_records_1.ReceivingResolutionCode.RETURN_TO_SUPPLIER
            ]
        ]
    ]);
    (0, procurement_assertions_1.assertPrecondition)(allowed.get(discrepancy.discrepancyType)?.includes(resolutionCode), 'resolution code must match discrepancy type');
    if (resolutionCode === procurement_records_1.ReceivingResolutionCode.CLOSE_UNRECEIVED ||
        resolutionCode === procurement_records_1.ReceivingResolutionCode.ACCEPT_WITH_PO_CHANGE) {
        (0, procurement_assertions_1.assertPrecondition)(resolutionReferences.length > 0, 'purchase-order-change-backed resolution requires references');
    }
}
//# sourceMappingURL=record-receiving-discrepancy-resolution.handler.js.map