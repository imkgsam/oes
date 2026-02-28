import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { PermissionProxyService } from '../../../permission-service.service'
import { CreatePermissionDto } from '../dtos/create-permission.dto'

@ApiBearerAuth('JWT')
@ApiTags('permission')
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Get('all')
  @ApiOperation({ summary: 'List all permissions' })
  async getAllPermissions() {
    return this.permissionService.listPermissions()
  }

  @Post()
  @ApiOperation({ summary: 'Create a permission' })
  async createPermission(@Body() dto: CreatePermissionDto) {
    return this.permissionService.createPermission(dto)
  }

  @Get('by-module')
  @ApiOperation({ summary: 'Find permissions by module' })
  async findByModule(@Query('module') module: string) {
    return this.permissionService.listPermissionsByModule({ module })
  }

  @Get(':code')
  @ApiOperation({ summary: 'Find permission by code' })
  async findByCode(@Param('code') code: string) {
    return this.permissionService.getPermissionByCode({ code })
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a permission' })
  async delete(@Param('id') id: string) {
    return this.permissionService.deletePermission({ id })
  }
}
