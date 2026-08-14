import test from 'node:test'
import assert from 'node:assert/strict'

import { createSmokeSeed, runSrmSmokeFlow } from './srm-smoke-lib.mjs'
import { createPurchasableSmokeItem } from '../../../../../scripts/local/item-master-smoke-fixture.mjs'

// Verifies the minimal SRM smoke flow creates a supplier, binds it to a tenant party, activates it, and adds one purchasable offering.
test('srm smoke flow / should create, bind, activate, and offer one supplier when party and item-master are available', async () => {
  const calls = []
  const seed = createSmokeSeed(1700000000100)

  const result = await runSrmSmokeFlow(
    {
      srm: {
        query: {
          searchSuppliers: async (request) => {
            calls.push(['searchSuppliers', request])

            if (calls.length === 1) {
              return {
                suppliers: [],
                total: 0,
                page: request.page,
                pageSize: request.pageSize
              }
            }

            return {
              suppliers: [
                {
                  supplierId: 'supplier-1',
                  supplierNo: 'SUP-0001',
                  tenantId: seed.tenantId,
                  displayName: seed.displayName,
                  status: 2,
                  tags: seed.tags
                }
              ],
              total: 1,
              page: request.page,
              pageSize: request.pageSize
            }
          }
        },
        management: {
          createSupplierProfile: async (request) => {
            calls.push(['createSupplierProfile', request])
            return {
              supplier: {
                supplierId: 'supplier-1',
                supplierNo: 'SUP-0001',
                tenantId: seed.tenantId,
                displayName: request.displayName,
                status: 2,
                tags: request.tags ?? []
              }
            }
          },
          bindSupplierToTenantParty: async (request) => {
            calls.push(['bindSupplierToTenantParty', request])
            return {
              supplier: {
                supplierId: request.supplierId,
                supplierNo: 'SUP-0001',
                tenantId: seed.tenantId,
                displayName: seed.displayName,
                status: 2,
                tags: seed.tags,
                partyBinding: {
                  tenantPartyId: request.tenantPartyId,
                  bindingStatus: 1,
                  partyDisplayName: seed.partyLocalDisplayName
                }
              }
            }
          },
          changeSupplierStatus: async (request) => {
            calls.push(['changeSupplierStatus', request])
            return {
              supplier: {
                supplierId: request.supplierId,
                supplierNo: 'SUP-0001',
                tenantId: seed.tenantId,
                displayName: seed.displayName,
                status: 1,
                tags: seed.tags,
                partyBinding: {
                  tenantPartyId: 'tenant-party-1',
                  bindingStatus: 1,
                  partyDisplayName: seed.partyLocalDisplayName
                }
              }
            }
          },
          upsertSupplierOffering: async (request) => {
            calls.push(['upsertSupplierOffering', request])
            return {
              offering: {
                supplierOfferingId: 'offering-1',
                supplierId: request.supplierId,
                itemId: request.itemId,
                itemCode: seed.itemCode,
                itemName: seed.itemName,
                status: 1
              }
            }
          }
        }
      },
      party: {
        registration: {
          registerTenantParty: async (request) => {
            calls.push(['registerTenantParty', request])
            return {
              tenantParty: { id: 'tenant-party-1' },
              matchResult: 'CREATED'
            }
          }
        }
      },
      itemMaster: {
        management: {
          createItemModel: async (request) => {
            calls.push(['createItemModel', request])
            return {
              itemModelId: 'item-model-1',
              itemModel: {
                itemModelId: 'item-model-1',
                modelCode: request.modelCode,
                modelName: request.modelName,
                modelKind: request.modelKind,
                modelType: request.modelType,
                active: true
              }
            }
          },
          createItem: async (request) => {
            calls.push(['createItem', request])
            return {
              itemId: 'item-1',
              item: {
                itemId: 'item-1',
                itemCode: request.itemCode,
                itemName: request.itemName,
                status: 1,
                capabilities: {
                  purchasable: false
                }
              }
            }
          },
          setItemCapabilities: async (request) => {
            calls.push(['setItemCapabilities', request])
            return {
              item: {
                itemId: request.itemId,
                itemCode: seed.itemCode,
                itemName: seed.itemName,
                status: 1,
                capabilities: {
                  purchasable: true
                }
              }
            }
          }
        }
      }
    },
    seed
  )

  assert.equal(result.supplierId, 'supplier-1')
  assert.equal(result.binding.status, 'bound')
  assert.equal(result.binding.tenantPartyId, 'tenant-party-1')
  assert.equal(result.offering.status, 'offered')
  assert.equal(result.offering.itemId, 'item-1')
  assert.deepEqual(
    calls.map(([name]) => name),
    [
      'searchSuppliers',
      'createSupplierProfile',
      'searchSuppliers',
      'registerTenantParty',
      'bindSupplierToTenantParty',
      'changeSupplierStatus',
      'createItemModel',
      'createItem',
      'setItemCapabilities',
      'upsertSupplierOffering'
    ]
  )
  const createItemCall = calls.find(([name]) => name === 'createItem')
  assert.equal(createItemCall[1].itemModelId, 'item-model-1')
})

