import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RequirePermissions, CRM_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { CustomerManagementService } from '../../../customer-management.service'
import {
  CreateLeadDto,
  ListCrmAccountsDto
} from '../dtos/customer-management.dto'

@ApiBearerAuth('JWT')
@ApiTags('customer-management')
@Controller('customer-management/tenants/:tenantId')
// Exposes the tenant-scoped CRM customer-management BFF surface without widening the underlying gRPC contract.
export class CustomerManagementController {
  constructor(private readonly customerManagementService: CustomerManagementService) {}

  @Get('crm-accounts')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'List CRM P1 accounts for the sales workspace' })
  async listCrmAccounts(
    @Param('tenantId') tenantId: string,
    @Query() query: ListCrmAccountsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.listCrmAccounts(
      tenantId,
      {
        keyword: query.keyword,
        lifecycleStage: query.lifecycleStage,
        recordStatus: query.recordStatus,
        ownerAccountId: query.ownerAccountId,
        page: query.page || 1,
        pageSize: query.pageSize || 20
      },
      source
    )
  }

  @Get('crm-accounts/:crmAccountId')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Get one CRM P1 account for the sales workspace detail panel' })
  async getCrmAccountP1(
    @Param('tenantId') tenantId: string,
    @Param('crmAccountId') crmAccountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.getCrmAccount(tenantId, crmAccountId, source)
  }

  @Post('leads')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Create one CRM P1 active lead with a primary source record' })
  @ApiBody({ type: CreateLeadDto })
  async createLead(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateLeadDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.createLead(tenantId, body, source)
  }

  @Post('leads/:crmAccountId/convert-to-prospect-customer')
  @RequirePermissions({
    all: [CRM_MANAGEMENT_PERMISSION_CODES.CONVERT_CRM_ACCOUNT]
  })
  @ApiOperation({ summary: 'Convert one CRM P1 lead to prospect customer through Party resolution' })
  async convertLeadToProspectCustomer(
    @Param('tenantId') tenantId: string,
    @Param('crmAccountId') crmAccountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.convertLeadToProspectCustomer(
      tenantId,
      crmAccountId,
      source
    )
  }
}
