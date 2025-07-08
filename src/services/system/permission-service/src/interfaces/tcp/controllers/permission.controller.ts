import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { PERMISSION_MESSAGES } from '@oes/constants/messages/permission.message'

@Controller()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) { }

  @MessagePattern(PERMISSION_MESSAGES.CheckUserPermission)
  checkUserPermission(@Payload() data: CheckUserPermissionDto) {
    return this.permissionService.checkUserPermission(data);
  }

  @MessagePattern(PERMISSION_MESSAGES.CheckUserScope)
  checkUserScope(@Payload() data: CheckUserScopeDto) {
    return this.permissionService.checkUserScope(data);
  }

}