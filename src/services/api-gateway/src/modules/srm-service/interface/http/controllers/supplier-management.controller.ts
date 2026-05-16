import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RequirePermissions, SRM_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { SupplierManagementService } from '../../../supplier-management.service'
import {
  BindSupplierToTenantPartyDto,
  ChangeSupplierStatusDto,
  CreateSupplierProfileDto,
  ListSupplierOfferingsDto,
  SearchSuppliersDto,
  UpdateSupplierProfileBasicsDto,
  UpsertSupplierAddressDto,
  UpsertSupplierContactDto,
  UpsertSupplierOfferingDto
} from '../dtos/supplier-management.dto'

@ApiBearerAuth('JWT')
@ApiTags('supplier-management')
@Controller('supplier-management/tenants/:tenantId')
// Exposes the tenant-scoped SRM supplier-management BFF surface without widening the underlying gRPC contract.
export class SupplierManagementController {
  constructor(private readonly supplierManagementService: SupplierManagementService) {}

  @Get('suppliers')
  @RequirePermissions({ all: [SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_PROFILE] })
  @ApiOperation({ summary: 'Search SRM supplier profiles for the tenant master-data entry' })
  async searchSuppliers(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchSuppliersDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.supplierManagementService.searchSuppliers(
      tenantId,
      {
        keyword: query.keyword,
        status: query.status,
        tenantPartyId: query.tenantPartyId,
        page: query.page || 1,
        pageSize: query.pageSize || 20
      },
      source
    )
  }

  @Get('suppliers/:supplierId')
  @RequirePermissions({ all: [SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL] })
  @ApiOperation({
    summary: 'Get one SRM supplier detail aggregate with contacts, addresses, and offerings'
  })
  async getSupplier(
    @Param('tenantId') tenantId: string,
    @Param('supplierId') supplierId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.supplierManagementService.getSupplierDetail(tenantId, supplierId, source)
  }

  @Post('suppliers')
  @RequirePermissions({ all: [SRM_MANAGEMENT_PERMISSION_CODES.CREATE_SUPPLIER_PROFILE] })
  @ApiOperation({ summary: 'Create one SRM supplier profile shell' })
  @ApiBody({ type: CreateSupplierProfileDto })
  async createSupplierProfile(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateSupplierProfileDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.supplierManagementService.createSupplierProfile(tenantId, body, source)
  }

  @Patch('suppliers/:supplierId/basics')
  @RequirePermissions({ all: [SRM_MANAGEMENT_PERMISSION_CODES.UPDATE_SUPPLIER_PROFILE_BASICS] })
  @ApiOperation({ summary: 'Update one SRM supplier profile basics only' })
  @ApiBody({ type: UpdateSupplierProfileBasicsDto })
  async updateSupplierProfileBasics(
    @Param('tenantId') tenantId: string,
    @Param('supplierId') supplierId: string,
    @Body() body: UpdateSupplierProfileBasicsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.supplierManagementService.updateSupplierProfileBasics(
      tenantId,
      supplierId,
      body,
      source
    )
  }

  @Post('suppliers/:supplierId/tenant-party-binding')
  @RequirePermissions({ all: [SRM_MANAGEMENT_PERMISSION_CODES.BIND_SUPPLIER_TO_TENANT_PARTY] })
  @ApiOperation({ summary: 'Bind one SRM supplier profile to its phase 1 active tenantPartyId' })
  @ApiBody({ type: BindSupplierToTenantPartyDto })
  async bindSupplierToTenantParty(
    @Param('tenantId') tenantId: string,
    @Param('supplierId') supplierId: string,
    @Body() body: BindSupplierToTenantPartyDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.supplierManagementService.bindSupplierToTenantParty(
      tenantId,
      supplierId,
      body,
      source
    )
  }

  @Post('suppliers/:supplierId/contacts')
  @RequirePermissions({ all: [SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_CONTACT] })
  @ApiOperation({ summary: 'Create or update one SRM supplier contact' })
  @ApiBody({ type: UpsertSupplierContactDto })
  async upsertSupplierContact(
    @Param('tenantId') tenantId: string,
    @Param('supplierId') supplierId: string,
    @Body() body: UpsertSupplierContactDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.supplierManagementService.upsertSupplierContact(tenantId, supplierId, body, source)
  }

  @Post('suppliers/:supplierId/addresses')
  @RequirePermissions({ all: [SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_ADDRESS] })
  @ApiOperation({ summary: 'Create or update one SRM supplier address' })
  @ApiBody({ type: UpsertSupplierAddressDto })
  async upsertSupplierAddress(
    @Param('tenantId') tenantId: string,
    @Param('supplierId') supplierId: string,
    @Body() body: UpsertSupplierAddressDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.supplierManagementService.upsertSupplierAddress(tenantId, supplierId, body, source)
  }

  @Patch('suppliers/:supplierId/status')
  @RequirePermissions({ all: [SRM_MANAGEMENT_PERMISSION_CODES.CHANGE_SUPPLIER_STATUS] })
  @ApiOperation({ summary: 'Change one SRM supplier profile lifecycle status' })
  @ApiBody({ type: ChangeSupplierStatusDto })
  async changeSupplierStatus(
    @Param('tenantId') tenantId: string,
    @Param('supplierId') supplierId: string,
    @Body() body: ChangeSupplierStatusDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.supplierManagementService.changeSupplierStatus(tenantId, supplierId, body, source)
  }

  @Get('suppliers/:supplierId/offerings')
  @RequirePermissions({
    all: [SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_SUPPLIER]
  })
  @ApiOperation({ summary: 'List one supplier offering directory keyed by supplierId' })
  async listSupplierOfferingsBySupplier(
    @Param('tenantId') tenantId: string,
    @Param('supplierId') supplierId: string,
    @Query() query: ListSupplierOfferingsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.supplierManagementService.listSupplierOfferingsBySupplier(
      tenantId,
      supplierId,
      {
        status: query.status,
        page: query.page || 1,
        pageSize: query.pageSize || 20
      },
      source
    )
  }

  @Get('items/:itemId/offerings')
  @RequirePermissions({ all: [SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_ITEM] })
  @ApiOperation({ summary: 'List one supplier offering directory keyed by itemId' })
  async listSupplierOfferingsByItem(
    @Param('tenantId') tenantId: string,
    @Param('itemId') itemId: string,
    @Query() query: ListSupplierOfferingsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.supplierManagementService.listSupplierOfferingsByItem(
      tenantId,
      itemId,
      {
        status: query.status,
        page: query.page || 1,
        pageSize: query.pageSize || 20
      },
      source
    )
  }

  @Post('suppliers/:supplierId/offerings')
  @RequirePermissions({ all: [SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_OFFERING] })
  @ApiOperation({ summary: 'Create or update one SRM supplier offering fact' })
  @ApiBody({ type: UpsertSupplierOfferingDto })
  async upsertSupplierOffering(
    @Param('tenantId') tenantId: string,
    @Param('supplierId') supplierId: string,
    @Body() body: UpsertSupplierOfferingDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.supplierManagementService.upsertSupplierOffering(tenantId, supplierId, body, source)
  }
}
