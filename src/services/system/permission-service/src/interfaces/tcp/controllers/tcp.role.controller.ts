import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { Role } from 'src/domain/aggregates/role.aggregate'
import { ValidatingCommandBus, ValidatingQueryBus } from 'src/application/cqrs'
import { CreateRoleCommand, DeleteRoleCommand } from 'src/application/commands/role'
import { GetRoleByIdQuery, ListRolesQuery } from 'src/application/queries/role'
import { createBusinessException } from '@oes/common/exceptions/exception.factory'
import { PERMISSION_SERVICE_ERRORS } from '@oes/common/constants/res-codes/permission-service.errors'

@Controller()
export class TcpRoleController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus
  ) {}

  @MessagePattern(PERMISSION_MESSAGES.CREATE_ROLE)
  createRole(@Payload() data: { name: string; code: string; description?: string }): Promise<Role> {
    return this.commandBus.execute(new CreateRoleCommand(data.name, data.code, data.description))
  }

  @MessagePattern(PERMISSION_MESSAGES.GET_ROLE_BY_ID)
  async getRoleById(@Payload('id') id: string): Promise<Role | null> {
    const found = await this.queryBus.execute(new GetRoleByIdQuery(id))
    if (!found) {
      throw createBusinessException(PERMISSION_SERVICE_ERRORS.ROLE_NOT_FOUND)
    }
    return found
  }

  @MessagePattern(PERMISSION_MESSAGES.LIST_ROLES)
  getAllRoles(): Promise<Role[]> {
    return this.queryBus.execute(new ListRolesQuery())
  }

  @MessagePattern(PERMISSION_MESSAGES.DELETE_ROLE_BY_ID)
  deleteRole(@Payload('id') id: string): Promise<Role | null> {
    return this.commandBus.execute(new DeleteRoleCommand(id))
  }
}
