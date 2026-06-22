import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  PERMISSION_MANAGEMENT_PERMISSION_CODES,
  RequirePermissions
} from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { PermissionProxyService } from '../../../permission-service.service'
import {
  CreatePolicyInstanceDto,
  ListPolicyInstancesDto,
  SetPolicyInstanceEnabledDto
} from '../dtos/policy-instance-management.dto'

/** PolicyInstanceController exposes template-based PolicyInstance governance through the API Gateway. */
@ApiBearerAuth('JWT')
@ApiTags('policy-instance')
@Controller('policy-instance')
export class PolicyInstanceController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Get()
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_POLICY] })
  @ApiOperation({ summary: 'List readonly PolicyInstance records' })
  async listPolicyInstances(
    @Query() query: ListPolicyInstancesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.permissionService.listPolicyInstances(
      {
        enabled: query.enabled,
        hasEnabledFilter: query.enabled !== undefined,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        permissionCode: query.permissionCode,
        resourceType: query.resourceType,
        subjectSelectorType: query.subjectSelectorType,
        subjectSelectorValue: query.subjectSelectorValue,
        templateCode: query.templateCode,
        tenantId: query.tenantId
      },
      source
    )
  }

  @Get(':id')
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_POLICY] })
  @ApiOperation({ summary: 'Get one readonly PolicyInstance record by id' })
  async getPolicyInstanceById(
    @Param('id') id: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.permissionService.getPolicyInstanceById({ id }, source)
  }

  @Post()
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.CREATE_POLICY] })
  @ApiOperation({ summary: 'Create one template-based PolicyInstance record' })
  async createPolicyInstance(
    @Body() body: CreatePolicyInstanceDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.permissionService.createPolicyInstance(
      {
        ...body,
        params: { ...body.params }
      },
      source
    )
  }

  @Post(':id/enabled')
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.UPDATE_POLICY] })
  @ApiOperation({ summary: 'Enable or disable one template-based PolicyInstance record' })
  async setPolicyInstanceEnabled(
    @Param('id') id: string,
    @Body() body: SetPolicyInstanceEnabledDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.permissionService.setPolicyInstanceEnabled(
      {
        id,
        enabled: body.enabled
      },
      source
    )
  }
}
