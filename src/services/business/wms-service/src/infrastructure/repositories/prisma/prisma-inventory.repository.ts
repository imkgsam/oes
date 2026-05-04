import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../../prisma/generated/prisma'
import { GetInventoryBalanceInput, InventoryBalanceRecord, InventoryBalanceRestrictedQuantityRecord, InventoryBalanceStatusFilter, InventoryStatus, PageResult, RestrictedStatusReasonCode, SearchInventoryBalancesInput, SearchStockLedgerEntriesInput, StockLedgerEntryRecord } from '../../../domain/models/wms-records'
import { InventoryRepository } from '../../../domain/repositories/inventory.repository'
import { normalizePageInput, normalizeQuantity, paginate, sumQuantities } from '../../../application/support/wms-assertions'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaWmsRecordMapper } from './prisma-wms-record.mapper'

/** PrismaInventoryRepository persists immutable ledger facts and balance projections derived from those facts. */
@Injectable()
export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async applyLedgerEntries(entries: StockLedgerEntryRecord[]): Promise<void> {
    if (entries.length === 0) {
      return
    }

    await this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      for (const entry of entries) {
        await client.stockLedgerEntry.create({
          data: {
            id: entry.stockLedgerEntryId,
            tenantId: entry.tenantId,
            orgId: entry.orgId ?? null,
            entryType: PrismaWmsRecordMapper.toPersistedStockLedgerEntryType(entry.entryType),
            direction: PrismaWmsRecordMapper.toPersistedStockLedgerDirection(entry.direction),
            warehouseId: entry.warehouseId,
            locationId: entry.locationId,
            itemId: entry.itemId,
            itemCode: entry.itemCode ?? null,
            itemName: entry.itemName ?? null,
            quantityDelta: entry.quantityDelta,
            uom: entry.uom,
            inventoryStatus: PrismaWmsRecordMapper.toPersistedInventoryStatus(entry.inventoryStatus),
            restrictedReason: entry.restrictedReason
              ? PrismaWmsRecordMapper.toInputJson(entry.restrictedReason)
              : null,
            sourceDocumentType: PrismaWmsRecordMapper.toPersistedStockLedgerSourceDocumentType(
              entry.sourceDocumentType
            ),
            sourceDocumentId: entry.sourceDocumentId,
            sourceDocumentLineId: entry.sourceDocumentLineId,
            receivingExpectationId: entry.receivingExpectationId ?? null,
            trackingRefs: PrismaWmsRecordMapper.toInputJson(entry.trackingRefs),
            postedAt: new Date(entry.postedAt)
          }
        })

        await this.upsertBalance(client, entry, entry.locationId)
        await this.upsertBalance(client, entry, null)
      }
    })
  }

  async searchStockLedgerEntries(input: SearchStockLedgerEntriesInput): Promise<PageResult<StockLedgerEntryRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const rows = await this.prisma.getExecutionClient().stockLedgerEntry.findMany({
      where: {
        tenantId: input.tenantId
      },
      orderBy: {
        postedAt: 'asc'
      }
    })

    const filtered = rows
      .map((row) => PrismaWmsRecordMapper.toStockLedgerEntry(row))
      .filter((record) => !input.orgId || record.orgId === input.orgId)
      .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
      .filter((record) => !input.locationId || record.locationId === input.locationId)
      .filter((record) => !input.itemId || record.itemId === input.itemId)
      .filter((record) => !input.receiptId || record.sourceDocumentId === input.receiptId)
      .filter((record) => !input.receiptLineId || record.sourceDocumentLineId === input.receiptLineId)
      .filter(
        (record) =>
          !input.receivingExpectationId || record.receivingExpectationId === input.receivingExpectationId
      )
      .filter((record) => !input.inventoryStatus || record.inventoryStatus === input.inventoryStatus)
      .filter(
        (record) =>
          !input.restrictedReasonCode || record.restrictedReason?.reasonCode === input.restrictedReasonCode
      )
      .filter((record) => !input.postedAtFrom || record.postedAt >= input.postedAtFrom)
      .filter((record) => !input.postedAtTo || record.postedAt <= input.postedAtTo)

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  async getInventoryBalance(input: GetInventoryBalanceInput): Promise<InventoryBalanceRecord | null> {
    const row = await this.prisma.getExecutionClient().inventoryBalance.findUnique({
      where: {
        balanceKey: buildBalanceKey(input.tenantId, input.warehouseId, input.locationId ?? null, input.itemId)
      }
    })

    return row ? PrismaWmsRecordMapper.toInventoryBalance(row) : null
  }

  async searchInventoryBalances(input: SearchInventoryBalancesInput): Promise<PageResult<InventoryBalanceRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const rows = await this.prisma.getExecutionClient().inventoryBalance.findMany({
      where: {
        tenantId: input.tenantId
      },
      orderBy: [
        {
          warehouseId: 'asc'
        },
        {
          itemId: 'asc'
        }
      ]
    })

    const filtered = rows
      .map((row) => PrismaWmsRecordMapper.toInventoryBalance(row))
      .filter((record) => !input.orgId || record.orgId === input.orgId)
      .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
      .filter((record) => {
        if (input.locationId === undefined) {
          return true
        }
        return (record.locationId ?? null) === input.locationId
      })
      .filter((record) => !input.itemId || record.itemId === input.itemId)
      .filter((record) => {
        if (!input.inventoryStatus || input.inventoryStatus === InventoryBalanceStatusFilter.ANY) {
          return true
        }
        if (input.inventoryStatus === InventoryBalanceStatusFilter.AVAILABLE) {
          return Number(record.availableQuantity) > 0
        }
        return Number(record.restrictedQuantity) > 0
      })
      .filter((record) => {
        if (!input.restrictedReasonCode) {
          return true
        }
        return record.restrictedQuantities.some(
          (quantity) =>
            quantity.reasonCode === input.restrictedReasonCode && Number(quantity.quantity) > 0
        )
      })
      .filter(
        (record) => input.onlyPositiveOnHand === undefined || !input.onlyPositiveOnHand || Number(record.onHandQuantity) > 0
      )

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  private async upsertBalance(
    client: PrismaService | Prisma.TransactionClient,
    entry: StockLedgerEntryRecord,
    locationId: string | null
  ): Promise<void> {
    const balanceKey = buildBalanceKey(entry.tenantId, entry.warehouseId, locationId, entry.itemId)
    const existing = await client.inventoryBalance.findUnique({
      where: {
        balanceKey
      }
    })
    const updated = projectBalance(existing ? PrismaWmsRecordMapper.toInventoryBalance(existing) : null, entry, locationId)

    await client.inventoryBalance.upsert({
      where: {
        balanceKey
      },
      create: {
        balanceKey,
        tenantId: updated.tenantId,
        orgId: updated.orgId ?? null,
        warehouseId: updated.warehouseId,
        locationId: updated.locationId ?? null,
        itemId: updated.itemId,
        itemCode: updated.itemCode ?? null,
        itemName: updated.itemName ?? null,
        uom: updated.uom,
        onHandQuantity: updated.onHandQuantity,
        availableQuantity: updated.availableQuantity,
        restrictedQuantity: updated.restrictedQuantity,
        restrictedQuantities: PrismaWmsRecordMapper.toInputJson(updated.restrictedQuantities),
        lastLedgerEntryId: updated.lastLedgerEntryId,
        lastPostedAt: new Date(updated.lastPostedAt),
        updatedAt: new Date(updated.updatedAt)
      },
      update: {
        orgId: updated.orgId ?? null,
        warehouseId: updated.warehouseId,
        locationId: updated.locationId ?? null,
        itemId: updated.itemId,
        itemCode: updated.itemCode ?? null,
        itemName: updated.itemName ?? null,
        uom: updated.uom,
        onHandQuantity: updated.onHandQuantity,
        availableQuantity: updated.availableQuantity,
        restrictedQuantity: updated.restrictedQuantity,
        restrictedQuantities: PrismaWmsRecordMapper.toInputJson(updated.restrictedQuantities),
        lastLedgerEntryId: updated.lastLedgerEntryId,
        lastPostedAt: new Date(updated.lastPostedAt),
        updatedAt: new Date(updated.updatedAt)
      }
    })
  }
}

