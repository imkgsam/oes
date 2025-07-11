import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { CreatePermissionUseCase } from 'src/application/use-cases/permission.use-case'
import { CreatePermissionDto, CheckUserPermissionDto } from 'src/application/dtos/permission.dto'
import { CheckUserPermissionUseCase } from 'src/application/use-cases/permission.use-case'
import { Permission } from 'src/domain/entities/permission.entity'

@Controller()
export class TcpPermissionController {
  constructor(
    private readonly createPermissionUseCase: CreatePermissionUseCase,
    private readonly checkUserPermissionUseCase: CheckUserPermissionUseCase,
  ) {}

  @MessagePattern(PERMISSION_MESSAGES.CHECK_USER_PERMISSION)
  checkUserPermission(@Payload() data: CheckUserPermissionDto): Promise<boolean> {
    return this.checkUserPermissionUseCase.execute(data.userId, data.permissionCode)
  }

  @MessagePattern(PERMISSION_MESSAGES.CREATE_PERMISSION)
  createPermission(@Payload() data: CreatePermissionDto): Promise<Permission> {
    return this.createPermissionUseCase.execute(data)
  }
}
