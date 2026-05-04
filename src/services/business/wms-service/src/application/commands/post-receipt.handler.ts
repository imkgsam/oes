import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { ReceivingExpectationLookupPort } from '../ports/receiving-expectation-lookup.port'
import { StockableItemLookupPort } from '../ports/stockable-item-lookup.port'
import { InventoryRepository } from '../../domain/repositories/inventory.repository'
import { ReceiptRepository } from '../../domain/repositories/receipt.repository'
import { WarehouseRepository } from '../../domain/repositories/warehouse.repository'
import { InventoryStatus, ReceiptLineRecord, ReceiptRecord, ReceiptStatus, StockLedgerDirection, StockLedgerEntryRecord, StockLedgerEntryType, StockLedgerSourceDocumentType, WarehouseScope, WarehouseStatus } from '../../domain/models/wms-records'
import { assertExists, assertPrecondition, assertRequiredString, normalizeOptionalString } from '../support/wms-assertions'
import { buildProcurementReceiptSummary, nowIso } from '../support/wms-write-support'
import { PostReceiptCommand } from './post-receipt.command'

/** PostReceiptHandler validates a draft receipt and converts it into immutable ledger truth plus refreshed balances. */
@Injectable()
@CommandHandler(PostReceiptCommand)
export class PostReceiptHandler implements ICommandHandler<PostReceiptCommand, ReceiptRecord> {
  constructor(
    @Inject(TOKENS.RECEIPT_REPOSITORY)
    private readonly receiptRepository: ReceiptRepository,
    @Inject(TOKENS.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepository,
    @Inject(TOKENS.INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository,
    @Inject(TOKENS.STOCKABLE_ITEM_LOOKUP_PORT)
    private readonly stockableItemLookup: StockableItemLookupPort,
    @Inject(TOKENS.RECEIVING_EXPECTATION_LOOKUP_PORT)
    private readonly receivingExpectationLookup: ReceivingExpectationLookupPort
  ) {}

  async execute(command: PostReceiptCommand): Promise<ReceiptRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.receiptId, 'receiptId')

    const receipt = assertExists(
      await this.receiptRepository.findById(command.payload.tenantId, command.payload.receiptId),
      'receipt',
      command.payload.receiptId
    )
    assertPrecondition(receipt.status === ReceiptStatus.DRAFT, 'only draft receipts can be posted')
    assertPrecondition(receipt.lines.length > 0, 'receipt must contain at least one line before posting')

    const warehouse = assertExists(
      await this.warehouseRepository.findWarehouseById(command.payload.tenantId, receipt.warehouseId),
      'warehouse',
      receipt.warehouseId
    )
    assertPrecondition(warehouse.warehouseScope === WarehouseScope.INTERNAL, 'warehouse must be internal')
    assertPrecondition(warehouse.status === WarehouseStatus.ACTIVE, 'warehouse must be active before posting')

    const referencedExpectationIds = new Set(receipt.referencedReceivingExpectationIds)
    for (const line of receipt.lines) {
      if (line.receivingExpectationId) {
        referencedExpectationIds.add(line.receivingExpectationId)
      }
    }

    const expectationMap = new Map<string, Awaited<ReturnType<ReceivingExpectationLookupPort['getReceivingExpectationById']>>>()
    for (const expectationId of referencedExpectationIds) {
      const expectation = assertExists(
        await this.receivingExpectationLookup.getReceivingExpectationById(command.payload.tenantId, expectationId),
        'receiving_expectation',
        expectationId
      )
      if (normalizeOptionalString(expectation.targetWarehouseId)) {
        assertPrecondition(
          expectation.targetWarehouseId === receipt.warehouseId,
          'receiving expectation target warehouse must match receipt warehouse',
          {
            receivingExpectationId: expectationId
          }
        )
      }
      expectationMap.set(expectationId, expectation)
    }

    const postedAt = nowIso()
    const ledgerEntries: StockLedgerEntryRecord[] = []
    const postedLines: ReceiptLineRecord[] = []

    for (const line of receipt.lines) {
      const location = assertExists(
        await this.warehouseRepository.findLocationById(command.payload.tenantId, line.targetLocationId),
        'location',
        line.targetLocationId
      )
      assertPrecondition(location.warehouseId === receipt.warehouseId, 'location must belong to the receipt warehouse', {
        locationId: line.targetLocationId
      })
      assertPrecondition(location.supportsStorage, 'location must support storage before posting receipt', {
        locationId: line.targetLocationId
      })
      assertPrecondition(location.status === 'ACTIVE', 'location must be active before posting receipt', {
        locationId: line.targetLocationId
      })

      const item = assertExists(
        await this.stockableItemLookup.getItemById(command.payload.tenantId, line.itemId),
        'item',
        line.itemId
      )
      assertPrecondition(item.stockable, 'item must be stockable before receipt posting', {
        itemId: line.itemId
      })

      if (line.receivingExpectationId) {
        assertPrecondition(expectationMap.has(line.receivingExpectationId), 'receipt line expectation must be validated', {
          receivingExpectationId: line.receivingExpectationId
        })
      }

      const ledgerEntryId = randomUUID()
      const ledgerEntry: StockLedgerEntryRecord = {
        stockLedgerEntryId: ledgerEntryId,
        tenantId: receipt.tenantId,
        orgId: receipt.orgId ?? null,
        entryType: StockLedgerEntryType.RECEIPT_POSTED,
        direction: StockLedgerDirection.IN,
        warehouseId: receipt.warehouseId,
        locationId: line.targetLocationId,
        itemId: line.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantityDelta: line.confirmedQuantity,
        uom: line.uom,
        inventoryStatus: line.inventoryStatus,
        restrictedReason: line.restrictedReason ?? null,
        sourceDocumentType: StockLedgerSourceDocumentType.RECEIPT,
        sourceDocumentId: receipt.receiptId,
        sourceDocumentLineId: line.receiptLineId,
        receivingExpectationId: line.receivingExpectationId ?? null,
        trackingRefs: structuredClone(line.trackingRefs),
        postedAt
      }
      ledgerEntries.push(ledgerEntry)

      postedLines.push({
        ...line,
        itemCode: item.itemCode,
        itemName: item.itemName,
        postedStockLedgerEntryIds: [ledgerEntryId],
        updatedAt: postedAt
      })
    }

    const postedReceipt: ReceiptRecord = {
      ...receipt,
      status: ReceiptStatus.POSTED,
      postedAt,
      postComment: normalizeOptionalString(command.payload.postComment) ?? null,
      updatedAt: postedAt,
      lineCount: postedLines.length,
      lines: postedLines
    }
    postedReceipt.procurementReceiptSummary = buildProcurementReceiptSummary(postedReceipt, postedAt)

    await this.receiptRepository.save(postedReceipt)
    await this.inventoryRepository.applyLedgerEntries(ledgerEntries)
    return postedReceipt
  }
}
