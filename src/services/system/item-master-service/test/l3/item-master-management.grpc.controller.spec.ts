import { status } from '@grpc/grpc-js'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import {
  ItemCategoryStatus,
  ItemNatureType,
  ItemStatus,
  ItemStructureType
} from '@oes/common/generated/item_master_service'
import { UpdateItemBasicsCommand } from '../../src/application/commands/update-item-basics.command'
import { ChangeItemStatusCommand } from '../../src/application/commands/change-item-status.command'
import { ItemMasterManagementGrpcController } from '../../src/interfaces/grpc/item-master-management.grpc.controller'
import { Item } from '../../src/domain/aggregates/item.aggregate'
import {
  ItemCapabilities,
  ItemStatus as DomainItemStatus
} from '../../src/domain/value-objects/item.value-objects'
import { ItemMasterAuditService } from '../../src/application/services/item-master-audit.service'
import { CreateItemCategoryCommand } from '../../src/application/commands/create-item-category.command'
import { SetItemPrimaryCategoryCommand } from '../../src/application/commands/set-item-primary-category.command'

function buildItem(): Item {
  return Item.reconstitute({
    id: 'item-1',
    tenantId: 'tenant-1',
    itemCode: 'ITEM-001',
    itemName: 'Demo Item',
    structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_SINGLE as never,
    natureType: ItemNatureType.ITEM_NATURE_TYPE_PHYSICAL as never,
    status: DomainItemStatus.ACTIVE,
    capabilities: ItemCapabilities.none()
  })
}

describe('ItemMasterManagementGrpcController L3', () => {
  const createCommandBus = () => ({
    execute: jest.fn()
  })

  const createAuditService = () => ({
    recordCommand: jest.fn()
  })

  it('gRPC UpdateItemBasics / when request attempts reclassification / should reject with INVALID_ARGUMENT before dispatch', async () => {
    const commandBus = createCommandBus()
    const auditService = createAuditService()
    const controller = new ItemMasterManagementGrpcController(
      commandBus as unknown as ValidatingCommandBus,
      auditService as unknown as ItemMasterAuditService
    )

    await expect(
      controller.updateItemBasics({
        tenantId: 'tenant-1',
        itemId: 'item-1',
        itemCode: 'ITEM-002',
        itemName: 'Renamed',
        structureType: ItemStructureType.ITEM_STRUCTURE_TYPE_BUNDLE
      } as never)
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })

    expect(commandBus.execute).not.toHaveBeenCalled()
  })

  it('gRPC ChangeItemStatus / when request is valid / should map target status and return item summary', async () => {
    const commandBus = createCommandBus()
    const auditService = createAuditService()
    const controller = new ItemMasterManagementGrpcController(
      commandBus as unknown as ValidatingCommandBus,
      auditService as unknown as ItemMasterAuditService
    )

    commandBus.execute.mockResolvedValue(buildItem())
    auditService.recordCommand.mockImplementation(async (_input, callback) => callback())

    const result = await controller.changeItemStatus({
      tenantId: 'tenant-1',
      itemId: 'item-1',
      targetStatus: ItemStatus.ITEM_STATUS_ACTIVE
    } as never)

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<ChangeItemStatusCommand>({
        tenantId: 'tenant-1',
        itemId: 'item-1',
        targetStatus: DomainItemStatus.ACTIVE
      })
    )
    expect(result.item?.itemId).toBe('item-1')
  })

  it('gRPC UpdateItemBasics / when request is valid / should map into UpdateItemBasicsCommand', async () => {
    const commandBus = createCommandBus()
    const auditService = createAuditService()
    const controller = new ItemMasterManagementGrpcController(
      commandBus as unknown as ValidatingCommandBus,
      auditService as unknown as ItemMasterAuditService
    )

    commandBus.execute.mockResolvedValue(buildItem())
    auditService.recordCommand.mockImplementation(async (_input, callback) => callback())

    await controller.updateItemBasics({
      tenantId: 'tenant-1',
      itemId: 'item-1',
      itemCode: 'ITEM-002',
      itemName: 'Renamed'
    } as never)

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<UpdateItemBasicsCommand>({
        tenantId: 'tenant-1',
        itemId: 'item-1',
        itemCode: 'ITEM-002',
        itemName: 'Renamed'
      })
    )
  })

  it('gRPC CreateItemCategory / when request is valid / should map into CreateItemCategoryCommand', async () => {
    const commandBus = createCommandBus()
    const auditService = createAuditService()
    const controller = new ItemMasterManagementGrpcController(
      commandBus as unknown as ValidatingCommandBus,
      auditService as unknown as ItemMasterAuditService
    )

    commandBus.execute.mockResolvedValue({
      id: 'category-1',
      tenantId: 'tenant-1',
      categoryCode: 'CAT-001',
      categoryName: 'Root Category',
      parentCategoryId: undefined,
      status: 'ACTIVE',
      hasChildren: false
    })
    auditService.recordCommand.mockImplementation(async (_input, callback) => callback())

    await (controller as any).createItemCategory({
      tenantId: 'tenant-1',
      categoryCode: 'CAT-001',
      categoryName: 'Root Category'
    })

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<CreateItemCategoryCommand>({
        tenantId: 'tenant-1',
        categoryCode: 'CAT-001',
        categoryName: 'Root Category'
      } as never)
    )
  })

  it('gRPC SetItemPrimaryCategory / when request clears primary category / should map nullable category_id into command', async () => {
    const commandBus = createCommandBus()
    const auditService = createAuditService()
    const controller = new ItemMasterManagementGrpcController(
      commandBus as unknown as ValidatingCommandBus,
      auditService as unknown as ItemMasterAuditService
    )

    commandBus.execute.mockResolvedValue(buildItem())
    auditService.recordCommand.mockImplementation(async (_input, callback) => callback())

    await (controller as any).setItemPrimaryCategory({
      tenantId: 'tenant-1',
      itemId: 'item-1',
      categoryId: ''
    })

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<SetItemPrimaryCategoryCommand>({
        tenantId: 'tenant-1',
        itemId: 'item-1',
        categoryId: undefined
      } as never)
    )
  })

  it('gRPC ChangeItemCategoryStatus / when request is valid / should forward category status enum through audit boundary', async () => {
    const commandBus = createCommandBus()
    const auditService = createAuditService()
    const controller = new ItemMasterManagementGrpcController(
      commandBus as unknown as ValidatingCommandBus,
      auditService as unknown as ItemMasterAuditService
    )

    commandBus.execute.mockResolvedValue({
      id: 'category-1',
      tenantId: 'tenant-1',
      categoryCode: 'CAT-001',
      categoryName: 'Root Category',
      parentCategoryId: undefined,
      status: 'INACTIVE',
      hasChildren: false
    })
    auditService.recordCommand.mockImplementation(async (_input, callback) => callback())

    await (controller as any).changeItemCategoryStatus({
      tenantId: 'tenant-1',
      categoryId: 'category-1',
      targetStatus: ItemCategoryStatus.ITEM_CATEGORY_STATUS_INACTIVE
    })

    expect(commandBus.execute).toHaveBeenCalled()
  })
})
