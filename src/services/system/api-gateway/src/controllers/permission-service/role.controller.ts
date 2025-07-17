import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { CreateRoleDto } from 'src/dtos/role.dto'
import { safeRpcCall } from '@oes/common/helpers/rpc.helper'
import { createBusinessException } from '@oes/common/helpers/exception.factory'
import { PERMISSION_SERVICE_ERRORS } from '@oes/common/constants/res-codes/permission-service.errors'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'

@Controller('role')
export class RoleController {
  constructor(
    @InjectServiceClient(ServiceKeys.PERMI_TCP)
    private readonly permissionClient: ClientProxy,
  ) { }

  @Get('/all')
  async getAllRoles() {
    return safeRpcCall(this.permissionClient.send(PERMISSION_MESSAGES.LIST_ROLES, {}))
  }

  @Post()
  async createPermission(@Body() dto: CreateRoleDto) {
    return safeRpcCall(this.permissionClient.send(PERMISSION_MESSAGES.CREATE_ROLE, dto))
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const found = await safeRpcCall(this.permissionClient.send(PERMISSION_MESSAGES.GET_ROLE_BY_ID, { id }),)
    console.log('Role found:', found)
    if (!found) throw createBusinessException(PERMISSION_SERVICE_ERRORS.ROLE_NOT_FOUND)
    return found
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const deleted = await safeRpcCall(this.permissionClient.send(PERMISSION_MESSAGES.DELETE_ROLE, { id }))
    if (!deleted) throw createBusinessException(PERMISSION_SERVICE_ERRORS.ROLE_NOT_FOUND)
    return deleted
  }
}

