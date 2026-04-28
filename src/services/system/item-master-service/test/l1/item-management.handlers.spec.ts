import { status } from '@grpc/grpc-js'
import { CreateItemCommand } from '../../src/application/commands/create-item.command'
import { CreateItemHandler } from '../../src/application/commands/create-item.handler'
import { ChangeItemStatusCommand } from '../../src/application/commands/change-item-status.command'
import { ChangeItemStatusHandler } from '../../src/application/commands/change-item-status.handler'
import { SetItemCapabilitiesCommand } from '../../src/application/commands/set-item-capabilities.command'
import { SetItemCapabilitiesHandler } from '../../src/application/commands/set-item-capabilities.handler'
import { SetItemCompositionCommand } from '../../src/application/commands/set-item-composition.command'
import { SetItemCompositionHandler } from '../../src/application/commands/set-item-composition.handler'
import { UpdateItemBasicsCommand } from '../../src/application/commands/update-item-basics.command'
import { UpdateItemBasicsHandler } from '../../src/application/commands/update-item-basics.handler'
import { Item } from '../../src/domain/aggregates/item.aggregate'
import {
  ItemCapabilities,
  ItemNatureType,
  ItemStatus,
  ItemStructureType
} from '../../src/domain/value-objects/item.value-objects'
import { ItemCompositionRepository } from '../../src/domain/repositories/item-composition.repository'
import { ItemRepository } from '../../src/domain/repositories/item.repository'

function createItemRepositoryMock(): jest.Mocked<ItemRepository> {
  return {
    findById: jest.fn(),
    findByIds: jest.fn(),
    findByCode: jest.fn(),
    save: jest.fn(),
    search: jest.fn()
  }
}

function createCompositionRepositoryMock(): jest.Mocked<ItemCompositionRepository> {
  return {
    replaceForParent: jest.fn(),
    listByParentId: jest.fn()
  }
}

function buildItem(overrides: Partial<Parameters<typeof Item.reconstitute>[0]> = {}): Item {
  return Item.reconstitute({
    id: 'item-1',
    tenantId: 'tenant-1',
    itemCode: 'ITEM-001',
    itemName: 'Demo Item',
    structureType: ItemStructureType.SINGLE,
    natureType: ItemNatureType.PHYSICAL,
    status: ItemStatus.ACTIVE,
    capabilities: ItemCapabilities.none(),
    ...overrides
  })
}

