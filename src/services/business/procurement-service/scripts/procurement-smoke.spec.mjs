import test from 'node:test'
import assert from 'node:assert/strict'

import { createSmokeSeed, runProcurementSmokeFlow } from './procurement-smoke-lib.mjs'
import { createPurchasableSmokeItem } from '../../../../../scripts/local/item-master-smoke-fixture.mjs'

// Verifies the mandatory procurement smoke path can search an empty tenant, create one PR, submit it, and approve it.
test('procurement smoke flow / should create submit and approve one purchase request when conversion is unavailable', async () => {
  const calls = []
  const seed = createSmokeSeed(1700000000200)

  const result = await runProcurementSmokeFlow(
    {
      procurement: {
        query: {
          searchPurchaseRequests: async (request) => {
            calls.push(['searchPurchaseRequests', request])

            if (calls.length === 1) {
              return {
                purchaseRequests: [],
                total: 0,
                page: request.page,
                pageSize: request.pageSize
              }
            }

            return {
              purchaseRequests: [
                {
                  purchaseRequestId: 'pr-text-1',
                  requestNo: 'PR-0001',
                  requestType: request.requestType ?? 1,
                  status: 3,
                  requesterDisplayName: 'fixture-operator',
                  lineCount: 1,
                  createdAt: '2026-04-28T10:00:00.000Z',
                  submittedAt: '2026-04-28T10:01:00.000Z',
                  decidedAt: '2026-04-28T10:02:00.000Z'
                }
              ],
              total: 1,
              page: request.page,
              pageSize: request.pageSize
            }
          }
        },
        management: {
          createPurchaseRequest: async (request) => {
            calls.push(['createPurchaseRequest', request])
            return {
              purchaseRequest: {
                purchaseRequestId: 'pr-text-1',
                requestNo: 'PR-0001',
                tenantId: 'fixture-tenant',
                orgId: 'fixture-org',
                requestType: request.requestType,
                status: 1,
                requester: {
                  operatorId: 'fixture-operator',
                  displayName: 'fixture-operator'
                },
                title: request.title,
                reason: request.reason,
                lines: [
                  {
                    purchaseRequestLineId: 'pr-text-line-1',
                    lineNo: 1,
                    lineType: request.lines[0].lineType,
                    description: request.lines[0].description,
                    requestedQuantity: request.lines[0].requestedQuantity,
                    uom: request.lines[0].uom
                  }
                ]
              }
            }
          },
          submitPurchaseRequest: async (request) => {
            calls.push(['submitPurchaseRequest', request])
            return {
              purchaseRequest: {
                purchaseRequestId: request.purchaseRequestId,
                requestNo: 'PR-0001',
                status: 2
              }
            }
          },
          decidePurchaseRequest: async (request) => {
            calls.push(['decidePurchaseRequest', request])
            return {
              purchaseRequest: {
                purchaseRequestId: request.purchaseRequestId,
                requestNo: 'PR-0001',
                status: 3,
                approvalSnapshot: {
                  decision: request.decision
                }
              }
            }
          }
        }
      }
    },
    seed
  )

  assert.equal(result.approvedRequest.purchaseRequestId, 'pr-text-1')
  assert.equal(result.approvedRequest.status, 3)
  assert.equal(result.searchTotals.beforeCreate, 0)
  assert.equal(result.searchTotals.afterApprove, 1)
  assert.equal(result.conversion.status, 'skipped')
  assert.match(result.conversion.reason, /ACTIVE SupplierOffering/i)
  assert.deepEqual(
    calls.map(([name]) => name),
    [
      'searchPurchaseRequests',
      'createPurchaseRequest',
      'submitPurchaseRequest',
      'decidePurchaseRequest',
      'searchPurchaseRequests'
    ]
  )
})

