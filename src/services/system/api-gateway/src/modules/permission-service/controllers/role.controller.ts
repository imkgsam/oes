import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { CreateRoleDto } from 'src/dtos/role.dto'
import { safeRpcCall2 } from '@oes/common/helpers/rpc.helper'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'

@Controller('role')
export class RoleController {
  constructor(
    @InjectServiceClient(ServiceKeys.PERMISSION_TCP)
    private readonly permissionClient: ClientProxy
  ) {}

  @Get('/all')
  async getAllRoles() {
    return safeRpcCall2(this.permissionClient, PERMISSION_MESSAGES.LIST_ROLES, {})
  }

  @Post()
  async createRole(@Body() dto: CreateRoleDto) {
    return safeRpcCall2(this.permissionClient, PERMISSION_MESSAGES.CREATE_ROLE, dto)
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const found = await safeRpcCall2(this.permissionClient, PERMISSION_MESSAGES.GET_ROLE_BY_ID, {
      id
    })
    return found
  }

  @Delete(':id')
  async deleteRole(@Param('id') id: string) {
    return safeRpcCall2(this.permissionClient, PERMISSION_MESSAGES.DELETE_ROLE_BY_ID, { id })
  }
}
