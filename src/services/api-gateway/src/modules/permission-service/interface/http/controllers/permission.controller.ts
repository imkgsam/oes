import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { PermissionCheckAll } from '@oes/common/authorization'
import {
  PERMISSION_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import { PermissionProxyService } from '../../../permission-service.service'
import { CreatePermissionDto } from '../dtos/create-permission.dto'
import { ListPermissionsDto } from '../dtos/list-permissions.dto'
import { UpdatePermissionDto } from '../dtos/update-permission.dto'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'

// Exposes gateway-side permission dictionary management endpoints for platform administrators.
@ApiBearerAuth('JWT')
@ApiTags('permission')
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Get()
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_PERMISSION])
  @ApiOperation({ summary: 'List permissions with optional filters' })
  async listPermissions(
    @Query() query: ListPermissionsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.listPermissions(
        {
          module: query.module,
          keyword: query.keyword,
          page: query.page,
          pageSize: query.pageSize
        },
        source
      )
    )
  }

  @Post()
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.CREATE_PERMISSION])
  @ApiOperation({ summary: 'Create a permission' })
  async createPermission(
    @Body() dto: CreatePermissionDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.createPermission(dto, source))
  }

  @Get('id/:id')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_PERMISSION_DETAIL])
  @ApiOperation({ summary: 'Find permission by ID' })
  // Returns a global permission dictionary item by id for detail and edit views.
  async findById(
    @Param('id') id: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.getPermissionById({ id }, source))
  }

  @Patch(':id')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.UPDATE_PERMISSION])
  @ApiOperation({ summary: 'Update a permission' })
  // Updates mutable metadata on a global permission dictionary item.
  async updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.updatePermission(
        {
          id,
          module: dto.module,
          description: dto.description
        },
        source
      )
    )
  }

  @Get(':id/roles')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_ROLE_INSTANCE])
  @ApiOperation({ summary: 'List roles that include a permission' })
  // Returns role summaries that reference one global permission.
  async listPermissionRoles(
    @Param('id') id: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.listPermissionRoles({ permissionId: id }, source)
    )
  }

  @Get(':code')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_PERMISSION_DETAIL_BY_CODE])
  @ApiOperation({ summary: 'Find permission by code' })
  async findByCode(
    @Param('code') code: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.getPermissionByCode({ code }, source))
  }

  @Delete(':id')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.DELETE_PERMISSION])
  @ApiOperation({ summary: 'Delete a permission' })
  async delete(@Param('id') id: string, @DownstreamSource() source: DownstreamRequestSource) {
    return this.execute(() => this.permissionService.deletePermission({ id }, source))
  }

  private async execute<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work()
    } catch (error) {
      throw error
    }
  }
}
