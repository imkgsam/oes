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
exports.PostReceiptHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const wms_records_1 = require("../../domain/models/wms-records");
const wms_assertions_1 = require("../support/wms-assertions");
const wms_write_support_1 = require("../support/wms-write-support");
const post_receipt_command_1 = require("./post-receipt.command");
/** PostReceiptHandler validates a draft receipt and converts it into immutable ledger truth plus refreshed balances. */
let PostReceiptHandler = class PostReceiptHandler {
    constructor(receiptRepository, warehouseRepository, inventoryRepository, stockableItemLookup, receivingExpectationLookup) {
        this.receiptRepository = receiptRepository;
        this.warehouseRepository = warehouseRepository;
        this.inventoryRepository = inventoryRepository;
        this.stockableItemLookup = stockableItemLookup;
        this.receivingExpectationLookup = receivingExpectationLookup;
    }
    async execute(command) {
        (0, wms_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, wms_assertions_1.assertRequiredString)(command.payload.receiptId, 'receiptId');
        const receipt = (0, wms_assertions_1.assertExists)(await this.receiptRepository.findById(command.payload.tenantId, command.payload.receiptId), 'receipt', command.payload.receiptId);
        (0, wms_assertions_1.assertPrecondition)(receipt.status === wms_records_1.ReceiptStatus.DRAFT, 'only draft receipts can be posted');
        (0, wms_assertions_1.assertPrecondition)(receipt.lines.length > 0, 'receipt must contain at least one line before posting');
        const warehouse = (0, wms_assertions_1.assertExists)(await this.warehouseRepository.findWarehouseById(command.payload.tenantId, receipt.warehouseId), 'warehouse', receipt.warehouseId);
        (0, wms_assertions_1.assertPrecondition)(warehouse.warehouseScope === wms_records_1.WarehouseScope.INTERNAL, 'warehouse must be internal');
        (0, wms_assertions_1.assertPrecondition)(warehouse.status === wms_records_1.WarehouseStatus.ACTIVE, 'warehouse must be active before posting');
        const referencedExpectationIds = new Set(receipt.referencedReceivingExpectationIds);
        for (const line of receipt.lines) {
            if (line.receivingExpectationId) {
                referencedExpectationIds.add(line.receivingExpectationId);
            }
        }
        const expectationMap = new Map();
        for (const expectationId of referencedExpectationIds) {
            const expectation = (0, wms_assertions_1.assertExists)(await this.receivingExpectationLookup.getReceivingExpectationById(command.payload.tenantId, expectationId), 'receiving_expectation', expectationId);
            if ((0, wms_assertions_1.normalizeOptionalString)(expectation.targetWarehouseId)) {
                (0, wms_assertions_1.assertPrecondition)(expectation.targetWarehouseId === receipt.warehouseId, 'receiving expectation target warehouse must match receipt warehouse', {
                    receivingExpectationId: expectationId
                });
            }
            expectationMap.set(expectationId, expectation);
        }
        const postedAt = (0, wms_write_support_1.nowIso)();
        const ledgerEntries = [];
        const postedLines = [];
        for (const line of receipt.lines) {
            const location = (0, wms_assertions_1.assertExists)(await this.warehouseRepository.findLocationById(command.payload.tenantId, line.targetLocationId), 'location', line.targetLocationId);
            (0, wms_assertions_1.assertPrecondition)(location.warehouseId === receipt.warehouseId, 'location must belong to the receipt warehouse', {
                locationId: line.targetLocationId
            });
            (0, wms_assertions_1.assertPrecondition)(location.supportsStorage, 'location must support storage before posting receipt', {
                locationId: line.targetLocationId
            });
            (0, wms_assertions_1.assertPrecondition)(location.status === 'ACTIVE', 'location must be active before posting receipt', {
                locationId: line.targetLocationId
            });
            const item = (0, wms_assertions_1.assertExists)(await this.stockableItemLookup.getItemById(command.payload.tenantId, line.itemId), 'item', line.itemId);
            (0, wms_assertions_1.assertPrecondition)(item.stockable, 'item must be stockable before receipt posting', {
                itemId: line.itemId
            });
            if (line.receivingExpectationId) {
                (0, wms_assertions_1.assertPrecondition)(expectationMap.has(line.receivingExpectationId), 'receipt line expectation must be validated', {
                    receivingExpectationId: line.receivingExpectationId
                });
            }
            const ledgerEntryId = (0, node_crypto_1.randomUUID)();
            const ledgerEntry = {
                stockLedgerEntryId: ledgerEntryId,
                tenantId: receipt.tenantId,
                orgId: receipt.orgId ?? null,
                entryType: wms_records_1.StockLedgerEntryType.RECEIPT_POSTED,
                direction: wms_records_1.StockLedgerDirection.IN,
                warehouseId: receipt.warehouseId,
                locationId: line.targetLocationId,
                itemId: line.itemId,
                itemCode: item.itemCode,
                itemName: item.itemName,
                quantityDelta: line.confirmedQuantity,
                uom: line.uom,
                inventoryStatus: line.inventoryStatus,
                restrictedReason: line.restrictedReason ?? null,
                sourceDocumentType: wms_records_1.StockLedgerSourceDocumentType.RECEIPT,
                sourceDocumentId: receipt.receiptId,
                sourceDocumentLineId: line.receiptLineId,
                receivingExpectationId: line.receivingExpectationId ?? null,
                trackingRefs: structuredClone(line.trackingRefs),
                postedAt
            };
            ledgerEntries.push(ledgerEntry);
            postedLines.push({
                ...line,
                itemCode: item.itemCode,
                itemName: item.itemName,
                postedStockLedgerEntryIds: [ledgerEntryId],
                updatedAt: postedAt
            });
        }
        const postedReceipt = {
            ...receipt,
            status: wms_records_1.ReceiptStatus.POSTED,
            postedAt,
            postComment: (0, wms_assertions_1.normalizeOptionalString)(command.payload.postComment) ?? null,
            updatedAt: postedAt,
            lineCount: postedLines.length,
            lines: postedLines
        };
        postedReceipt.procurementReceiptSummary = (0, wms_write_support_1.buildProcurementReceiptSummary)(postedReceipt, postedAt);
        await this.receiptRepository.save(postedReceipt);
        await this.inventoryRepository.applyLedgerEntries(ledgerEntries);
        return postedReceipt;
    }
};
exports.PostReceiptHandler = PostReceiptHandler;
exports.PostReceiptHandler = PostReceiptHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(post_receipt_command_1.PostReceiptCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.RECEIPT_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.WAREHOUSE_REPOSITORY)),
    __param(2, (0, common_1.Inject)(tokens_1.TOKENS.INVENTORY_REPOSITORY)),
    __param(3, (0, common_1.Inject)(tokens_1.TOKENS.STOCKABLE_ITEM_LOOKUP_PORT)),
    __param(4, (0, common_1.Inject)(tokens_1.TOKENS.RECEIVING_EXPECTATION_LOOKUP_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object])
], PostReceiptHandler);
//# sourceMappingURL=post-receipt.handler.js.map