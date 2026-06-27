import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES, RequirePermissions } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { BrowserActivityBffService } from '../../../browser-activity-bff.service'
import {
  BrowserActivityEmployeeAuditGrantQueryDto,
  BrowserActivityEmployeeAuditGrantUpdateDto,
  BrowserActivityEmployeeScopedQueryDto,
  BrowserActivityOnlinePresenceQueryDto,
  BrowserActivityPeriodQueryDto,
  BrowserActivityPolicyUpdateDto,
  BrowserActivityUrlSearchQueryDto
} from '../dtos/browser-activity.dto'

@ApiBearerAuth('JWT')
@ApiTags('browser-activity')
@Controller('browser-activity')
// BrowserActivityController exposes tenant-web audit workbench reads and tenant policy management.
export class BrowserActivityController {
  constructor(private readonly browserActivityBffService: BrowserActivityBffService) {}

  @Get('policy')
  @RequirePermissions({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.POLICY_READ] })
  @ApiOperation({ summary: 'Get tenant browser activity audit policy' })
  async getPolicy(@DownstreamSource() source: DownstreamRequestSource) {
    return this.browserActivityBffService.getPolicy(source)
  }

  @Put('policy')
  @RequirePermissions({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.POLICY_MANAGE] })
  @ApiOperation({ summary: 'Update tenant browser activity audit policy' })
  async updatePolicy(
    @Body() body: BrowserActivityPolicyUpdateDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.browserActivityBffService.updatePolicy(body, source)
  }

  @Put('employees/:employeeAccountId/audit-grant')
  @RequirePermissions({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.POLICY_MANAGE] })
  @ApiOperation({ summary: 'Update one employee browser activity audit grant' })
  async updateEmployeeAuditGrant(
    @Param('employeeAccountId') employeeAccountId: string,
    @Body() body: BrowserActivityEmployeeAuditGrantUpdateDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.browserActivityBffService.updateEmployeeAuditGrant(employeeAccountId, body, source)
  }

  @Get('employees/audit-grants')
  @RequirePermissions({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.OVERVIEW_READ] })
  @ApiOperation({ summary: 'Get employee browser activity audit grants' })
  async getEmployeeAuditGrants(
    @Query() query: BrowserActivityEmployeeAuditGrantQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.browserActivityBffService.getEmployeeAuditGrants(query, source)
  }

  @Get('overview')
  @RequirePermissions({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.OVERVIEW_READ] })
  @ApiOperation({ summary: 'Get tenant browser activity audit overview' })
  async getOverview(
    @Query() query: BrowserActivityPeriodQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.browserActivityBffService.getOverview(query, source)
  }

  @Get('online-presence')
  @RequirePermissions({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.OVERVIEW_READ] })
  @ApiOperation({ summary: 'Get tenant browser extension online presence' })
  async getOnlinePresence(
    @Query() query: BrowserActivityOnlinePresenceQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.browserActivityBffService.getOnlinePresence(query, source)
  }

  @Get('employees/:employeeAccountId/timeline')
  @RequirePermissions({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.EMPLOYEE_DETAIL_READ] })
  @ApiOperation({ summary: 'Get one employee browser activity timeline' })
  async getEmployeeTimeline(
    @Param('employeeAccountId') employeeAccountId: string,
    @Query() query: BrowserActivityPeriodQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.browserActivityBffService.getEmployeeTimeline(employeeAccountId, query, source)
  }

  @Get('domains')
  @RequirePermissions({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.URL_DETAIL_READ] })
  @ApiOperation({ summary: 'Get browser activity domain aggregates' })
  async getDomainAggregation(
    @Query() query: BrowserActivityEmployeeScopedQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.browserActivityBffService.getDomainAggregation(query, source)
  }

  @Get('url-search')
  @RequirePermissions({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.URL_DETAIL_READ] })
  @ApiOperation({ summary: 'Search browser activity URL facts' })
  async searchUrls(
    @Query() query: BrowserActivityUrlSearchQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.browserActivityBffService.searchUrls(query, source)
  }
}
