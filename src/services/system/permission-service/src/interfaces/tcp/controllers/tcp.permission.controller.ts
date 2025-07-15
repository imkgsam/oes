import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { CreatePermissionUseCase, ListPermissionsUseCase } from 'src/application/use-cases/permission.use-case'
import { CreatePermissionDto, CheckUserPermissionDto } from 'src/application/dtos/permission.dto'
import { CheckUserPermissionUseCase } from 'src/application/use-cases/permission.use-case'
import { Permission } from 'src/domain/entities/permission.entity'
import { PermissionService } from 'src/application/services/permission.service'

@Controller()
export class TcpPermissionController {
  constructor(
    private readonly listPermissionsUseCase: ListPermissionsUseCase,
    private readonly createPermissionUseCase: CreatePermissionUseCase,
    private readonly checkUserPermissionUseCase: CheckUserPermissionUseCase,
    private readonly permissionService: PermissionService,
  ) {}

  @MessagePattern(PERMISSION_MESSAGES.CHECK_USER_PERMISSION)
  checkUserPermission(@Payload() data: CheckUserPermissionDto): Promise<boolean> {
    return this.checkUserPermissionUseCase.execute(data.userId, data.permissionCode)
  }

  @MessagePattern(PERMISSION_MESSAGES.CREATE_PERMISSION)
  createPermission(@Payload() data: CreatePermissionDto): Promise<Permission> {
    return this.createPermissionUseCase.execute(data)
  }

  @MessagePattern(PERMISSION_MESSAGES.LIST_PERMISSIONS)
  listAllPermissions(): Promise<Permission[]> {
    return this.listPermissionsUseCase.execute()
  }

  @MessagePattern(PERMISSION_MESSAGES.FIND_PERMISSION_BY_MODULE)
  findPermissionByModule(@Payload('module') module: string): Promise<Permission[]> {
    console.log('Finding permissions by module:', module)
    return this.permissionService.getAllByModule(module)
  }

  @MessagePattern(PERMISSION_MESSAGES.FIND_PERMISSION_BY_CODE)
  findPermissionByCode(@Payload('code') code: string): Promise<Permission | null> {
    return this.permissionService.getByCode(code)
  }

  @MessagePattern(PERMISSION_MESSAGES.DELETE_PERMISSION)
  deletePermission(@Payload('id') id: string): Promise<Permission | null> {
    return this.permissionService.delete(id)
  }
}
