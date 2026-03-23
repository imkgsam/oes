import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { PermissionProxyService } from '../../../permission-service.service'
import { CreatePermissionDto } from '../dtos/create-permission.dto'

@ApiBearerAuth('JWT')
@ApiTags('permission')
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Get('all')
  @ApiOperation({ summary: 'List all permissions' })
  async getAllPermissions(@Req() req: Request) {
    return this.permissionService.listPermissions(this.operatorSource(req))
  }

  @Post()
  @ApiOperation({ summary: 'Create a permission' })
  async createPermission(@Body() dto: CreatePermissionDto, @Req() req: Request) {
    return this.permissionService.createPermission(dto, this.operatorSource(req))
  }

  @Get('by-module')
  @ApiOperation({ summary: 'Find permissions by module' })
  async findByModule(@Query('module') module: string, @Req() req: Request) {
    return this.permissionService.listPermissionsByModule({ module }, this.operatorSource(req))
  }

  @Get(':code')
  @ApiOperation({ summary: 'Find permission by code' })
  async findByCode(@Param('code') code: string, @Req() req: Request) {
    return this.permissionService.getPermissionByCode({ code }, this.operatorSource(req))
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a permission' })
  async delete(@Param('id') id: string, @Req() req: Request) {
    return this.permissionService.deletePermission({ id }, this.operatorSource(req))
  }

  private operatorSource(req: Request) {
    return {
      user: req['user'],
      requestId: req.header('x-request-id') ?? undefined,
      traceId: req.header('x-trace-id') ?? undefined
    }
  }
}
