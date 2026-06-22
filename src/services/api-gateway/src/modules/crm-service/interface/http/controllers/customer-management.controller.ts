import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RequirePermissions, CRM_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { CustomerManagementService } from '../../../customer-management.service'
import {
  CheckLeadDuplicateDto,
  CreateDraftLeadDto,
  CreateLeadDto,
  ListCrmAccountsDto,
  SubmitDraftLeadDto,
  UpdateDraftLeadDto
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
        lifecycleStages: query.lifecycleStages,
        recordStatus: query.recordStatus,
        ownerAccountId: query.ownerAccountId,
        createdBy: query.createdBy,
        ownerless: query.ownerless,
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

  @Post('draft-leads')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Create one CRM P1 draft lead' })
  @ApiBody({ type: CreateDraftLeadDto })
  async createDraftLead(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateDraftLeadDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.createDraftLead(tenantId, body, source)
  }

  @Patch('draft-leads/:crmAccountId')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Update one CRM P1 draft lead' })
  @ApiBody({ type: UpdateDraftLeadDto })
  async updateDraftLead(
    @Param('tenantId') tenantId: string,
    @Param('crmAccountId') crmAccountId: string,
    @Body() body: UpdateDraftLeadDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.updateDraftLead(tenantId, crmAccountId, body, source)
  }

  @Post('draft-leads/:crmAccountId/submit')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Submit one CRM P1 draft lead to active lead' })
  @ApiBody({ type: SubmitDraftLeadDto })
  async submitDraftLead(
    @Param('tenantId') tenantId: string,
    @Param('crmAccountId') crmAccountId: string,
    @Body() body: SubmitDraftLeadDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.submitDraftLead(tenantId, crmAccountId, body, source)
  }

  @Delete('draft-leads/:crmAccountId')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Hard-delete one CRM P1 draft lead' })
  async deleteDraftLead(
    @Param('tenantId') tenantId: string,
    @Param('crmAccountId') crmAccountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.deleteDraftLead(tenantId, crmAccountId, source)
  }

  @Post('crm-accounts/:crmAccountId/claim')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CLAIM_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Claim one ownerless CRM P1 Pool account' })
  async claimCrmAccount(
    @Param('tenantId') tenantId: string,
    @Param('crmAccountId') crmAccountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.claimCrmAccount(tenantId, crmAccountId, source)
  }

  @Post('crm-accounts/:crmAccountId/release')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.MANAGE_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Release one owned CRM P1 account back to the Pool' })
  async releaseCrmAccount(
    @Param('tenantId') tenantId: string,
    @Param('crmAccountId') crmAccountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.releaseCrmAccount(tenantId, crmAccountId, source)
  }

  @Post('leads/check-duplicate')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Check CRM P1 lead duplicate candidates' })
  @ApiBody({ type: CheckLeadDuplicateDto })
  async checkLeadDuplicate(
    @Param('tenantId') tenantId: string,
    @Body() body: CheckLeadDuplicateDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.customerManagementService.checkLeadDuplicate(tenantId, body, source)
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
