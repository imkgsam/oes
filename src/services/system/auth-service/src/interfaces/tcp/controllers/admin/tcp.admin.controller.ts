import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'

@Controller()
export class TcpPermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @MessagePattern(PERMISSION_MESSAGES.DELETE_PERMISSION)
  deletePermission(@Payload('id') id: string): Promise<Permission | null> {
    return this.permissionService.delete(id)
  }
}
