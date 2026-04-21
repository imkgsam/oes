import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PermissionCheckAll, PERMISSION_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { PermissionProxyService } from '../../../permission-service.service'
import { ListPermissionPoliciesDto, ListPoliciesDto } from '../dtos/policy-management.dto'

// Exposes readonly policy governance endpoints through the gateway permission proxy.
@ApiBearerAuth('JWT')
@ApiTags('policy-governance')
@Controller()
export class PolicyController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Get('policy')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_POLICY])
  @ApiOperation({ summary: 'List readonly policy governance records' })
  async listPolicies(
    @Query() query: ListPoliciesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.listPolicies(
        {
          hasIsEnabledFilter: query.isEnabled !== undefined,
          isEnabled: query.isEnabled,
          keyword: query.keyword,
          page: query.page || 1,
          pageSize: query.pageSize || 20,
          permissionCode: query.permissionCode,
          tenantId: query.tenantId
        },
        source
      )
    )
  }

  @Get('policy/:id')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_POLICY])
  @ApiOperation({ summary: 'Get one readonly policy governance record by id' })
  async getPolicyById(
    @Param('id') id: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.getPolicyById({ id }, source))
  }

  @Get('permission/:permissionCode/policies')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_POLICY])
  @ApiOperation({ summary: 'List readonly policy records attached to one permission code' })
  async listPoliciesByPermission(
    @Param('permissionCode') permissionCode: string,
    @Query() query: ListPermissionPoliciesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.listPermissionPolicies(
        {
          permissionCode,
          tenantId: query.tenantId
        },
        source
      )
    )
  }

  private async execute<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work()
    } catch (error) {
      throw error
    }
  }
}
