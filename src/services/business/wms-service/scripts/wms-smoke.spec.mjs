import test from 'node:test';
import assert from 'node:assert/strict';

import { createSmokeSeed, runWmsSmokeFlow } from './wms-smoke-lib.mjs';

// Verifies the minimal WMS smoke can traverse the seeded warehouse page, receipt draft flow, posting, and inventory queries.
test('wms smoke flow / should list one seeded warehouse and post one manual receipt into ledger and balance queries', async () => {
  const calls = [];
  const seed = createSmokeSeed(1700000000300);

  const result = await runWmsSmokeFlow(
    {
      warehouse: {
        query: {
          listWarehouses: async (request) => {
            calls.push(['listWarehouses', request]);
            return {
              warehouses: [
                {
                  warehouseId: seed.warehouseId,
                  warehouseCode: seed.warehouseCode,
                  warehouseName: seed.warehouseName
                }
              ],
              total: 1,
              page: request.page,
              pageSize: request.pageSize
            };
          }
        }
      },
      receipt: {
        management: {
          createReceiptDraft: async (request) => {
            calls.push(['createReceiptDraft', request]);
            return {
              receipt: {
                receiptId: 'receipt-1',
                receiptNo: 'RC-0001',
                warehouseId: request.warehouseId,
                status: 1,
                lineCount: 0
              }
            };
          },
          addOrReplaceReceiptLines: async (request) => {
            calls.push(['addOrReplaceReceiptLines', request]);
            return {
              receipt: {
                receiptId: request.receiptId,
                receiptNo: 'RC-0001',
                warehouseId: seed.warehouseId,
                status: 1,
                lineCount: request.lines.length,
                lines: [
                  {
                    receiptLineId: 'line-1',
                    itemId: request.lines[0].itemId,
                    targetLocationId: request.lines[0].targetLocationId,
                    confirmedQuantity: request.lines[0].confirmedQuantity,
                    inventoryStatus: request.lines[0].inventoryStatus
                  }
                ]
              }
            };
          },
          postReceipt: async (request) => {
            calls.push(['postReceipt', request]);
            return {
              receipt: {
                receiptId: request.receiptId,
                receiptNo: 'RC-0001',
                warehouseId: seed.warehouseId,
                status: 2,
                lineCount: 1
              },
              postedStockLedgerEntryIds: ['ledger-1']
            };
          }
        }
      },
      inventory: {
        query: {
          searchStockLedgerEntries: async (request) => {
            calls.push(['searchStockLedgerEntries', request]);
            return {
              entries: [
                {
                  stockLedgerEntryId: 'ledger-1',
                  sourceDocumentId: 'receipt-1',
                  itemId: seed.itemId,
                  quantityDelta: seed.confirmedQuantity
                }
              ],
              total: 1,
              page: request.page,
              pageSize: request.pageSize
            };
          },
          searchInventoryBalances: async (request) => {
            calls.push(['searchInventoryBalances', request]);
            return {
              inventoryBalances: [
                {
                  warehouseId: seed.warehouseId,
                  locationId: seed.locationId,
                  itemId: seed.itemId,
                  onHandQuantity: seed.confirmedQuantity,
                  availableQuantity: seed.confirmedQuantity,
                  restrictedQuantity: '0'
                }
              ],
              total: 1,
              page: request.page,
              pageSize: request.pageSize
            };
          }
        }
      }
    },
    seed
  );

  assert.equal(result.warehouse.total, 1);
  assert.equal(result.receipt.receiptId, 'receipt-1');
  assert.deepEqual(result.postedStockLedgerEntryIds, ['ledger-1']);
  assert.equal(result.ledger.total, 1);
  assert.equal(result.balance.total, 1);
  assert.deepEqual(
    calls.map(([name]) => name),
    [
      'listWarehouses',
      'createReceiptDraft',
      'addOrReplaceReceiptLines',
      'postReceipt',
      'searchStockLedgerEntries',
      'searchInventoryBalances'
    ]
  );
});
