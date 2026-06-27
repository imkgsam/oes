import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CRM_MANAGEMENT_PERMISSION_CODES, RequirePermissions } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { ExtensionCrmWorkspaceService } from '../../../extension-crm-workspace.service'
import {
  ExtensionLeadInputDto,
  ResolveExtensionPageContextDto,
  ResolveExtensionSearchResultsDto
} from '../dtos/extension-crm-workspace.dto'

@ApiBearerAuth('JWT')
@ApiTags('extension-crm-workspace')
@Controller('extension/crm')
// Exposes the browser-extension CRM Sales Workspace facade without moving CRM truth into the extension.
export class ExtensionCrmWorkspaceController {
  constructor(private readonly extensionCrmWorkspaceService: ExtensionCrmWorkspaceService) {}

  @Post('page-context/resolve')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Resolve one browser page into extension-safe CRM status' })
  @ApiBody({ type: ResolveExtensionPageContextDto })
  async resolvePageContext(
    @Body() body: ResolveExtensionPageContextDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.extensionCrmWorkspaceService.resolvePageContext(body, source)
  }

  @Post('search-results/resolve')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Resolve search result candidates into read-only CRM statuses' })
  @ApiBody({ type: ResolveExtensionSearchResultsDto })
  async resolveSearchResults(
    @Body() body: ResolveExtensionSearchResultsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.extensionCrmWorkspaceService.resolveSearchResults(body, source)
  }

  @Post('leads/check-duplicate')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Check CRM duplicate candidates from extension lead evidence' })
  @ApiBody({ type: ExtensionLeadInputDto })
  async checkDuplicate(
    @Body() body: ExtensionLeadInputDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.extensionCrmWorkspaceService.checkDuplicate(body, source)
  }

  @Post('draft-leads')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Create one extension-sourced CRM draft lead' })
  @ApiBody({ type: ExtensionLeadInputDto })
  async createDraftLead(
    @Body() body: ExtensionLeadInputDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.extensionCrmWorkspaceService.createDraftLead(body, source)
  }

  @Post('leads')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Create one extension-sourced active lead' })
  @ApiBody({ type: ExtensionLeadInputDto })
  async createActiveLead(
    @Body() body: ExtensionLeadInputDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.extensionCrmWorkspaceService.createActiveLead(body, source)
  }

  @Post('accounts/:crmAccountId/claim')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CLAIM_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Claim one ownerless Pool Lead from the extension workspace' })
  async claimPoolLead(
    @Param('crmAccountId') crmAccountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.extensionCrmWorkspaceService.claimPoolLead(crmAccountId, source)
  }

  @Get('accounts/:crmAccountId')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Get one extension-safe CRM account summary' })
  async getAccountSummary(
    @Param('crmAccountId') crmAccountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.extensionCrmWorkspaceService.getAccountSummary(crmAccountId, source)
  }
}
