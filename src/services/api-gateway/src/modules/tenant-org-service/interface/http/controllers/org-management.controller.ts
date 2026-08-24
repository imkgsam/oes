import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  RequirePermissions,
  TENANT_ORG_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { VerifiedTenantTarget } from '../../../../../common/tenant-target'
import { OrgManagementService } from '../../../org-management.service'
import { CreateOrgUnitDto } from '../dtos/create-org-unit.dto'
import { MoveOrgUnitDto } from '../dtos/move-org-unit.dto'
import { UpdateOrgUnitDto } from '../dtos/update-org-unit.dto'

@ApiBearerAuth('JWT')
@ApiTags('org-management')
@Controller('tenant-management/tenants/:tenantId')
// Exposes org tree and org node management endpoints through the gateway tenant-org proxy.
export class OrgManagementController {
  constructor(private readonly orgManagementService: OrgManagementService) {}

  @Get('org-tree')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.LIST_ORG_TREE] })
  @ApiOperation({
    summary: 'Get one tenant org tree for system-admin or tenant-admin org management'
  })
  async getOrgTree(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.orgManagementService.getOrgTree(tenantId, source)
  }

  @Get('org-units/:orgUnitId')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.VIEW_ORG_UNIT_DETAIL] })
  @ApiOperation({ summary: 'Get one org unit detail inside the selected tenant org tree' })
  async getOrgUnitDetail(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('orgUnitId') orgUnitId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.orgManagementService.getOrgUnitDetail(tenantId, orgUnitId, source)
  }

  @Post('org-units')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_ORG_UNIT] })
  @ApiOperation({ summary: 'Create one org unit under the selected parent node' })
  @ApiBody({ type: CreateOrgUnitDto })
  async createOrgUnit(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Body() body: CreateOrgUnitDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.orgManagementService.createOrgUnit(tenantId, body, source)
  }

  @Patch('org-units/:orgUnitId')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_ORG_UNIT] })
  @ApiOperation({ summary: 'Update one org unit display metadata' })
  @ApiBody({ type: UpdateOrgUnitDto })
  async updateOrgUnit(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('orgUnitId') orgUnitId: string,
    @Body() body: UpdateOrgUnitDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.orgManagementService.updateOrgUnit(tenantId, orgUnitId, body, source)
  }

  @Post('org-units/:orgUnitId/move')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_ORG_UNIT] })
  @ApiOperation({ summary: 'Move one org unit below another parent node' })
  @ApiBody({ type: MoveOrgUnitDto })
  async moveOrgUnit(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('orgUnitId') orgUnitId: string,
    @Body() body: MoveOrgUnitDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.orgManagementService.moveOrgUnit(tenantId, orgUnitId, body, source)
  }

  @Post('org-units/:orgUnitId/archive')
  @RequirePermissions({ all: [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.ARCHIVE_ORG_UNIT] })
  @ApiOperation({ summary: 'Archive one org unit from the current tenant org tree' })
  async archiveOrgUnit(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('orgUnitId') orgUnitId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.orgManagementService.archiveOrgUnit(tenantId, orgUnitId, source)
  }
}
