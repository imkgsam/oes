import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ChangeItemCategoryStatusRequest,
  ChangeItemCategoryStatusResponse,
  ChangeItemStatusRequest,
  ChangeItemStatusResponse,
  CreateItemCategoryRequest,
  CreateItemCategoryResponse,
  CreateItemRequest,
  CreateItemResponse,
  ItemCategoryStatus as ProtoItemCategoryStatus,
  ItemMasterManagementServiceController,
  ItemMasterManagementServiceControllerMethods,
  SetItemCapabilitiesRequest,
  SetItemCapabilitiesResponse,
  SetItemCompositionRequest,
  SetItemCompositionResponse,
  SetItemPrimaryCategoryRequest,
  SetItemPrimaryCategoryResponse,
  UpdateItemCategoryBasicsRequest,
  UpdateItemCategoryBasicsResponse,
  UpdateItemBasicsRequest,
  UpdateItemBasicsResponse,
  UpsertSupplierItemMappingRequest,
  UpsertSupplierItemMappingResponse
} from '@oes/common/generated/item_master_service'
import { ITEM_MASTER_INVALID_ARGUMENT } from '../../common/errors/item-master.errors'
import { CreateItemCommand } from '../../application/commands/create-item.command'
import { UpdateItemBasicsCommand } from '../../application/commands/update-item-basics.command'
import { SetItemCapabilitiesCommand } from '../../application/commands/set-item-capabilities.command'
import { SetItemCompositionCommand } from '../../application/commands/set-item-composition.command'
import { SetItemCompositionResult } from '../../application/commands/set-item-composition.handler'
import { UpsertSupplierItemMappingCommand } from '../../application/commands/upsert-supplier-item-mapping.command'
import { ChangeItemStatusCommand } from '../../application/commands/change-item-status.command'
import { CreateItemCategoryCommand } from '../../application/commands/create-item-category.command'
import { UpdateItemCategoryBasicsCommand } from '../../application/commands/update-item-category-basics.command'
import { ChangeItemCategoryStatusCommand } from '../../application/commands/change-item-category-status.command'
import { SetItemPrimaryCategoryCommand } from '../../application/commands/set-item-primary-category.command'
import { ItemMasterAuditService } from '../../application/services/item-master-audit.service'
import { ItemMasterGrpcPresenter } from './item-master-grpc.presenter'
import { ItemMasterRpcContextGuard } from './item-master-rpc-context.guard'
import { Item } from '../../domain/aggregates/item.aggregate'
import { ItemCategory } from '../../domain/aggregates/item-category.aggregate'
import { SupplierItemMapping } from '../../domain/repositories/supplier-item-mapping.repository'
import { ItemCategoryStatus } from '../../domain/value-objects/item-category.value-objects'
import { ItemCapabilities, ItemNatureType, ItemStatus, ItemStructureType } from '../../domain/value-objects/item.value-objects'

