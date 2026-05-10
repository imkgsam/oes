import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ChangeBomStatusRequest,
  ChangeBomStatusResponse,
  ChangeItemCategoryStatusRequest,
  ChangeItemCategoryStatusResponse,
  ChangeItemModelStatusRequest,
  ChangeItemModelStatusResponse,
  ChangeItemStatusRequest,
  ChangeItemStatusResponse,
  ChangePackagingMethodStatusRequest,
  ChangePackagingMethodStatusResponse,
  ChangePackagingSpecStatusRequest,
  ChangePackagingSpecStatusResponse,
  CreateAttributeDefinitionRequest,
  CreateAttributeDefinitionResponse,
  CreateAttributeOptionRequest,
  CreateAttributeOptionResponse,
  CreateBomRequest,
  CreateBomResponse,
  CreateItemCategoryRequest,
  CreateItemCategoryResponse,
  CreateItemModelRequest,
  CreateItemModelResponse,
  CreateItemRequest,
  CreateItemResponse,
  CreatePackagingMethodRequest,
  CreatePackagingMethodResponse,
  CreatePackagingSpecRequest,
  CreatePackagingSpecResponse,
  ItemMasterManagementServiceController,
  ItemMasterManagementServiceControllerMethods,
  ReplaceBomLinesRequest,
  ReplaceBomLinesResponse,
  SetItemCapabilitiesRequest,
  SetItemCapabilitiesResponse,
  SetItemModelAttributeRulesRequest,
  SetItemModelAttributeRulesResponse,
  SetItemModelCapabilitiesRequest,
  SetItemModelCapabilitiesResponse,
  SetItemModelPrimaryCategoryRequest,
  SetItemModelPrimaryCategoryResponse,
  UpdateAttributeDefinitionRequest,
  UpdateAttributeDefinitionResponse,
  UpdateAttributeOptionRequest,
  UpdateAttributeOptionResponse,
  UpdateBomBasicsRequest,
  UpdateBomBasicsResponse,
  UpdateItemBasicsRequest,
  UpdateItemBasicsResponse,
  UpdateItemCategoryBasicsRequest,
  UpdateItemCategoryBasicsResponse,
  UpdateItemModelBasicsRequest,
  UpdateItemModelBasicsResponse,
  UpdatePackagingMethodRequest,
  UpdatePackagingMethodResponse,
  UpdatePackagingSpecRequest,
  UpdatePackagingSpecResponse,
  UpsertSupplierItemMappingRequest,
  UpsertSupplierItemMappingResponse
} from '@oes/common/generated/item_master_service'
import { ItemMasterManagementV2Service } from '../../application/item-master-v2.service'
import { ItemMasterAuditService } from '../../application/services/item-master-audit.service'
import { ItemMasterRpcContextGuard } from './item-master-rpc-context.guard'

