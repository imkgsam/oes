import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { PERMISSION_MESSAGES } from "@oes/common/constants/messages/permission.message";
import { CheckUserPermissionDto, CheckUserScopeDto } from "../dtos/permission.dto";

@Controller()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) { }

  @MessagePattern(PERMISSION_MESSAGES.CHECK_USER_PERMISSION)
  checkUserPermission(@Payload() data: CheckUserPermissionDto) {
    return this.permissionService.checkUserPermission(data);
  }

  @MessagePattern(PERMISSION_MESSAGES.CheckUserScope)
  checkUserScope(@Payload() data: CheckUserScopeDto) {
    return this.permissionService.checkUserScope(data);
  }

}