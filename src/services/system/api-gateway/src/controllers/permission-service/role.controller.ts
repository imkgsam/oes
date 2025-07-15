import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { CreateRoleDto } from 'src/dtos/role.dto'
import { firstValueFrom } from 'rxjs'

@Controller('role')
export class RoleController {
  constructor(
    @InjectServiceClient('PERMI_TCP')
    private readonly permissionClient: ClientProxy,
  ) {}

  @Get('/all')
  async getAllRoles() {
    const result = await this.permissionClient.send(
      PERMISSION_MESSAGES.LIST_ROLES,
      {},
    )
    return result
  }

  @Post()
  async createPermission(@Body() dto: CreateRoleDto) {
    return this.permissionClient.send(PERMISSION_MESSAGES.CREATE_ROLE, dto)
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const found = await firstValueFrom(
      this.permissionClient.send(PERMISSION_MESSAGES.GET_ROLE_BY_ID, { id }),
    )
    console.log('Role found:', found)
    if (!found) {
      return { message: 'Role not found' }
    }
    return found
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const deleted = await firstValueFrom(
      this.permissionClient.send(PERMISSION_MESSAGES.DELETE_ROLE, { id }),
    )
    console.log('Role deleted:', deleted)
    if (!deleted) {
      return { message: 'Role not found' }
    }
    return { message: 'Role deleted successfully', role: deleted }
  }
}