function buildBalanceKey(tenantId: string, warehouseId: string, locationId: string | null, itemId: string): string {
  return `${tenantId}:${warehouseId}:${locationId ?? '__WAREHOUSE__'}:${itemId}`
}

function projectBalance(
  existing: InventoryBalanceRecord | null,
  entry: StockLedgerEntryRecord,
  locationId: string | null
): InventoryBalanceRecord {
  const nextAvailableQuantity =
    entry.inventoryStatus === InventoryStatus.AVAILABLE
      ? sumQuantities([existing?.availableQuantity ?? '0', entry.quantityDelta])
      : existing?.availableQuantity ?? '0'
  const nextRestrictedQuantity =
    entry.inventoryStatus === InventoryStatus.RESTRICTED
      ? sumQuantities([existing?.restrictedQuantity ?? '0', entry.quantityDelta])
      : existing?.restrictedQuantity ?? '0'
  const restrictedQuantities = mergeRestrictedQuantities(
    existing?.restrictedQuantities ?? [],
    entry.restrictedReason?.reasonCode,
    entry.quantityDelta
  )

  return {
    tenantId: entry.tenantId,
    orgId: entry.orgId ?? existing?.orgId ?? null,
    warehouseId: entry.warehouseId,
    locationId,
    itemId: entry.itemId,
    itemCode: entry.itemCode ?? existing?.itemCode ?? null,
    itemName: entry.itemName ?? existing?.itemName ?? null,
    uom: entry.uom,
    onHandQuantity: sumQuantities([existing?.onHandQuantity ?? '0', entry.quantityDelta]),
    availableQuantity: normalizeQuantity(nextAvailableQuantity),
    restrictedQuantity: normalizeQuantity(nextRestrictedQuantity),
    restrictedQuantities,
    lastLedgerEntryId: entry.stockLedgerEntryId,
    lastPostedAt: entry.postedAt,
    updatedAt: entry.postedAt
  }
}

function mergeRestrictedQuantities(
  existing: InventoryBalanceRestrictedQuantityRecord[],
  reasonCode: RestrictedStatusReasonCode | undefined,
  quantityDelta: string
): InventoryBalanceRestrictedQuantityRecord[] {
  const byCode = new Map(existing.map((quantity) => [quantity.reasonCode, quantity.quantity]))
  if (reasonCode) {
    byCode.set(reasonCode, sumQuantities([byCode.get(reasonCode) ?? '0', quantityDelta]))
  }
  return [...byCode.entries()].map(([code, quantity]) => ({
    reasonCode: code,
    quantity: normalizeQuantity(quantity)
  }))
}
