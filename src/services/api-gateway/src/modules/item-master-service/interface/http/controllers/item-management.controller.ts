import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PermissionCheckAll } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { ItemManagementService } from '../../../item-management.service'
import {
  ChangeItemCategoryStatusDto,
  ChangeItemStatusDto,
  CreateItemCategoryDto,
  CreateItemDto,
  ListItemCategoriesDto,
  ListItemsDto,
  ListSupplierMappingsDto,
  SetItemPrimaryCategoryDto,
  SetItemCapabilitiesDto,
  SetItemCompositionDto,
  UpdateItemCategoryBasicsDto,
  UpdateItemBasicsDto,
  UpsertSupplierItemMappingDto
} from '../dtos/item-management.dto'

const ITEM_MANAGEMENT_PERMISSIONS = {
  CREATE_ITEM: 'item_master.item.create',
  LIST_ITEM: 'item_master.item.list',
  LIST_ITEM_CATEGORIES: 'item_master.item_category.list',
  LIST_SUPPLIER_ITEM_MAPPINGS: 'item_master.supplier_item_mapping.list_by_item',
  CREATE_ITEM_CATEGORY: 'item_master.item_category.create',
  SET_ITEM_CAPABILITIES: 'item_master.item.set_capabilities',
  SET_ITEM_COMPOSITION: 'item_master.item.set_composition',
  SET_ITEM_PRIMARY_CATEGORY: 'item_master.item.set_primary_category',
  UPDATE_ITEM_CATEGORY_BASICS: 'item_master.item_category.update_basics',
  UPDATE_ITEM_CATEGORY_STATUS: 'item_master.item_category.update_status',
  UPDATE_ITEM_BASICS: 'item_master.item.update_basics',
  UPDATE_ITEM_STATUS: 'item_master.item.update_status',
  UPSERT_SUPPLIER_ITEM_MAPPING: 'item_master.supplier_item_mapping.upsert',
  VIEW_ITEM_DETAIL: 'item_master.item.get_by_id'
} as const

@ApiBearerAuth('JWT')
@ApiTags('item-management')
@Controller('item-management/tenants/:tenantId')
// Exposes the tenant-scoped item master phase 1 BFF surface without widening the underlying gRPC contract.
export class ItemManagementController {
  constructor(private readonly itemManagementService: ItemManagementService) {}

  @Get('items')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.LIST_ITEM])
  @ApiOperation({ summary: 'List phase 1 items for the tenant item-management entry' })
  async listItems(
    @Param('tenantId') tenantId: string,
    @Query() query: ListItemsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.listItems(
      tenantId,
      {
        capability: query.capability,
        categoryId: query.categoryId,
        includeDescendants: query.includeDescendants,
        keyword: query.keyword,
        natureType: query.natureType,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        status: query.status,
        structureType: query.structureType
      },
      source
    )
  }

  @Get('categories')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.LIST_ITEM_CATEGORIES])
  @ApiOperation({ summary: 'List one tenant-scoped item category tree layer' })
  async listItemCategories(
    @Param('tenantId') tenantId: string,
    @Query() query: ListItemCategoriesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.listItemCategories(
      tenantId,
      {
        parentCategoryId: query.parentCategoryId
      },
      source
    )
  }

  @Get('items/:itemId')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.VIEW_ITEM_DETAIL])
  @ApiOperation({ summary: 'Get one phase 1 item detail snapshot' })
  async getItem(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.getItem(tenantId, itemId, source)
  }

  @Post('items')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.CREATE_ITEM])
  @ApiOperation({ summary: 'Create one phase 1 item' })
  @ApiBody({ type: CreateItemDto })
  async createItem(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateItemDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.createItem(tenantId, body, source)
  }

  @Post('categories')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.CREATE_ITEM_CATEGORY])
  @ApiOperation({ summary: 'Create one lightweight item category node' })
  @ApiBody({ type: CreateItemCategoryDto })
  async createItemCategory(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateItemCategoryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.createItemCategory(tenantId, body, source)
  }

  @Patch('items/:itemId/basics')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.UPDATE_ITEM_BASICS])
  @ApiOperation({ summary: 'Update one phase 1 item code and name only' })
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
  @ApiOperation({ summary: 'Full-replace one phase 1 item capability set' })
  @ApiBody({ type: SetItemCapabilitiesDto })
  async setItemCapabilities(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @Body() body: SetItemCapabilitiesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.setItemCapabilities(tenantId, itemId, body, source)
  }

  @Get('items/:itemId/composition')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.SET_ITEM_COMPOSITION])
  @ApiOperation({ summary: 'Get one phase 1 bundle composition snapshot' })
  async getItemComposition(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.getItemComposition(tenantId, itemId, source)
  }

  @Put('items/:itemId/composition')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.SET_ITEM_COMPOSITION])
  @ApiOperation({ summary: 'Full-replace one phase 1 bundle composition' })
  @ApiBody({ type: SetItemCompositionDto })
  async setItemComposition(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @Body() body: SetItemCompositionDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.setItemComposition(tenantId, itemId, body, source)
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
    return this.itemManagementService.listSupplierMappings(
      tenantId,
      itemId,
      {
        page: query.page || 1,
        pageSize: query.pageSize || 20
      },
      source
    )
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

  @Patch('items/:itemId/status')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.UPDATE_ITEM_STATUS])
  @ApiOperation({ summary: 'Change one phase 1 item lifecycle status' })
  @ApiBody({ type: ChangeItemStatusDto })
  async changeItemStatus(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @Body() body: ChangeItemStatusDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.changeItemStatus(tenantId, itemId, body, source)
  }

  @Patch('categories/:categoryId/basics')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.UPDATE_ITEM_CATEGORY_BASICS])
  @ApiOperation({ summary: 'Update one lightweight item category code and name' })
  @ApiBody({ type: UpdateItemCategoryBasicsDto })
  async updateItemCategoryBasics(
    @Param('tenantId') tenantId: string,
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateItemCategoryBasicsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.updateItemCategoryBasics(
      tenantId,
      categoryId,
      body,
      source
    )
  }

  @Patch('categories/:categoryId/status')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.UPDATE_ITEM_CATEGORY_STATUS])
  @ApiOperation({ summary: 'Change one lightweight item category lifecycle status' })
  @ApiBody({ type: ChangeItemCategoryStatusDto })
  async changeItemCategoryStatus(
    @Param('tenantId') tenantId: string,
    @Param('categoryId') categoryId: string,
    @Body() body: ChangeItemCategoryStatusDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.changeItemCategoryStatus(
      tenantId,
      categoryId,
      body,
      source
    )
  }

  @Put('items/:itemId/primary-category')
  @PermissionCheckAll([ITEM_MANAGEMENT_PERMISSIONS.SET_ITEM_PRIMARY_CATEGORY])
  @ApiOperation({ summary: 'Set or clear one item primary category' })
  @ApiBody({ type: SetItemPrimaryCategoryDto })
  async setItemPrimaryCategory(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @Body() body: SetItemPrimaryCategoryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.itemManagementService.setItemPrimaryCategory(tenantId, itemId, body, source)
  }
}
