import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RequirePermissions, CRM_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { CustomerManagementService } from '../../../customer-management.service'
import {
  BindCustomerAccountToTenantPartyDto,
  ChangeCustomerStatusDto,
  CreateCustomerAccountDto,
  SearchCustomerAccountsDto,
  SearchSelectableCustomersDto,
  UpdateCustomerAccountBasicsDto,
  UpsertCustomerAddressDto,
  UpsertCustomerContactDto
} from '../dtos/customer-management.dto'

@ApiBearerAuth('JWT')
@ApiTags('customer-management')
@Controller('customer-management/tenants/:tenantId')
// Exposes the tenant-scoped CRM customer-management BFF surface without widening the underlying gRPC contract.
export class CustomerManagementController {
  constructor(private readonly customerManagementService: CustomerManagementService) {}

  @Get('customers')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.LIST_CUSTOMER_ACCOUNT] })
  @ApiOperation({ summary: 'Search CRM customer accounts for the tenant master-data entry' })
  async searchCustomerAccounts(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchCustomerAccountsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.searchCustomerAccounts(
      tenantId,
      {
        keyword: query.keyword,
        status: query.status,
        primaryTenantPartyId: query.primaryTenantPartyId,
        page: query.page || 1,
        pageSize: query.pageSize || 20
      },
      source
    )
  }

  @Get('selectable-customers')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.SEARCH_SELECTABLE_CUSTOMERS] })
  @ApiOperation({ summary: 'Search selector-eligible CRM customers for downstream sales adoption' })
  async searchSelectableCustomers(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchSelectableCustomersDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.searchSelectableCustomers(
      tenantId,
      {
        keyword: query.keyword,
        page: query.page || 1,
        pageSize: query.pageSize || 20
      },
      source
    )
  }

  @Get('customers/:customerAccountId')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.VIEW_CUSTOMER_ACCOUNT_DETAIL] })
  @ApiOperation({
    summary: 'Get one CRM customer account detail aggregate with contacts and addresses'
  })
  async getCustomerAccount(
    @Param('tenantId') tenantId: string,
    @Param('customerAccountId') customerAccountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.getCustomerAccountDetail(
      tenantId,
      customerAccountId,
      source
    )
  }

  @Post('customers')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CUSTOMER_ACCOUNT] })
  @ApiOperation({ summary: 'Create one CRM customer account shell' })
  @ApiBody({ type: CreateCustomerAccountDto })
  async createCustomerAccount(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateCustomerAccountDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.createCustomerAccount(tenantId, body, source)
  }

  @Patch('customers/:customerAccountId/basics')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CUSTOMER_ACCOUNT_BASICS] })
  @ApiOperation({ summary: 'Update one CRM customer account basics only' })
  @ApiBody({ type: UpdateCustomerAccountBasicsDto })
  async updateCustomerAccountBasics(
    @Param('tenantId') tenantId: string,
    @Param('customerAccountId') customerAccountId: string,
    @Body() body: UpdateCustomerAccountBasicsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.updateCustomerAccountBasics(
      tenantId,
      customerAccountId,
      body,
      source
    )
  }

  @Post('customers/:customerAccountId/tenant-party-binding')
  @RequirePermissions({
    all: [CRM_MANAGEMENT_PERMISSION_CODES.BIND_CUSTOMER_ACCOUNT_TO_TENANT_PARTY]
  })
  @ApiOperation({
    summary: 'Bind one CRM customer account to its phase 1 active primary tenantPartyId'
  })
  @ApiBody({ type: BindCustomerAccountToTenantPartyDto })
  async bindCustomerAccountToTenantParty(
    @Param('tenantId') tenantId: string,
    @Param('customerAccountId') customerAccountId: string,
    @Body() body: BindCustomerAccountToTenantPartyDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.bindCustomerAccountToTenantParty(
      tenantId,
      customerAccountId,
      body,
      source
    )
  }

  @Post('customers/:customerAccountId/contacts')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.UPSERT_CUSTOMER_CONTACT] })
  @ApiOperation({ summary: 'Create or update one CRM customer contact' })
  @ApiBody({ type: UpsertCustomerContactDto })
  async upsertCustomerContact(
    @Param('tenantId') tenantId: string,
    @Param('customerAccountId') customerAccountId: string,
    @Body() body: UpsertCustomerContactDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.upsertCustomerContact(
      tenantId,
      customerAccountId,
      body,
      source
    )
  }

  @Post('customers/:customerAccountId/addresses')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.UPSERT_CUSTOMER_ADDRESS] })
  @ApiOperation({ summary: 'Create or update one CRM customer address' })
  @ApiBody({ type: UpsertCustomerAddressDto })
  async upsertCustomerAddress(
    @Param('tenantId') tenantId: string,
    @Param('customerAccountId') customerAccountId: string,
    @Body() body: UpsertCustomerAddressDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.upsertCustomerAddress(
      tenantId,
      customerAccountId,
      body,
      source
    )
  }

  @Patch('customers/:customerAccountId/status')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CHANGE_CUSTOMER_STATUS] })
  @ApiOperation({ summary: 'Change one CRM customer account lifecycle status' })
  @ApiBody({ type: ChangeCustomerStatusDto })
  async changeCustomerStatus(
    @Param('tenantId') tenantId: string,
    @Param('customerAccountId') customerAccountId: string,
    @Body() body: ChangeCustomerStatusDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.changeCustomerStatus(
      tenantId,
      customerAccountId,
      body,
      source
    )
  }
}
