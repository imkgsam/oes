import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import {
  RequirePermissions,
  PERMISSION_MANAGEMENT_PERMISSION_CODES,
  ROLE_INSTANCE_PERMISSION_CODES
} from '@oes/common/authorization'
import { PermissionProxyService } from '../../../permission-service.service'
import { RoleManagementReadService } from '../../../role-management-read.service'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { ListRolesDto } from '../dtos/list-roles.dto'
import { ListRoleTenantOptionsDto } from '../dtos/list-role-tenant-options.dto'
import { CreateRoleDto } from '../dtos/create-role.dto'
import { UpdateRoleDto } from '../dtos/update-role.dto'
import { SetRoleEnabledDto } from '../dtos/set-role-enabled.dto'
import { AssignRolePermissionDto } from '../dtos/role-permission.dto'
import { TerminalAccessMutationDto } from '../dtos/terminal-access.dto'

@ApiBearerAuth('JWT')
@ApiTags('role')
@Controller('role')
// Exposes role instance management endpoints through the gateway permission proxy.
export class RoleController {
  constructor(
    private readonly permissionService: PermissionProxyService,
    private readonly roleManagementReadService: RoleManagementReadService
  ) {}

  @Get()
  @RequirePermissions({ all: [ROLE_INSTANCE_PERMISSION_CODES.LIST] })
  @ApiOperation({ summary: 'List role instances with pagination and filters' })
  async listRoles(
    @Query() query: ListRolesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.roleManagementReadService.listRoles(
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

  @Get('tenant-options')
  @RequirePermissions({ all: [ROLE_INSTANCE_PERMISSION_CODES.CREATE] })
  @ApiOperation({ summary: 'List tenant options for role creation selectors' })
  async listTenantOptions(
    @Query() query: ListRoleTenantOptionsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.roleManagementReadService.listTenantOptions(
        {
          keyword: query.keyword,
          pageSize: query.pageSize || 20
        },
        source
      )
    )
  }

  @Post()
  @RequirePermissions({ all: [ROLE_INSTANCE_PERMISSION_CODES.CREATE] })
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
  @RequirePermissions({ all: [ROLE_INSTANCE_PERMISSION_CODES.GET_BY_ID] })
  @ApiOperation({ summary: 'Find role by ID' })
  async findById(@Param('id') id: string, @DownstreamSource() source: DownstreamRequestSource) {
    return this.execute(() => this.roleManagementReadService.getRoleById({ id }, source))
  }

  @Get(':id/terminal-access')
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_TERMINAL_ACCESS] })
  @ApiOperation({ summary: 'Get role terminal access defaults' })
  async getRoleTerminalAccess(
    @Param('id') id: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.getRoleTerminalAccess({ roleId: id }, source))
  }

  @Put(':id/terminal-access')
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.MANAGE_ROLE_TERMINAL_ACCESS] })
  @ApiOperation({ summary: 'Replace role terminal access defaults' })
  @ApiBody({ type: TerminalAccessMutationDto })
  async setRoleTerminalAccess(
    @Param('id') id: string,
    @Body() body: TerminalAccessMutationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.setRoleTerminalAccess(
        {
          roleId: id,
          allowedTerminals: body.allowedTerminals
        },
        source
      )
    )
  }

  @Patch(':id')
  @RequirePermissions({ all: [ROLE_INSTANCE_PERMISSION_CODES.UPDATE] })
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
  @RequirePermissions({ all: [ROLE_INSTANCE_PERMISSION_CODES.UPDATE] })
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
  @RequirePermissions({ all: [ROLE_INSTANCE_PERMISSION_CODES.GET_BY_ID] })
  @ApiOperation({ summary: 'List permissions assigned to a role instance' })
  async listRolePermissions(
    @Param('id') id: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.listRolePermissions({ roleId: id }, source))
  }

  @Post(':id/permissions')
  @RequirePermissions({ all: [ROLE_INSTANCE_PERMISSION_CODES.ASSIGN_PERMISSIONS] })
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
  @RequirePermissions({ all: [ROLE_INSTANCE_PERMISSION_CODES.ASSIGN_PERMISSIONS] })
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
  @RequirePermissions({ all: [ROLE_INSTANCE_PERMISSION_CODES.DELETE] })
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