// Verifies the optional procurement conversion path can bootstrap one standard-item PR and turn it into one PO draft.
test('procurement smoke flow / should convert one approved standard-item purchase request into one purchase order when an active offering is available', async () => {
  const calls = []
  const seed = createSmokeSeed(1700000000201)

  const result = await runProcurementSmokeFlow(
    {
      procurement: {
        query: {
          searchPurchaseRequests: async (request) => {
            calls.push(['searchPurchaseRequests', request])

            if (calls.filter(([name]) => name === 'searchPurchaseRequests').length === 1) {
              return {
                purchaseRequests: [],
                total: 0,
                page: request.page,
                pageSize: request.pageSize
              }
            }

            return {
              purchaseRequests: [
                {
                  purchaseRequestId: 'pr-text-2',
                  requestNo: 'PR-0002',
                  requestType: request.requestType ?? 1,
                  status: 3,
                  requesterDisplayName: 'fixture-operator',
                  lineCount: 1,
                  createdAt: '2026-04-28T10:00:00.000Z',
                  submittedAt: '2026-04-28T10:01:00.000Z',
                  decidedAt: '2026-04-28T10:02:00.000Z'
                }
              ],
              total: 1,
              page: request.page,
              pageSize: request.pageSize
            }
          }
        },
        management: {
          createPurchaseRequest: async (request) => {
            calls.push(['createPurchaseRequest', request])
            const isStandardItem = request.lines[0].lineType === 1
            return {
              purchaseRequest: {
                purchaseRequestId: isStandardItem ? 'pr-item-1' : 'pr-text-2',
                requestNo: isStandardItem ? 'PR-0100' : 'PR-0002',
                tenantId: 'fixture-tenant',
                orgId: 'fixture-org',
                requestType: request.requestType,
                status: 1,
                requester: {
                  operatorId: 'fixture-operator',
                  displayName: 'fixture-operator'
                },
                title: request.title,
                reason: request.reason,
                lines: [
                  {
                    purchaseRequestLineId: isStandardItem ? 'pr-item-line-1' : 'pr-text-line-2',
                    lineNo: 1,
                    lineType: request.lines[0].lineType,
                    itemId: request.lines[0].itemId,
                    description: request.lines[0].description,
                    requestedQuantity: request.lines[0].requestedQuantity,
                    uom: request.lines[0].uom
                  }
                ]
              }
            }
          },
          submitPurchaseRequest: async (request) => {
            calls.push(['submitPurchaseRequest', request])
            return {
              purchaseRequest: {
                purchaseRequestId: request.purchaseRequestId,
                status: 2
              }
            }
          },
          decidePurchaseRequest: async (request) => {
            calls.push(['decidePurchaseRequest', request])
            return {
              purchaseRequest: {
                purchaseRequestId: request.purchaseRequestId,
                status: 3,
                approvalSnapshot: {
                  decision: request.decision
                }
              }
            }
          },
          convertPurchaseRequestToPurchaseOrder: async (request) => {
            calls.push(['convertPurchaseRequestToPurchaseOrder', request])
            return {
              purchaseOrder: {
                purchaseOrderId: 'po-1',
                orderNo: 'PO-0001',
                supplierId: request.supplierId,
                status: 1,
                sourcePurchaseRequestIds: [request.purchaseRequestId]
              }
            }
          }
        }
      },
      bootstrap: {
        ensureActiveOffering: async () => ({
          supplierId: 'supplier-1',
          itemId: 'item-1'
        })
      }
    },
    seed
  )

  assert.equal(result.conversion.status, 'converted')
  assert.equal(result.conversion.purchaseOrderId, 'po-1')
  assert.equal(result.conversion.supplierId, 'supplier-1')
  assert.equal(result.conversion.itemId, 'item-1')

  const convertCall = calls.find(([name]) => name === 'convertPurchaseRequestToPurchaseOrder')
  assert.ok(convertCall)
  assert.equal(convertCall[1].sourceLines[0].purchaseRequestId, 'pr-item-1')
  assert.equal(convertCall[1].sourceLines[0].purchaseRequestLineId, 'pr-item-line-1')
})

// Verifies the shared Item Master bootstrap used by procurement creates a Contract V2 model before creating the item.
test('item-master smoke fixture / should create a model before creating a procurement conversion item', async () => {
  const calls = []
  const seed = createSmokeSeed(1700000000202)

  const result = await createPurchasableSmokeItem(
    {
      createItemModel: async (request) => {
        calls.push(['createItemModel', request])
        return { itemModelId: 'proc-item-model-1' }
      },
      createItem: async (request) => {
        calls.push(['createItem', request])
        return { itemId: 'proc-item-1', item: { itemId: 'proc-item-1' } }
      },
      setItemCapabilities: async (request) => {
        calls.push(['setItemCapabilities', request])
        return {
          item: {
            itemId: request.itemId,
            capabilities: { purchasable: true }
          }
        }
      }
    },
    seed,
    {
      modelCode: 'PROC-SMOKE-MODEL-0202',
      modelName: `Procurement Smoke Model ${seed.title}`,
      itemCode: 'PROC-SMOKE-ITEM-0202',
      itemName: `Procurement Smoke Item ${seed.title}`
    }
  )

  assert.deepEqual(
    calls.map(([name]) => name),
    ['createItemModel', 'createItem', 'setItemCapabilities']
  )
  assert.equal(calls[1][1].itemModelId, 'proc-item-model-1')
  assert.equal(result.itemModelId, 'proc-item-model-1')
  assert.equal(result.itemId, 'proc-item-1')
})
