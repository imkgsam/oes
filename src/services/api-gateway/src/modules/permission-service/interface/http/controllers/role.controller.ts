import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { PermissionCheckAll } from '@oes/common/authorization'
import {
  PERMISSION_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import { PermissionProxyService } from '../../../permission-service.service'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { ListRolesDto } from '../dtos/list-roles.dto'
import { CreateRoleDto } from '../dtos/create-role.dto'
import { UpdateRoleDto } from '../dtos/update-role.dto'
import { SetRoleEnabledDto } from '../dtos/set-role-enabled.dto'
import { AssignRolePermissionDto } from '../dtos/role-permission.dto'

@ApiBearerAuth('JWT')
@ApiTags('role')
@Controller('role')
// Exposes role instance management endpoints through the gateway permission proxy.
export class RoleController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Get()
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_ROLE])
  @ApiOperation({ summary: 'List role instances with pagination and filters' })
  async listRoles(
    @Query() query: ListRolesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.listRoles(
        {
          page: query.page || 1,
          pageSize: query.pageSize || 20,
          tenantId: query.tenantId,
          scopeLevel: query.scopeLevel,
          keyword: query.keyword
        },
        source
      )
    )
  }

  @Post()
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.CREATE_ROLE])
  @ApiOperation({ summary: 'Create a role instance' })
  @ApiBody({ type: CreateRoleDto })
  async createRole(
    @Body() body: CreateRoleDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.createRole(
        {
          name: body.name,
          code: body.code,
          tenantId: body.tenantId,
          scopeLevel: body.scopeLevel,
          description: body.description,
          templateRoleId: body.templateRoleId
        },
        source
      )
    )
  }

  @Get(':id')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_ROLE_DETAIL])
  @ApiOperation({ summary: 'Find role by ID' })
  async findById(@Param('id') id: string, @DownstreamSource() source: DownstreamRequestSource) {
    return this.execute(() => this.permissionService.getRoleById({ id }, source))
  }

  @Patch(':id')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.UPDATE_ROLE])
  @ApiOperation({ summary: 'Update a role instance' })
  @ApiBody({ type: UpdateRoleDto })
  async updateRole(
    @Param('id') id: string,
    @Body() body: UpdateRoleDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.updateRole(
        {
          id,
          name: body.name,
          description: body.description
        },
        source
      )
    )
  }

  @Patch(':id/enabled')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.UPDATE_ROLE])
  @ApiOperation({ summary: 'Enable or disable a role instance' })
  @ApiBody({ type: SetRoleEnabledDto })
  async setRoleEnabled(
    @Param('id') id: string,
    @Body() body: SetRoleEnabledDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.setRoleEnabled(
        {
          id,
          isEnabled: body.isEnabled
        },
        source
      )
    )
  }

  @Get(':id/permissions')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_ROLE_DETAIL])
  @ApiOperation({ summary: 'List permissions assigned to a role instance' })
  async listRolePermissions(
    @Param('id') id: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.listRolePermissions({ roleId: id }, source))
  }

  @Post(':id/permissions')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.ASSIGN_ROLE_PERMISSION])
  @ApiOperation({ summary: 'Assign a permission to a role instance' })
  @ApiBody({ type: AssignRolePermissionDto })
  async assignRolePermission(
    @Param('id') id: string,
    @Body() body: AssignRolePermissionDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.assignRolePermission(
        {
          roleId: id,
          permissionId: body.permissionId
        },
        source
      )
    )
  }

  @Delete(':id/permissions/:permissionId')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.REVOKE_ROLE_PERMISSION])
  @ApiOperation({ summary: 'Revoke a permission from a role instance' })
  async revokeRolePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.revokeRolePermission(
        {
          roleId: id,
          permissionId
        },
        source
      )
    )
  }

  @Delete(':id')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.DELETE_ROLE])
  @ApiOperation({ summary: 'Delete a role' })
  async deleteRole(@Param('id') id: string, @DownstreamSource() source: DownstreamRequestSource) {
    return this.execute(() => this.permissionService.deleteRole({ id }, source))
  }

  private async execute<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work()
    } catch (error) {
      throw error
    }
  }
}
