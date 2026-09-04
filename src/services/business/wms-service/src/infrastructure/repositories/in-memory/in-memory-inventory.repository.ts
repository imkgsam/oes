import { GetInventoryBalanceInput, InventoryBalanceRecord, InventoryBalanceRestrictedQuantityRecord, InventoryBalanceStatusFilter, InventoryStatus, PageResult, RestrictedStatusReasonCode, SearchInventoryBalancesInput, SearchStockLedgerEntriesInput, StockLedgerEntryRecord } from '../../../domain/models/wms-records'
import { InventoryRepository } from '../../../domain/repositories/inventory.repository'
import { normalizePageInput, normalizeQuantity, paginate, sumQuantities } from '../../../application/support/wms-assertions'
import { WmsInMemoryStore } from '../../store/wms-in-memory-store'

/** InMemoryInventoryRepository provides deterministic ledger and projection behavior for WMS Unit tests. */
export class InMemoryInventoryRepository implements InventoryRepository {
  constructor(private readonly store: WmsInMemoryStore) {}

  async applyLedgerEntries(entries: StockLedgerEntryRecord[]): Promise<void> {
    for (const entry of entries) {
      this.store.stockLedgerEntries.set(entry.stockLedgerEntryId, structuredClone(entry))
      this.upsertBalance(entry, entry.locationId)
      this.upsertBalance(entry, null)
    }
  }

  async searchStockLedgerEntries(input: SearchStockLedgerEntriesInput): Promise<PageResult<StockLedgerEntryRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const filtered = [...this.store.stockLedgerEntries.values()]
      .filter((record) => record.tenantId === input.tenantId)
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
      .sort((left, right) => left.postedAt.localeCompare(right.postedAt))
      .map((record) => structuredClone(record))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return { items: pageItems, total, page, pageSize }
  }

  async getInventoryBalance(input: GetInventoryBalanceInput): Promise<InventoryBalanceRecord | null> {
    return (
      structuredClone(
        this.store.inventoryBalances.get(buildBalanceKey(input.tenantId, input.warehouseId, input.locationId ?? null, input.itemId)) ?? null
      )
    )
  }

  async searchInventoryBalances(input: SearchInventoryBalancesInput): Promise<PageResult<InventoryBalanceRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const filtered = [...this.store.inventoryBalances.values()]
      .filter((record) => record.tenantId === input.tenantId)
      .filter((record) => !input.orgId || record.orgId === input.orgId)
      .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
      .filter((record) => input.locationId === undefined || (record.locationId ?? null) === input.locationId)
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
      .sort((left, right) => left.itemId.localeCompare(right.itemId))
      .map((record) => structuredClone(record))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return { items: pageItems, total, page, pageSize }
  }

  private upsertBalance(entry: StockLedgerEntryRecord, locationId: string | null): void {
    const key = buildBalanceKey(entry.tenantId, entry.warehouseId, locationId, entry.itemId)
    const existing = this.store.inventoryBalances.get(key) ?? null
    this.store.inventoryBalances.set(key, projectBalance(existing, entry, locationId))
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
    restrictedQuantities: mergeRestrictedQuantities(
      existing?.restrictedQuantities ?? [],
      entry.restrictedReason?.reasonCode,
      entry.quantityDelta
    ),
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
