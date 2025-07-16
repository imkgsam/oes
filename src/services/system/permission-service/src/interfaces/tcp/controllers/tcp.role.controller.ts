import { Controller } from '@nestjs/common'
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { CreateRoleDto } from 'src/application/dtos/role.dto'
import { RoleService } from 'src/application/services/role.service'
import { Role } from 'src/domain/entities/role.entity'
import { PERMISSION_SERVICE_ERRORS } from '@oes/common/constants/res-codes/permission-service.errors'
import { createBusinessException } from '@oes/common/helpers/exception.factory'

@Controller()
export class TcpRoleController {
  constructor(private readonly roleService: RoleService) { }

  @MessagePattern(PERMISSION_MESSAGES.CREATE_ROLE)
  checkUserPermission(@Payload() data: CreateRoleDto): Promise<Role> {
    return this.roleService.create(data)
  }

  @MessagePattern(PERMISSION_MESSAGES.GET_ROLE_BY_ID)
  async getRoleById(@Payload('id') id: string): Promise<Role | null> {
    const found = await this.roleService.getById(id)
    if (!found) throw createBusinessException(PERMISSION_SERVICE_ERRORS.ROLE_NOT_FOUND)
    return found
  }

  @MessagePattern(PERMISSION_MESSAGES.LIST_ROLES)
  getAllRoles(): Promise<Role[]> {
    return this.roleService.getAllRoles()
  }

  @MessagePattern(PERMISSION_MESSAGES.DELETE_ROLE)
  deleteRole(@Payload('id') id: string): Promise<Role | null> {
    return this.roleService.delete(id)
  }
}