// Verifies the shared smoke fixture follows Item Master Contract V2 by creating an ItemModel before the executable Item.
test('item-master smoke fixture / should create a model before creating a purchasable item', async () => {
  const calls = []
  const seed = createSmokeSeed(1700000000103)

  const result = await createPurchasableSmokeItem(
    {
      createItemModel: async (request) => {
        calls.push(['createItemModel', request])
        return { itemModelId: 'item-model-shared-1' }
      },
      createItem: async (request) => {
        calls.push(['createItem', request])
        return { itemId: 'item-shared-1', item: { itemId: 'item-shared-1' } }
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
      modelCode: seed.itemCode,
      modelName: seed.itemName,
      itemCode: seed.itemCode,
      itemName: seed.itemName
    }
  )

  assert.deepEqual(
    calls.map(([name]) => name),
    ['createItemModel', 'createItem', 'setItemCapabilities']
  )
  assert.equal(calls[1][1].itemModelId, 'item-model-shared-1')
  assert.equal(result.itemModelId, 'item-model-shared-1')
  assert.equal(result.itemId, 'item-shared-1')
})

// Verifies the minimal SRM smoke flow still succeeds when party-service is unavailable and both binding and offering must be skipped.
test('srm smoke flow / should skip binding and offering when party-service is unavailable', async () => {
  const seed = createSmokeSeed(1700000000101)
  let searchCount = 0

  const result = await runSrmSmokeFlow(
    {
      srm: {
        query: {
          searchSuppliers: async (request) => {
            searchCount += 1
            return {
              suppliers:
                searchCount === 1
                  ? []
                  : [
                      {
                        supplierId: 'supplier-2',
                        supplierNo: 'SUP-0002',
                        tenantId: seed.tenantId,
                        displayName: seed.displayName,
                        status: 2,
                        tags: seed.tags
                      }
                    ],
              total: searchCount === 1 ? 0 : 1,
              page: request.page,
              pageSize: request.pageSize
            }
          }
        },
        management: {
          createSupplierProfile: async (request) => ({
            supplier: {
              supplierId: 'supplier-2',
              supplierNo: 'SUP-0002',
              tenantId: seed.tenantId,
              displayName: request.displayName,
              status: 2,
              tags: request.tags ?? []
            }
          })
        }
      }
    },
    seed
  )

  assert.equal(result.binding.status, 'skipped')
  assert.equal(result.binding.reason, 'party-service unavailable')
  assert.equal(result.offering.status, 'skipped')
  assert.equal(result.offering.reason, 'binding not available')
})

// Verifies the optional item-master path can be skipped cleanly after a successful bind when the environment does not allow offering setup.
test('srm smoke flow / should skip offering when item-master-service is unavailable after a successful bind', async () => {
  const seed = createSmokeSeed(1700000000102)
  let searchCount = 0

  const result = await runSrmSmokeFlow(
    {
      srm: {
        query: {
          searchSuppliers: async (request) => {
            searchCount += 1
            return {
              suppliers:
                searchCount === 1
                  ? []
                  : [
                      {
                        supplierId: 'supplier-3',
                        supplierNo: 'SUP-0003',
                        tenantId: seed.tenantId,
                        displayName: seed.displayName,
                        status: 2,
                        tags: seed.tags
                      }
                    ],
              total: searchCount === 1 ? 0 : 1,
              page: request.page,
              pageSize: request.pageSize
            }
          }
        },
        management: {
          createSupplierProfile: async (request) => ({
            supplier: {
              supplierId: 'supplier-3',
              supplierNo: 'SUP-0003',
              tenantId: seed.tenantId,
              displayName: request.displayName,
              status: 2,
              tags: request.tags ?? []
            }
          }),
          bindSupplierToTenantParty: async (request) => ({
            supplier: {
              supplierId: request.supplierId,
              supplierNo: 'SUP-0003',
              tenantId: seed.tenantId,
              displayName: seed.displayName,
              status: 2,
              tags: seed.tags,
              partyBinding: {
                tenantPartyId: request.tenantPartyId,
                bindingStatus: 1,
                partyDisplayName: seed.partyLocalDisplayName
              }
            }
          }),
          changeSupplierStatus: async (request) => ({
            supplier: {
              supplierId: request.supplierId,
              supplierNo: 'SUP-0003',
              tenantId: seed.tenantId,
              displayName: seed.displayName,
              status: 1,
              tags: seed.tags,
              partyBinding: {
                tenantPartyId: 'tenant-party-3',
                bindingStatus: 1,
                partyDisplayName: seed.partyLocalDisplayName
              }
            }
          })
        }
      },
      party: {
        registration: {
          registerTenantParty: async () => ({
            tenantParty: { id: 'tenant-party-3' },
            matchResult: 'CREATED'
          })
        }
      },
      itemMaster: {
        management: {
          createItem: async () => {
            const error = new Error('item-master-service unavailable')
            error.srmSmokeOptionalItemMasterUnavailable = true
            throw error
          }
        }
      }
    },
    seed
  )

  assert.equal(result.binding.status, 'bound')
  assert.equal(result.offering.status, 'skipped')
  assert.equal(result.offering.reason, 'item-master-service unavailable')
})