/** ItemMasterManagementGrpcController exposes Contract V2 command RPCs with local audit wrapping. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(ItemMasterRpcContextGuard)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@ItemMasterManagementServiceControllerMethods()
export class ItemMasterManagementGrpcController implements ItemMasterManagementServiceController {
  constructor(
    private readonly commands: ItemMasterManagementV2Service,
    private readonly auditService: ItemMasterAuditService
  ) {}

  createItemModel(request: CreateItemModelRequest): Promise<CreateItemModelResponse> {
    return this.audit('CreateItemModel', request.tenantId, null, request, () => this.commands.createItemModel(request))
  }

  updateItemModelBasics(request: UpdateItemModelBasicsRequest): Promise<UpdateItemModelBasicsResponse> {
    return this.audit('UpdateItemModelBasics', request.tenantId, request.itemModelId, request, () =>
      this.commands.updateItemModelBasics(request)
    )
  }

  setItemModelCapabilities(request: SetItemModelCapabilitiesRequest): Promise<SetItemModelCapabilitiesResponse> {
    return this.audit('SetItemModelCapabilities', request.tenantId, request.itemModelId, request, () =>
      this.commands.setItemModelCapabilities(request)
    )
  }

  changeItemModelStatus(request: ChangeItemModelStatusRequest): Promise<ChangeItemModelStatusResponse> {
    return this.audit('ChangeItemModelStatus', request.tenantId, request.itemModelId, request, () =>
      this.commands.changeItemModelStatus(request)
    )
  }

  setItemModelPrimaryCategory(
    request: SetItemModelPrimaryCategoryRequest
  ): Promise<SetItemModelPrimaryCategoryResponse> {
    return this.audit('SetItemModelPrimaryCategory', request.tenantId, request.itemModelId, request, () =>
      this.commands.setItemModelPrimaryCategory(request)
    )
  }

  createAttributeDefinition(request: CreateAttributeDefinitionRequest): Promise<CreateAttributeDefinitionResponse> {
    return this.audit('CreateAttributeDefinition', request.tenantId, null, request, () =>
      this.commands.createAttributeDefinition(request)
    )
  }

  updateAttributeDefinition(request: UpdateAttributeDefinitionRequest): Promise<UpdateAttributeDefinitionResponse> {
    return this.audit('UpdateAttributeDefinition', request.tenantId, request.attributeDefinitionId, request, () =>
      this.commands.updateAttributeDefinition(request)
    )
  }

  createAttributeOption(request: CreateAttributeOptionRequest): Promise<CreateAttributeOptionResponse> {
    return this.audit('CreateAttributeOption', request.tenantId, null, request, () =>
      this.commands.createAttributeOption(request)
    )
  }

  updateAttributeOption(request: UpdateAttributeOptionRequest): Promise<UpdateAttributeOptionResponse> {
    return this.audit('UpdateAttributeOption', request.tenantId, request.attributeOptionId, request, () =>
      this.commands.updateAttributeOption(request)
    )
  }

  setItemModelAttributeRules(
    request: SetItemModelAttributeRulesRequest
  ): Promise<SetItemModelAttributeRulesResponse> {
    return this.audit('SetItemModelAttributeRules', request.tenantId, request.itemModelId, request, () =>
      this.commands.setItemModelAttributeRules(request)
    )
  }

  createItem(request: CreateItemRequest): Promise<CreateItemResponse> {
    return this.audit('CreateItem', request.tenantId, null, request, () => this.commands.createItem(request))
  }

  updateItemBasics(request: UpdateItemBasicsRequest): Promise<UpdateItemBasicsResponse> {
    return this.audit('UpdateItemBasics', request.tenantId, request.itemId, request, () =>
      this.commands.updateItemBasics(request)
    )
  }

  setItemCapabilities(request: SetItemCapabilitiesRequest): Promise<SetItemCapabilitiesResponse> {
    return this.audit('SetItemCapabilities', request.tenantId, request.itemId, request, () =>
      this.commands.setItemCapabilities(request)
    )
  }

  changeItemStatus(request: ChangeItemStatusRequest): Promise<ChangeItemStatusResponse> {
    return this.audit('ChangeItemStatus', request.tenantId, request.itemId, request, () =>
      this.commands.changeItemStatus(request)
    )
  }

  createItemCategory(request: CreateItemCategoryRequest): Promise<CreateItemCategoryResponse> {
    return this.audit('CreateItemCategory', request.tenantId, null, request, () =>
      this.commands.createItemCategory(request)
    )
  }

  updateItemCategoryBasics(request: UpdateItemCategoryBasicsRequest): Promise<UpdateItemCategoryBasicsResponse> {
    return this.audit('UpdateItemCategoryBasics', request.tenantId, request.categoryId, request, () =>
      this.commands.updateItemCategoryBasics(request)
    )
  }

  changeItemCategoryStatus(request: ChangeItemCategoryStatusRequest): Promise<ChangeItemCategoryStatusResponse> {
    return this.audit('ChangeItemCategoryStatus', request.tenantId, request.categoryId, request, () =>
      this.commands.changeItemCategoryStatus(request)
    )
  }

  createPackagingMethod(request: CreatePackagingMethodRequest): Promise<CreatePackagingMethodResponse> {
    return this.audit('CreatePackagingMethod', request.tenantId, null, request, () =>
      this.commands.createPackagingMethod(request)
    )
  }

  updatePackagingMethod(request: UpdatePackagingMethodRequest): Promise<UpdatePackagingMethodResponse> {
    return this.audit('UpdatePackagingMethod', request.tenantId, request.packagingMethodId, request, () =>
      this.commands.updatePackagingMethod(request)
    )
  }

  changePackagingMethodStatus(
    request: ChangePackagingMethodStatusRequest
  ): Promise<ChangePackagingMethodStatusResponse> {
    return this.audit('ChangePackagingMethodStatus', request.tenantId, request.packagingMethodId, request, () =>
      this.commands.changePackagingMethodStatus(request)
    )
  }

  createPackagingSpec(request: CreatePackagingSpecRequest): Promise<CreatePackagingSpecResponse> {
    return this.audit('CreatePackagingSpec', request.tenantId, null, request, () =>
      this.commands.createPackagingSpec(request)
    )
  }

  updatePackagingSpec(request: UpdatePackagingSpecRequest): Promise<UpdatePackagingSpecResponse> {
    return this.audit('UpdatePackagingSpec', request.tenantId, request.packagingSpecId, request, () =>
      this.commands.updatePackagingSpec(request)
    )
  }

  changePackagingSpecStatus(request: ChangePackagingSpecStatusRequest): Promise<ChangePackagingSpecStatusResponse> {
    return this.audit('ChangePackagingSpecStatus', request.tenantId, request.packagingSpecId, request, () =>
      this.commands.changePackagingSpecStatus(request)
    )
  }

  createBom(request: CreateBomRequest): Promise<CreateBomResponse> {
    return this.audit('CreateBom', request.tenantId, null, request, () => this.commands.createBom(request))
  }

  updateBomBasics(request: UpdateBomBasicsRequest): Promise<UpdateBomBasicsResponse> {
    return this.audit('UpdateBomBasics', request.tenantId, request.bomId, request, () =>
      this.commands.updateBomBasics(request)
    )
  }

  replaceBomLines(request: ReplaceBomLinesRequest): Promise<ReplaceBomLinesResponse> {
    return this.audit('ReplaceBomLines', request.tenantId, request.bomId, request, () =>
      this.commands.replaceBomLines(request)
    )
  }

  changeBomStatus(request: ChangeBomStatusRequest): Promise<ChangeBomStatusResponse> {
    return this.audit('ChangeBomStatus', request.tenantId, request.bomId, request, () =>
      this.commands.changeBomStatus(request)
    )
  }

  upsertSupplierItemMapping(request: UpsertSupplierItemMappingRequest): Promise<UpsertSupplierItemMappingResponse> {
    return this.audit('UpsertSupplierItemMapping', request.tenantId, request.itemId, request, () =>
      this.commands.upsertSupplierItemMapping(request)
    )
  }

  /** audit wraps each command in the local audit envelope required by item-master Contract V2. */
  private audit<T>(
    commandName: string,
    tenantId: string | undefined,
    targetId: string | undefined | null,
    requestSummary: object,
    execute: () => Promise<T>
  ): Promise<T> {
    return this.auditService.recordCommand(
      {
        tenantId: tenantId ?? '',
        commandName,
        targetId: targetId ?? null,
        requestSummary: requestSummary as Record<string, unknown>
      },
      execute
    )
  }
}