describe('Item management handlers L1', () => {
  it('CreateItem / when item_code already exists / should reject with ALREADY_EXISTS', async () => {
    const itemRepository = createItemRepositoryMock()
    const handler = new CreateItemHandler(itemRepository)

    itemRepository.findByCode.mockResolvedValue(buildItem())

    await expect(
      handler.execute(
        new CreateItemCommand({
          tenantId: 'tenant-1',
          itemCode: 'ITEM-001',
          itemName: 'Duplicate',
          structureType: ItemStructureType.SINGLE,
          natureType: ItemNatureType.PHYSICAL
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })
  })

  it('SetItemCapabilities / when stockable is true on non-PHYSICAL item / should reject with FAILED_PRECONDITION', async () => {
    const itemRepository = createItemRepositoryMock()
    const handler = new SetItemCapabilitiesHandler(itemRepository)

    itemRepository.findById.mockResolvedValue(
      buildItem({
        natureType: ItemNatureType.VIRTUAL
      })
    )

    await expect(
      handler.execute(
        new SetItemCapabilitiesCommand({
          tenantId: 'tenant-1',
          itemId: 'item-1',
          capabilities: ItemCapabilities.from({
            sellable: true,
            purchasable: false,
            stockable: true,
            manufacturable: false
          })
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('SetItemCapabilities / when manufacturable is true on non-PHYSICAL item / should reject with FAILED_PRECONDITION', async () => {
    const itemRepository = createItemRepositoryMock()
    const handler = new SetItemCapabilitiesHandler(itemRepository)

    itemRepository.findById.mockResolvedValue(
      buildItem({
        natureType: ItemNatureType.SERVICE
      })
    )

    await expect(
      handler.execute(
        new SetItemCapabilitiesCommand({
          tenantId: 'tenant-1',
          itemId: 'item-1',
          capabilities: ItemCapabilities.from({
            sellable: false,
            purchasable: true,
            stockable: false,
            manufacturable: true
          })
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('SetItemComposition / when parent item is not BUNDLE / should reject with FAILED_PRECONDITION', async () => {
    const itemRepository = createItemRepositoryMock()
    const compositionRepository = createCompositionRepositoryMock()
    const handler = new SetItemCompositionHandler(itemRepository, compositionRepository)

    itemRepository.findById.mockResolvedValue(buildItem())

    await expect(
      handler.execute(
        new SetItemCompositionCommand({
          tenantId: 'tenant-1',
          itemId: 'item-1',
          componentItemIds: ['item-2']
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('SetItemComposition / when component is nested bundle / should reject with FAILED_PRECONDITION', async () => {
    const itemRepository = createItemRepositoryMock()
    const compositionRepository = createCompositionRepositoryMock()
    const handler = new SetItemCompositionHandler(itemRepository, compositionRepository)

    itemRepository.findById.mockImplementation(async (_tenantId, itemId) => {
      if (itemId === 'bundle-1') {
        return buildItem({
          id: 'bundle-1',
          structureType: ItemStructureType.BUNDLE,
          natureType: ItemNatureType.VIRTUAL
        })
      }

      return buildItem({
        id: 'bundle-2',
        itemCode: 'BUNDLE-002',
        itemName: 'Nested Bundle',
        structureType: ItemStructureType.BUNDLE,
        natureType: ItemNatureType.VIRTUAL
      })
    })

    await expect(
      handler.execute(
        new SetItemCompositionCommand({
          tenantId: 'tenant-1',
          itemId: 'bundle-1',
          componentItemIds: ['bundle-2']
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('SetItemComposition / when component references parent itself / should reject with FAILED_PRECONDITION', async () => {
    const itemRepository = createItemRepositoryMock()
    const compositionRepository = createCompositionRepositoryMock()
    const handler = new SetItemCompositionHandler(itemRepository, compositionRepository)

    itemRepository.findById.mockResolvedValue(
      buildItem({
        id: 'bundle-1',
        structureType: ItemStructureType.BUNDLE,
        natureType: ItemNatureType.VIRTUAL
      })
    )

    await expect(
      handler.execute(
        new SetItemCompositionCommand({
          tenantId: 'tenant-1',
          itemId: 'bundle-1',
          componentItemIds: ['bundle-1']
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('ChangeItemStatus / when target status is the same / should return item without saving', async () => {
    const itemRepository = createItemRepositoryMock()
    const handler = new ChangeItemStatusHandler(itemRepository)
    const existing = buildItem({
      status: ItemStatus.ACTIVE
    })

    itemRepository.findById.mockResolvedValue(existing)

    const result = await handler.execute(
      new ChangeItemStatusCommand({
        tenantId: 'tenant-1',
        itemId: 'item-1',
        targetStatus: ItemStatus.ACTIVE
      })
    )

    expect(result.status).toBe(ItemStatus.ACTIVE)
    expect(itemRepository.save).not.toHaveBeenCalled()
  })

  it('UpdateItemBasics / when request tries to mutate classification / should reject with INVALID_ARGUMENT', async () => {
    const itemRepository = createItemRepositoryMock()
    const handler = new UpdateItemBasicsHandler(itemRepository)

    itemRepository.findById.mockResolvedValue(buildItem())

    await expect(
      handler.execute(
        new UpdateItemBasicsCommand({
          tenantId: 'tenant-1',
          itemId: 'item-1',
          itemCode: 'ITEM-002',
          itemName: 'Renamed Item',
          structureType: ItemStructureType.BUNDLE
        } as never)
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })
  })
})
