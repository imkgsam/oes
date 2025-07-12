import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { CreateRoleDto } from 'src/application/dtos/role.dto'
import { RoleService } from 'src/application/services/role.service'
import { Role } from 'src/domain/entities/role.entity'

@Controller()
export class TcpRoleController {
  constructor(
    private readonly roleService: RoleService
  ) { }

  @MessagePattern(PERMISSION_MESSAGES.CREATE_ROLE)
  checkUserPermission(@Payload() data: CreateRoleDto): Promise<Role> {
    return this.roleService.create(data)
  }

  @MessagePattern(PERMISSION_MESSAGES.GET_ROLE_BY_ID)
  getRoleById(@Payload() id: string): Promise<Role | null> {
    return this.roleService.getById(id)
  }

  @MessagePattern(PERMISSION_MESSAGES.LIST_ROLES)
  getAllRoles(): Promise<Role[]> {
    return this.roleService.getAllRoles()
  } 

  @MessagePattern(PERMISSION_MESSAGES.DELETE_ROLE)
  deleteRole(@Payload() id: string): Promise<Role | null> {  
    return this.roleService.delete(id)
  }
}
