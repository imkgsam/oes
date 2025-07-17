import { Controller } from '@nestjs/common'
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { CreateRoleDto } from 'src/application/dtos/role.dto'
import { RoleService } from 'src/application/services/role.service'
import { Role } from 'src/domain/entities/role.entity'
import { PERMISSION_SERVICE_ERRORS } from '@oes/common/constants/res-codes/permission-service.errors'
import { createBusinessException } from '@oes/common/helpers/exception.factory'

@Controller()
export class TcpTestController {
  constructor(private readonly roleService: RoleService) { }

  @MessagePattern(PERMISSION_MESSAGES.Test)
  async testing() {
    // return 123
    // throw new Error('sdfsdfds')
    throw createBusinessException(PERMISSION_SERVICE_ERRORS.ROLE_NOT_FOUND)
  }
}
