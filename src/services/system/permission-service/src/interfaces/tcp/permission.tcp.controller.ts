// File: src/services/system/permission-service/src/interfaces/tcp/permission.tcp.controller.ts
// Note: this file is deprecated and migrate to grpc controller.

import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { Permission } from 'src/domain/aggregates/permission.aggregate'
import { ValidatingCommandBus, ValidatingQueryBus } from 'src/application/cqrs'
import {
  CreatePermissionCommand,
  DeletePermissionCommand
} from 'src/application/commands/permission'
import {
  GetPermissionByCodeQuery,
  ListPermissionsQuery,
  ListPermissionsByModuleQuery
} from 'src/application/queries/permission'
import { CheckUserPermissionQuery } from 'src/application/queries/authorization'
import { PermissionModule } from 'src/domain/enums/permission-module.enum'

@Controller()
export class TcpPermissionController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus
  ) {}

  @MessagePattern(PERMISSION_MESSAGES.CHECK_USER_PERMISSION)
  checkUserPermission(
    @Payload() data: { userId: string; permissionCode: string }
  ): Promise<boolean> {
    return this.queryBus.execute(new CheckUserPermissionQuery(data.userId, data.permissionCode))
  }

  @MessagePattern(PERMISSION_MESSAGES.CREATE_PERMISSION)
  createPermission(
    @Payload() data: { code: string; module: string; description?: string }
  ): Promise<Permission> {
    const module = PermissionModule.from(data.module)
    return this.commandBus.execute(new CreatePermissionCommand(data.code, module, data.description))
  }

  @MessagePattern(PERMISSION_MESSAGES.LIST_PERMISSIONS)
  listAllPermissions(): Promise<Permission[]> {
    return this.queryBus.execute(new ListPermissionsQuery())
  }

  @MessagePattern(PERMISSION_MESSAGES.GET_PERMISSIONS_BY_MODULE)
  findPermissionByModule(@Payload('module') module: string): Promise<Permission[]> {
    const permissionModule = PermissionModule.from(module)
    return this.queryBus.execute(new ListPermissionsByModuleQuery(permissionModule))
  }

  @MessagePattern(PERMISSION_MESSAGES.GET_PERMISSION_BY_CODE)
  findPermissionByCode(@Payload('code') code: string): Promise<Permission | null> {
    return this.queryBus.execute(new GetPermissionByCodeQuery(code))
  }

  @MessagePattern(PERMISSION_MESSAGES.DELETE_PERMISSION)
  deletePermission(@Payload('id') id: string): Promise<Permission | null> {
    return this.commandBus.execute(new DeletePermissionCommand(id))
  }
}
