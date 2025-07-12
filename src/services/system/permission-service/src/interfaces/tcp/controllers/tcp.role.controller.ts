import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { CreatePermissionUseCase, ListPermissionsUseCase } from 'src/application/use-cases/permission.use-case'
import { CreatePermissionDto, CheckUserPermissionDto } from 'src/application/dtos/permission.dto'
import { CheckUserPermissionUseCase } from 'src/application/use-cases/permission.use-case'
import { RoleService } from 'src/application/services/role.service'

@Controller()
export class TcpRoleController {
  constructor(
    private readonly roleService: RoleService
  ) { }

  @MessagePattern(PERMISSION_MESSAGES.CHECK_USER_PERMISSION)
  checkUserPermission(@Payload() data: CheckUserPermissionDto): Promise<boolean> {
    return this.checkUserPermissionUseCase.execute(data.userId, data.permissionCode)
  }
}
