import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { CreatePermissionDto } from 'src/dtos/permission.dto'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { safeRpcCall2 } from '@oes/common/helpers/rpc.helper'

@Controller('permission')
export class PermissionController {
  constructor(
    @InjectServiceClient(ServiceKeys.PERMISSION_TCP)
    private readonly permissionClient: ClientProxy
  ) {}

  @Get('/all')
  async getAllPermissions() {
    return safeRpcCall2(this.permissionClient, PERMISSION_MESSAGES.LIST_PERMISSIONS, {})
  }

  @Post()
  async createPermission(@Body() dto: CreatePermissionDto) {
    return safeRpcCall2(this.permissionClient, PERMISSION_MESSAGES.CREATE_PERMISSION, dto)
  }

  @Get('/by-module')
  async findByModule(@Query('module') module: string) {
    return safeRpcCall2(this.permissionClient, PERMISSION_MESSAGES.GET_PERMISSIONS_BY_MODULE, {
      module
    })
  }

  @Get(':code')
  async findByCode(@Param('code') code: string) {
    return safeRpcCall2(this.permissionClient, PERMISSION_MESSAGES.GET_PERMISSION_BY_CODE, {
      code
    })
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return safeRpcCall2(this.permissionClient, PERMISSION_MESSAGES.DELETE_PERMISSION, { id })
  }
}
