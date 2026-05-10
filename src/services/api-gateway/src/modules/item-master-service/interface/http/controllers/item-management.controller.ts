import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PermissionCheckAll } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { ItemManagementService } from '../../../item-management.service'
import {
  ChangeStatusDto,
  CreateBomDto,
  CreateItemCategoryDto,
  CreateItemDto,
  CreateItemModelDto,
  ListBomsDto,
  ListItemCategoriesDto,
  ListItemModelsDto,
  ListItemsDto,
  ListSupplierMappingsDto,
  ReplaceBomLinesDto,
  SetItemCapabilitiesDto,
  SetItemModelCapabilitiesDto,
  SetItemModelPrimaryCategoryDto,
  UpdateBomBasicsDto,
  UpdateItemBasicsDto,
  UpdateItemCategoryBasicsDto,
  UpdateItemModelBasicsDto,
  UpsertSupplierItemMappingDto
} from '../dtos/item-management.dto'

const ITEM_MANAGEMENT_PERMISSIONS = {
  CREATE_BOM: 'item_master.bom.create',
  CREATE_ITEM: 'item_master.item.create',
  CREATE_ITEM_CATEGORY: 'item_master.item_category.create',
  CREATE_ITEM_MODEL: 'item_master.item_model.create',
  LIST_BOM: 'item_master.bom.list',
  LIST_ITEM: 'item_master.item.list',
  LIST_ITEM_CATEGORIES: 'item_master.item_category.list',
  LIST_ITEM_MODEL: 'item_master.item_model.list',
  LIST_SUPPLIER_ITEM_MAPPINGS: 'item_master.supplier_item_mapping.list_by_item',
  MANAGE_BOM: 'item_master.bom.manage',
  MANAGE_ITEM_MODEL: 'item_master.item_model.manage',
  SET_ITEM_CAPABILITIES: 'item_master.item.set_capabilities',
  UPDATE_ITEM_BASICS: 'item_master.item.update_basics',
  UPDATE_ITEM_CATEGORY: 'item_master.item_category.manage',
  UPDATE_ITEM_STATUS: 'item_master.item.update_status',
  UPSERT_SUPPLIER_ITEM_MAPPING: 'item_master.supplier_item_mapping.upsert',
  VIEW_ITEM_DETAIL: 'item_master.item.get_by_id',
  VIEW_ITEM_MODEL_DETAIL: 'item_master.item_model.get_by_id'
} as const

@ApiBearerAuth('JWT')
@ApiTags('item-management')
@Controller('item-management/tenants/:tenantId')
// Exposes the tenant-scoped item-master V2 BFF surface without creating a second design truth source.
export class ItemManagementController {
  constructor(private readonly itemManagementService: ItemManagementService) {}

