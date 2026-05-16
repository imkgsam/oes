import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  RequirePermissions,
  TENANT_ORG_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { TenantManagementService } from '../../../tenant-management.service'
import { CreateTenantDto } from '../dtos/create-tenant.dto'
import { CreateTenantOnboardingDto } from '../dtos/create-tenant-onboarding.dto'
import { ListTenantsDto } from '../dtos/list-tenants.dto'
import { RetryTenantOnboardingDto } from '../dtos/retry-tenant-onboarding.dto'
import { UpdateTenantProfileDto } from '../dtos/update-tenant-profile.dto'
import { UpdateTenantStatusDto } from '../dtos/update-tenant-status.dto'

@ApiBearerAuth('JWT')
@ApiTags('tenant-management')
@Controller('tenant-management/tenants')
// Exposes the system-admin tenant creation and maintenance entry through the gateway.
export class TenantManagementController {
  constructor(private readonly tenantManagementService: TenantManagementService) {}

  @Get()
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.LIST_TENANT] })
  @ApiOperation({ summary: 'List tenants for the system-admin tenant management entry' })
  async listTenants(
    @Query() query: ListTenantsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.tenantManagementService.listTenants(
      {
        keyword: query.keyword,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        status: query.status
      },
      source
    )
  }

  @Get('first-admin-candidates')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_TENANT] })
  @ApiOperation({ summary: 'Find an existing user candidate for tenant first-admin binding' })
  async searchFirstAdminExistingUsers(
    @Query('keyword') keyword: string,
    @Query('countryOrRegion') countryOrRegion: string | undefined,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.tenantManagementService.searchFirstAdminExistingUsers(
      { countryOrRegion, keyword },
      source
    )
  }

  @Get(':tenantId')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.VIEW_TENANT_DETAIL] })
  @ApiOperation({ summary: 'Get one tenant detail for the system-admin tenant management entry' })
  async getTenantById(
    @Param('tenantId') tenantId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.tenantManagementService.getTenantById(tenantId, source)
  }

  @Post()
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_TENANT] })
  @ApiOperation({ summary: 'Create one tenant and its root org' })
  @ApiBody({ type: CreateTenantDto })
  async createTenant(
    @Body() body: CreateTenantDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.tenantManagementService.createTenant(body, source)
  }

  @Post('onboardings')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_TENANT] })
  @ApiOperation({
    summary: 'Start tenant onboarding with party, first admin, login, and role grant'
  })
  @ApiBody({ type: CreateTenantOnboardingDto })
  async startTenantOnboarding(
    @Body() body: CreateTenantOnboardingDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.tenantManagementService.startTenantOnboarding(body, source)
  }

  @Get('onboardings/:onboardingId')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.VIEW_TENANT_DETAIL] })
  @ApiOperation({ summary: 'Get tenant onboarding run status' })
  async getTenantOnboarding(
    @Param('onboardingId') onboardingId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.tenantManagementService.getTenantOnboarding(onboardingId, source)
  }

  @Post('onboardings/:onboardingId/retry')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_TENANT] })
  @ApiOperation({ summary: 'Retry a failed tenant onboarding run' })
  @ApiBody({ type: RetryTenantOnboardingDto })
  async retryTenantOnboarding(
    @Param('onboardingId') onboardingId: string,
    @Body() body: RetryTenantOnboardingDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.tenantManagementService.retryTenantOnboarding(onboardingId, body, source)
  }

  @Patch(':tenantId/profile')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_TENANT_PROFILE] })
  @ApiOperation({ summary: 'Update tenant profile metadata' })
  @ApiBody({ type: UpdateTenantProfileDto })
  async updateTenantProfile(
    @Param('tenantId') tenantId: string,
    @Body() body: UpdateTenantProfileDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.tenantManagementService.updateTenantProfile(tenantId, body, source)
  }

  @Patch(':tenantId/status')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_TENANT_STATUS] })
  @ApiOperation({ summary: 'Change tenant lifecycle status' })
  @ApiBody({ type: UpdateTenantStatusDto })
  async updateTenantStatus(
    @Param('tenantId') tenantId: string,
    @Body() body: UpdateTenantStatusDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.tenantManagementService.updateTenantStatus(tenantId, body, source)
  }
}
