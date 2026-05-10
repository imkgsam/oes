import { ItemType } from '@oes/common/generated/item_master_service'
import { ItemMasterManagementGrpcController } from '../../src/interfaces/grpc/item-master-management.grpc.controller'
import { ItemMasterQueryGrpcController } from '../../src/interfaces/grpc/item-master-query.grpc.controller'

/** V2 gRPC controller tests ensure controllers stay thin and delegate to application services. */
describe('item-master V2 gRPC controllers', () => {
  it('query controller delegates ResolveItemVariant to the query application service', async () => {
    const queries = {
      resolveItemVariant: jest.fn().mockResolvedValue({ resolutionStatus: 2 })
    }
    const controller = new ItemMasterQueryGrpcController(queries as never)

    await expect(
      controller.resolveItemVariant({
        tenantId: 'tenant-1',
        itemModelId: 'model-1',
        lockedAttributeOptionIds: ['option-1'],
        packagingSpecId: ''
      })
    ).resolves.toEqual({ resolutionStatus: 2 })
    expect(queries.resolveItemVariant).toHaveBeenCalledWith(
      expect.objectContaining({
        itemModelId: 'model-1'
      })
    )
  })

  it('management controller wraps CreateItem in local audit and delegates to command application service', async () => {
    const commands = {
      createItem: jest.fn().mockResolvedValue({ itemId: 'item-1' })
    }
    const audit = {
      recordCommand: jest.fn(async (_input, execute) => execute())
    }
    const controller = new ItemMasterManagementGrpcController(commands as never, audit as never)

    await expect(
      controller.createItem({
        tenantId: 'tenant-1',
        itemModelId: 'model-1',
        itemCode: 'ITEM-1',
        itemName: 'Item 1',
        itemType: ItemType.ITEM_TYPE_STANDARD,
        lockedAttributeOptionIds: [],
        packagingSpecId: ''
      })
    ).resolves.toEqual({ itemId: 'item-1' })
    expect(audit.recordCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        commandName: 'CreateItem',
        tenantId: 'tenant-1'
      }),
      expect.any(Function)
    )
    expect(commands.createItem).toHaveBeenCalled()
  })
})
