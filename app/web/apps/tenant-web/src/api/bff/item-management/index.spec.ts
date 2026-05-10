import { describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()
const request = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post,
    put,
    request
  }
}))

describe('item-management V2 BFF API client', async () => {
  const {
    createManagedBomApi,
    createManagedItemApi,
    createManagedItemModelApi,
    getManagedBomByOutputItemApi,
    listManagedItemModelsApi,
    replaceManagedBomLinesApi
  } = await import('./index')

  it('uses ItemModel endpoints for model-level master data', async () => {
    await listManagedItemModelsApi('tenant-1', {
      modelKind: 'PHYSICAL',
      modelType: 'FINISHED_PRODUCT'
    })
    await createManagedItemModelApi('tenant-1', {
      modelCode: 'MODEL-1',
      modelKind: 'PHYSICAL',
      modelName: 'Model 1',
      modelType: 'FINISHED_PRODUCT'
    })

    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/item-models', {
      params: {
        modelKind: 'PHYSICAL',
        modelType: 'FINISHED_PRODUCT'
      }
    })
    expect(post).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/item-models',
      expect.objectContaining({
        modelCode: 'MODEL-1',
        modelKind: 'PHYSICAL'
      })
    )
  })

  it('creates executable Items from ItemModel ids', async () => {
    await createManagedItemApi('tenant-1', {
      itemCode: 'SKU-1',
      itemModelId: 'model-1',
      itemName: 'SKU 1',
      itemType: 'STANDARD'
    })

    expect(post).toHaveBeenCalledWith(
      '/item-management/tenants/tenant-1/items',
      expect.objectContaining({
        itemModelId: 'model-1',
        itemType: 'STANDARD'
      })
    )
  })

  it('uses BOM endpoints for composition and packaging structures', async () => {
    await getManagedBomByOutputItemApi('tenant-1', 'item-out', {
      bomType: 'COMPOSITION'
    })
    await createManagedBomApi('tenant-1', {
      bomCode: 'BOM-1',
      bomName: 'BOM 1',
      bomType: 'COMPOSITION',
      outputItemId: 'item-out',
      lines: [
        {
          componentItemId: 'item-in',
          lineRole: 'COMPONENT',
          quantity: '1',
          uomCode: 'PCS'
        }
      ]
    })
    await replaceManagedBomLinesApi('tenant-1', 'bom-1', {
      lines: [
        {
          componentItemId: 'item-in',
          lineRole: 'COMPONENT',
          quantity: '1',
          uomCode: 'PCS'
        }
      ]
    })

    expect(get).toHaveBeenCalledWith('/item-management/tenants/tenant-1/items/item-out/bom', {
      params: {
        bomType: 'COMPOSITION'
      }
    })
    expect(post).toHaveBeenCalledWith('/item-management/tenants/tenant-1/boms', expect.any(Object))
    expect(put).toHaveBeenCalledWith('/item-management/tenants/tenant-1/boms/bom-1/lines', expect.any(Object))
  })
})
