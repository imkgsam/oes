import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { CreatePermissionDto } from 'src/dtos/permission.dto'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { safeRpcCall } from '@oes/common/helpers/rpc.helper'

@ApiTags('权限管理')
@Controller('permission')
export class PermissionController {
  constructor(
    @InjectServiceClient(ServiceKeys.PERMI_TCP)
    private readonly permissionClient: ClientProxy
  ) { }

  @Get('/all')
  @ApiOperation({ summary: '获取所有权限' })
  async getAllPermissions() {
    return safeRpcCall(this.permissionClient.send(PERMISSION_MESSAGES.LIST_PERMISSIONS, {}))
  }

  @Post()
  @ApiOperation({ summary: '创建权限' })
  @ApiBody({ type: CreatePermissionDto })
  async createPermission(@Body() dto: CreatePermissionDto) {
    return safeRpcCall(this.permissionClient.send(PERMISSION_MESSAGES.CREATE_PERMISSION, dto))
  }

  @Get('/by-module')
  @ApiOperation({ summary: '根据模块获取权限' })
  @ApiQuery({ name: 'module', required: true, description: '模块名称' })
  async findByModule(@Query('module') module: string) {
    return safeRpcCall(this.permissionClient.send(PERMISSION_MESSAGES.FIND_PERMISSION_BY_MODULE, { module }))
  }

  @Get(':code')
  @ApiOperation({ summary: '根据权限 code 获取权限信息' })
  @ApiParam({ name: 'code', description: '权限编码' })
  async findByCode(@Param('code') code: string) {
    return safeRpcCall(this.permissionClient.send(PERMISSION_MESSAGES.FIND_PERMISSION_BY_CODE, { code }))
  }

  @Delete(':id')
  @ApiOperation({ summary: '根据 ID 删除权限' })
  @ApiParam({ name: 'id', description: '权限 ID' })
  async delete(@Param('id') id: string) {
    return safeRpcCall(this.permissionClient.send(PERMISSION_MESSAGES.DELETE_PERMISSION, { id }))
  }
}