/** ItemMasterManagementGrpcController exposes the phase 1 command gRPC contract with local audit recording. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(ItemMasterRpcContextGuard)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@ItemMasterManagementServiceControllerMethods()
export class ItemMasterManagementGrpcController implements ItemMasterManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly auditService: ItemMasterAuditService
  ) {}

  async createItem(request: CreateItemRequest): Promise<CreateItemResponse> {
    return this.auditService.recordCommand(
      {
        tenantId: request.tenantId ?? '',
        commandName: 'CreateItem',
        targetId: null,
        requestSummary: {
          itemCode: request.itemCode ?? '',
          itemName: request.itemName ?? '',
          structureType: request.structureType ?? 0,
          natureType: request.natureType ?? 0
        }
      },
      async () => {
        const item = await this.commandBus.execute<CreateItemCommand, Item>(
          new CreateItemCommand({
            tenantId: request.tenantId ?? '',
            itemCode: request.itemCode ?? '',
            itemName: request.itemName ?? '',
            structureType: toDomainStructureType(request.structureType),
            natureType: toDomainNatureType(request.natureType)
          })
        )

        return ItemMasterGrpcPresenter.toCreateItemResponse(item)
      }
    )
  }

  async updateItemBasics(request: UpdateItemBasicsRequest): Promise<UpdateItemBasicsResponse> {
    rejectUnexpectedClassificationMutation(request)

    return this.auditService.recordCommand(
      {
        tenantId: request.tenantId ?? '',
        commandName: 'UpdateItemBasics',
        targetId: request.itemId ?? null,
        requestSummary: {
          itemId: request.itemId ?? '',
          itemCode: request.itemCode ?? '',
          itemName: request.itemName ?? ''
        }
      },
      async () => {
        const item = await this.commandBus.execute<UpdateItemBasicsCommand, Item>(
          new UpdateItemBasicsCommand({
            tenantId: request.tenantId ?? '',
            itemId: request.itemId ?? '',
            itemCode: request.itemCode ?? '',
            itemName: request.itemName ?? ''
          })
        )

        return ItemMasterGrpcPresenter.toUpdateItemBasicsResponse(item)
      }
    )
  }

  async setItemCapabilities(request: SetItemCapabilitiesRequest): Promise<SetItemCapabilitiesResponse> {
    return this.auditService.recordCommand(
      {
        tenantId: request.tenantId ?? '',
        commandName: 'SetItemCapabilities',
        targetId: request.itemId ?? null,
        requestSummary: {
          itemId: request.itemId ?? '',
          capabilities: request.capabilities ?? {}
        }
      },
      async () => {
        const item = await this.commandBus.execute<SetItemCapabilitiesCommand, Item>(
          new SetItemCapabilitiesCommand({
            tenantId: request.tenantId ?? '',
            itemId: request.itemId ?? '',
            capabilities: ItemCapabilities.from(request.capabilities ?? {})
          })
        )

        return ItemMasterGrpcPresenter.toSetItemCapabilitiesResponse(item)
      }
    )
  }

  async setItemComposition(request: SetItemCompositionRequest): Promise<SetItemCompositionResponse> {
    return this.auditService.recordCommand(
      {
        tenantId: request.tenantId ?? '',
        commandName: 'SetItemComposition',
        targetId: request.itemId ?? null,
        requestSummary: {
          itemId: request.itemId ?? '',
          componentItemIds: (request.components ?? []).map((component) => component.componentItemId ?? '')
        }
      },
      async () => {
        const result = await this.commandBus.execute<SetItemCompositionCommand, SetItemCompositionResult>(
          new SetItemCompositionCommand({
            tenantId: request.tenantId ?? '',
            itemId: request.itemId ?? '',
            componentItemIds: (request.components ?? []).map((component) => component.componentItemId ?? '')
          })
        )

        return ItemMasterGrpcPresenter.toSetItemCompositionResponse(result)
      }
    )
  }

  async upsertSupplierItemMapping(
    request: UpsertSupplierItemMappingRequest
  ): Promise<UpsertSupplierItemMappingResponse> {
    return this.auditService.recordCommand(
      {
        tenantId: request.tenantId ?? '',
        commandName: 'UpsertSupplierItemMapping',
        targetId: request.itemId ?? null,
        requestSummary: {
          supplierId: request.supplierId ?? '',
          supplierItemCode: request.supplierItemCode ?? '',
          supplierItemName: request.supplierItemName ?? '',
          itemId: request.itemId ?? ''
        }
      },
      async () => {
        const mapping = await this.commandBus.execute<UpsertSupplierItemMappingCommand, SupplierItemMapping>(
          new UpsertSupplierItemMappingCommand({
            tenantId: request.tenantId ?? '',
            supplierId: request.supplierId ?? '',
            supplierItemCode: request.supplierItemCode ?? undefined,
            supplierItemName: request.supplierItemName ?? undefined,
            itemId: request.itemId ?? ''
          })
        )

        return ItemMasterGrpcPresenter.toUpsertSupplierItemMappingResponse(mapping)
      }
    )
  }

  async changeItemStatus(request: ChangeItemStatusRequest): Promise<ChangeItemStatusResponse> {
    return this.auditService.recordCommand(
      {
        tenantId: request.tenantId ?? '',
        commandName: 'ChangeItemStatus',
        targetId: request.itemId ?? null,
        requestSummary: {
          itemId: request.itemId ?? '',
          targetStatus: request.targetStatus ?? 0
        }
      },
      async () => {
        const item = await this.commandBus.execute<ChangeItemStatusCommand, Item>(
          new ChangeItemStatusCommand({
            tenantId: request.tenantId ?? '',
            itemId: request.itemId ?? '',
            targetStatus: toDomainStatus(request.targetStatus)
          })
        )

        return ItemMasterGrpcPresenter.toChangeItemStatusResponse(item)
      }
    )
  }

  async createItemCategory(request: CreateItemCategoryRequest): Promise<CreateItemCategoryResponse> {
    return this.auditService.recordCommand(
      {
        tenantId: request.tenantId ?? '',
        commandName: 'CreateItemCategory',
        targetId: null,
        requestSummary: {
          categoryCode: request.categoryCode ?? '',
          categoryName: request.categoryName ?? '',
          parentCategoryId: request.parentCategoryId ?? ''
        }
      },
      async () => {
        const category = await this.commandBus.execute<CreateItemCategoryCommand, ItemCategory>(
          new CreateItemCategoryCommand({
            tenantId: request.tenantId ?? '',
            categoryCode: request.categoryCode ?? '',
            categoryName: request.categoryName ?? '',
            parentCategoryId: normalizeOptionalId(request.parentCategoryId)
          })
        )

        return ItemMasterGrpcPresenter.toCreateItemCategoryResponse(category)
      }
    )
  }

  async updateItemCategoryBasics(
    request: UpdateItemCategoryBasicsRequest
  ): Promise<UpdateItemCategoryBasicsResponse> {
    return this.auditService.recordCommand(
      {
        tenantId: request.tenantId ?? '',
        commandName: 'UpdateItemCategoryBasics',
        targetId: request.categoryId ?? null,
        requestSummary: {
          categoryId: request.categoryId ?? '',
          categoryCode: request.categoryCode ?? '',
          categoryName: request.categoryName ?? ''
        }
      },
      async () => {
        const category = await this.commandBus.execute<UpdateItemCategoryBasicsCommand, ItemCategory>(
          new UpdateItemCategoryBasicsCommand({
            tenantId: request.tenantId ?? '',
            categoryId: request.categoryId ?? '',
            categoryCode: request.categoryCode ?? '',
            categoryName: request.categoryName ?? ''
          })
        )

        return ItemMasterGrpcPresenter.toUpdateItemCategoryBasicsResponse(category)
      }
    )
  }

  async changeItemCategoryStatus(
    request: ChangeItemCategoryStatusRequest
  ): Promise<ChangeItemCategoryStatusResponse> {
    return this.auditService.recordCommand(
      {
        tenantId: request.tenantId ?? '',
        commandName: 'ChangeItemCategoryStatus',
        targetId: request.categoryId ?? null,
        requestSummary: {
          categoryId: request.categoryId ?? '',
          targetStatus: request.targetStatus ?? 0
        }
      },
      async () => {
        const category = await this.commandBus.execute<ChangeItemCategoryStatusCommand, ItemCategory>(
          new ChangeItemCategoryStatusCommand({
            tenantId: request.tenantId ?? '',
            categoryId: request.categoryId ?? '',
            targetStatus: toDomainCategoryStatus(request.targetStatus)
          })
        )

        return ItemMasterGrpcPresenter.toChangeItemCategoryStatusResponse(category)
      }
    )
  }

  async setItemPrimaryCategory(
    request: SetItemPrimaryCategoryRequest
  ): Promise<SetItemPrimaryCategoryResponse> {
    return this.auditService.recordCommand(
      {
        tenantId: request.tenantId ?? '',
        commandName: 'SetItemPrimaryCategory',
        targetId: request.itemId ?? null,
        requestSummary: {
          itemId: request.itemId ?? '',
          categoryId: request.categoryId ?? ''
        }
      },
      async () => {
        const item = await this.commandBus.execute<SetItemPrimaryCategoryCommand, Item>(
          new SetItemPrimaryCategoryCommand({
            tenantId: request.tenantId ?? '',
            itemId: request.itemId ?? '',
            categoryId: normalizeOptionalId(request.categoryId)
          })
        )

        return ItemMasterGrpcPresenter.toSetItemPrimaryCategoryResponse(item)
      }
    )
  }
}

/** rejectUnexpectedClassificationMutation protects UpdateItemBasics from silent contract creep at the RPC boundary. */
function rejectUnexpectedClassificationMutation(request: UpdateItemBasicsRequest): void {
  const candidate = request as UpdateItemBasicsRequest & {
    structureType?: unknown
    natureType?: unknown
  }

  if (candidate.structureType !== undefined || candidate.natureType !== undefined) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
      reason: 'UpdateItemBasics cannot mutate structure_type or nature_type'
    })
  }
}