  @Get('item-models')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.LIST_ITEM_MODEL])
  @ApiOperation({ summary: 'List tenant item models' })
  async listItemModels(
    @Param('tenantId') tenantId: string,
    @Query() query: ListItemModelsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.listItemModels(tenantId, query, source)
  }

  @Get('item-models/:itemModelId')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.VIEW_ITEM_MODEL_DETAIL])
  @ApiOperation({ summary: 'Get one item model' })
  async getItemModel(
    @Param('tenantId') tenantId: string,
    @Param('itemModelId') itemModelId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.getItemModel(tenantId, itemModelId, source)
  }

  @Post('item-models')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.CREATE_ITEM_MODEL])
  @ApiOperation({ summary: 'Create one item model' })
  @ApiBody({ type: CreateItemModelDto })
  async createItemModel(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateItemModelDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.createItemModel(tenantId, body, source)
  }

  @Patch('item-models/:itemModelId/basics')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.MANAGE_ITEM_MODEL])
  @ApiOperation({ summary: 'Update one item model code and name' })
  @ApiBody({ type: UpdateItemModelBasicsDto })
  async updateItemModelBasics(
    @Param('tenantId') tenantId: string,
    @Param('itemModelId') itemModelId: string,
    @Body() body: UpdateItemModelBasicsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.updateItemModelBasics(tenantId, itemModelId, body, source)
  }

  @Put('item-models/:itemModelId/capabilities')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.MANAGE_ITEM_MODEL])
  @ApiOperation({ summary: 'Full-replace one item model capability defaults' })
  @ApiBody({ type: SetItemModelCapabilitiesDto })
  async setItemModelCapabilities(
    @Param('tenantId') tenantId: string,
    @Param('itemModelId') itemModelId: string,
    @Body() body: SetItemModelCapabilitiesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.setItemModelCapabilities(tenantId, itemModelId, body, source)
  }

  @Patch('item-models/:itemModelId/status')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.MANAGE_ITEM_MODEL])
  @ApiOperation({ summary: 'Archive or reactivate one item model' })
  @ApiBody({ type: ChangeStatusDto })
  async changeItemModelStatus(
    @Param('tenantId') tenantId: string,
    @Param('itemModelId') itemModelId: string,
    @Body() body: ChangeStatusDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.changeItemModelStatus(tenantId, itemModelId, body, source)
  }

  @Put('item-models/:itemModelId/primary-category')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.MANAGE_ITEM_MODEL])
  @ApiOperation({ summary: 'Set or clear one item model primary category' })
  @ApiBody({ type: SetItemModelPrimaryCategoryDto })
  async setItemModelPrimaryCategory(
    @Param('tenantId') tenantId: string,
    @Param('itemModelId') itemModelId: string,
    @Body() body: SetItemModelPrimaryCategoryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.setItemModelPrimaryCategory(tenantId, itemModelId, body, source)
  }

  @Get('items')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.LIST_ITEM])
  @ApiOperation({ summary: 'List tenant executable items' })
  async listItems(
    @Param('tenantId') tenantId: string,
    @Query() query: ListItemsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.listItems(tenantId, query, source)
  }

  @Get('items/:itemId')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.VIEW_ITEM_DETAIL])
  @ApiOperation({ summary: 'Get one executable item' })
  async getItem(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.getItem(tenantId, itemId, source)
  }

  @Post('items')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.CREATE_ITEM])
  @ApiOperation({ summary: 'Create one executable item' })
  @ApiBody({ type: CreateItemDto })
  async createItem(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateItemDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.createItem(tenantId, body, source)
  }

  @Patch('items/:itemId/basics')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.UPDATE_ITEM_BASICS])
  @ApiOperation({ summary: 'Update one item code and name' })
  @ApiBody({ type: UpdateItemBasicsDto })
  async updateItemBasics(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateItemBasicsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.updateItemBasics(tenantId, itemId, body, source)
  }

  @Put('items/:itemId/capabilities')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.SET_ITEM_CAPABILITIES])
  @ApiOperation({ summary: 'Full-replace one item capability truth' })
  @ApiBody({ type: SetItemCapabilitiesDto })
  async setItemCapabilities(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @Body() body: SetItemCapabilitiesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.setItemCapabilities(tenantId, itemId, body, source)
  }

  @Patch('items/:itemId/status')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.UPDATE_ITEM_STATUS])
  @ApiOperation({ summary: 'Archive or reactivate one item' })
  @ApiBody({ type: ChangeStatusDto })
  async changeItemStatus(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @Body() body: ChangeStatusDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.changeItemStatus(tenantId, itemId, body, source)
  }

  @Get('categories')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.LIST_ITEM_CATEGORIES])
  @ApiOperation({ summary: 'List one tenant-scoped item category tree layer' })
  async listItemCategories(
    @Param('tenantId') tenantId: string,
    @Query() query: ListItemCategoriesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.listItemCategories(tenantId, query, source)
  }

  @Post('categories')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.CREATE_ITEM_CATEGORY])
  @ApiOperation({ summary: 'Create one item category node' })
  @ApiBody({ type: CreateItemCategoryDto })
  async createItemCategory(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateItemCategoryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.createItemCategory(tenantId, body, source)
  }

  @Patch('categories/:categoryId/basics')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.UPDATE_ITEM_CATEGORY])
  @ApiOperation({ summary: 'Update one item category code and name' })
  @ApiBody({ type: UpdateItemCategoryBasicsDto })
  async updateItemCategoryBasics(
    @Param('tenantId') tenantId: string,
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateItemCategoryBasicsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.updateItemCategoryBasics(tenantId, categoryId, body, source)
  }

  @Patch('categories/:categoryId/status')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.UPDATE_ITEM_CATEGORY])
  @ApiOperation({ summary: 'Archive or reactivate one item category' })
  @ApiBody({ type: ChangeStatusDto })
  async changeItemCategoryStatus(
    @Param('tenantId') tenantId: string,
    @Param('categoryId') categoryId: string,
    @Body() body: ChangeStatusDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.changeItemCategoryStatus(tenantId, categoryId, body, source)
  }

  @Get('boms')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.LIST_BOM])
  @ApiOperation({ summary: 'List tenant BOMs' })
  async listBoms(
    @Param('tenantId') tenantId: string,
    @Query() query: ListBomsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.listBoms(tenantId, query, source)
  }

  @Get('boms/:bomId')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.LIST_BOM])
  @ApiOperation({ summary: 'Get one BOM' })
  async getBom(
    @Param('tenantId') tenantId: string,
    @Param('bomId') bomId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.getBom(tenantId, bomId, source)
  }

  @Get('items/:outputItemId/bom')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.LIST_BOM])
  @ApiOperation({ summary: 'Resolve BOM by output item and optional type' })
  async getBomByOutputItem(
    @Param('tenantId') tenantId: string,
    @Param('outputItemId') outputItemId: string,
    @Query() query: Pick<ListBomsDto, 'bomType'>,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.getBomByOutputItem(tenantId, outputItemId, query, source)
  }

  @Post('boms')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.CREATE_BOM])
  @ApiOperation({ summary: 'Create one BOM' })
  @ApiBody({ type: CreateBomDto })
  async createBom(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateBomDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.createBom(tenantId, body, source)
  }

  @Patch('boms/:bomId/basics')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.MANAGE_BOM])
  @ApiOperation({ summary: 'Update one BOM code and name' })
  @ApiBody({ type: UpdateBomBasicsDto })
  async updateBomBasics(
    @Param('tenantId') tenantId: string,
    @Param('bomId') bomId: string,
    @Body() body: UpdateBomBasicsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.updateBomBasics(tenantId, bomId, body, source)
  }

  @Put('boms/:bomId/lines')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.MANAGE_BOM])
  @ApiOperation({ summary: 'Full-replace one BOM line set' })
  @ApiBody({ type: ReplaceBomLinesDto })
  async replaceBomLines(
    @Param('tenantId') tenantId: string,
    @Param('bomId') bomId: string,
    @Body() body: ReplaceBomLinesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.replaceBomLines(tenantId, bomId, body, source)
  }

  @Patch('boms/:bomId/status')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.MANAGE_BOM])
  @ApiOperation({ summary: 'Archive or reactivate one BOM' })
  @ApiBody({ type: ChangeStatusDto })
  async changeBomStatus(
    @Param('tenantId') tenantId: string,
    @Param('bomId') bomId: string,
    @Body() body: ChangeStatusDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.changeBomStatus(tenantId, bomId, body, source)
  }

  @Get('items/:itemId/supplier-mappings')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.LIST_SUPPLIER_ITEM_MAPPINGS])
  @ApiOperation({ summary: 'List one item supplier mapping directory' })
  async listSupplierMappings(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @Query() query: ListSupplierMappingsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.listSupplierMappings(tenantId, itemId, query, source)
  }

  @Post('items/:itemId/supplier-mappings')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.UPSERT_SUPPLIER_ITEM_MAPPING])
  @ApiOperation({ summary: 'Upsert one supplier-to-item mapping' })
  @ApiBody({ type: UpsertSupplierItemMappingDto })
  async upsertSupplierMapping(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpsertSupplierItemMappingDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.upsertSupplierMapping(tenantId, itemId, body, source)
  }
}
