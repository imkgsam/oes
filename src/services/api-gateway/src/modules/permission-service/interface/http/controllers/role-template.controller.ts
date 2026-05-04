import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  PermissionCheckAll,
  ROLE_INSTANCE_PERMISSION_CODES,
  ROLE_TEMPLATE_PERMISSION_CODES
} from '@oes/common/authorization'
import { PermissionProxyService } from '../../../permission-service.service'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { CreateRoleTemplateDto } from '../dtos/create-role-template.dto'
import { UpdateRoleDto } from '../dtos/update-role.dto'
import { SetRoleEnabledDto } from '../dtos/set-role-enabled.dto'
import { AssignRolePermissionDto } from '../dtos/role-permission.dto'
import { ListRoleTemplatesDto } from '../dtos/list-role-templates.dto'
import { CreateRoleFromTemplateDto } from '../dtos/create-role-from-template.dto'

@ApiBearerAuth('JWT')
@ApiTags('role-template')
@Controller('role-template')
// Exposes role template management endpoints through the gateway permission proxy.
export class RoleTemplateController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Get()
  @PermissionCheckAll([ROLE_TEMPLATE_PERMISSION_CODES.LIST])
  @ApiOperation({ summary: 'List role templates with pagination and filters' })
  async listRoleTemplates(
    @Query() query: ListRoleTemplatesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.listRoleTemplates(
        {
          page: query.page || 1,
          pageSize: query.pageSize || 20,
          keyword: query.keyword
        },
        source
      )
    )
  }

  @Post()
  @PermissionCheckAll([ROLE_TEMPLATE_PERMISSION_CODES.CREATE])
  @ApiOperation({ summary: 'Create a role template' })
  @ApiBody({ type: CreateRoleTemplateDto })
  async createRoleTemplate(
    @Body() body: CreateRoleTemplateDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.createRoleTemplate(
        {
          name: body.name,
          code: body.code,
          description: body.description
        },
        source
      )
    )
  }

  @Get(':id')
  @PermissionCheckAll([ROLE_TEMPLATE_PERMISSION_CODES.GET_BY_ID])
  @ApiOperation({ summary: 'Find role template by ID' })
  async findById(@Param('id') id: string, @DownstreamSource() source: DownstreamRequestSource) {
    return this.execute(() => this.permissionService.getRoleTemplateById({ id }, source))
  }

  @Patch(':id')
  @PermissionCheckAll([ROLE_TEMPLATE_PERMISSION_CODES.UPDATE])
  @ApiOperation({ summary: 'Update a role template' })
  @ApiBody({ type: UpdateRoleDto })
  async updateRoleTemplate(
    @Param('id') id: string,
    @Body() body: UpdateRoleDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.updateRoleTemplate(
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
  @PermissionCheckAll([ROLE_TEMPLATE_PERMISSION_CODES.UPDATE])
  @ApiOperation({ summary: 'Enable or disable a role template' })
  @ApiBody({ type: SetRoleEnabledDto })
  async setRoleTemplateEnabled(
    @Param('id') id: string,
    @Body() body: SetRoleEnabledDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.setRoleTemplateEnabled(
        {
          id,
          isEnabled: body.isEnabled
        },
        source
      )
    )
  }

  @Get(':id/permissions')
  @PermissionCheckAll([ROLE_TEMPLATE_PERMISSION_CODES.GET_BY_ID])
  @ApiOperation({ summary: 'List permissions assigned to a role template' })
  async listRoleTemplatePermissions(
    @Param('id') id: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.listRoleTemplatePermissions({ roleTemplateId: id }, source)
    )
  }

  @Post(':id/permissions')
  @PermissionCheckAll([ROLE_TEMPLATE_PERMISSION_CODES.ASSIGN_PERMISSIONS])
  @ApiOperation({ summary: 'Assign a permission to a role template' })
  @ApiBody({ type: AssignRolePermissionDto })
  async assignRoleTemplatePermission(
    @Param('id') id: string,
    @Body() body: AssignRolePermissionDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.assignRoleTemplatePermission(
        {
          roleTemplateId: id,
          permissionId: body.permissionId
        },
        source
      )
    )
  }

  @Delete(':id/permissions/:permissionId')
  @PermissionCheckAll([ROLE_TEMPLATE_PERMISSION_CODES.ASSIGN_PERMISSIONS])
  @ApiOperation({ summary: 'Revoke a permission from a role template' })
  async revokeRoleTemplatePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.revokeRoleTemplatePermission(
        {
          roleTemplateId: id,
          permissionId
        },
        source
      )
    )
  }

  @Post(':id/instantiate')
  @PermissionCheckAll([ROLE_INSTANCE_PERMISSION_CODES.CREATE_FROM_TEMPLATE])
  @ApiOperation({ summary: 'Create a tenant role instance from a role template' })
  @ApiBody({ type: CreateRoleFromTemplateDto })
  async createRoleFromTemplate(
    @Param('id') id: string,
    @Body() body: CreateRoleFromTemplateDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.createRoleFromTemplate(
        {
          templateRoleId: id,
          tenantId: body.tenantId,
          name: body.name,
          description: body.description
        },
        source
      )
    )
  }

  @Delete(':id')
  @PermissionCheckAll([ROLE_TEMPLATE_PERMISSION_CODES.DELETE])
  @ApiOperation({ summary: 'Delete a role template' })
  async deleteRoleTemplate(
    @Param('id') id: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.deleteRoleTemplate({ id }, source))
  }

  private async execute<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work()
    } catch (error) {
      throw error
    }
  }
}