/** toDomainStructureType maps generated creation enums into domain enums and rejects unspecified values. */
function toDomainStructureType(value?: number): ItemStructureType {
  if (value === 2) {
    return ItemStructureType.BUNDLE
  }
  if (value === 1) {
    return ItemStructureType.SINGLE
  }
  throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
    field: 'structureType'
  })
}

/** toDomainNatureType maps generated creation enums into domain enums and rejects unspecified values. */
function toDomainNatureType(value?: number): ItemNatureType {
  if (value === 2) {
    return ItemNatureType.VIRTUAL
  }
  if (value === 3) {
    return ItemNatureType.SERVICE
  }
  if (value === 1) {
    return ItemNatureType.PHYSICAL
  }
  throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
    field: 'natureType'
  })
}

/** toDomainStatus maps generated status enums into the minimal domain lifecycle enum and rejects unspecified values. */
function toDomainStatus(value?: number): ItemStatus {
  if (value === 2) {
    return ItemStatus.INACTIVE
  }
  if (value === 1) {
    return ItemStatus.ACTIVE
  }
  throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
    field: 'targetStatus'
  })
}

/** toDomainCategoryStatus maps generated category status enums into the minimal domain lifecycle enum. */
function toDomainCategoryStatus(value?: number): ItemCategoryStatus {
  if (value === ProtoItemCategoryStatus.ITEM_CATEGORY_STATUS_INACTIVE) {
    return ItemCategoryStatus.INACTIVE
  }
  if (value === ProtoItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE) {
    return ItemCategoryStatus.ACTIVE
  }
  throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
    field: 'targetStatus'
  })
}

/** normalizeOptionalId converts blank ids into absent phase 1 optional references. */
function normalizeOptionalId(value?: string): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined
  }
  return value.trim()
}
