import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CreateRoleInstanceCommand } from './create-role-instance.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { RolePermission } from '../../../domain/vo/role-permission.value-object'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  ROLE_ALREADY_EXISTS,
  ROLE_TEMPLATE_NOT_FOUND
} from '../../../common/constants/exception-enums'

@CommandHandler(CreateRoleInstanceCommand)
export class CreateRoleInstanceHandler implements ICommandHandler<CreateRoleInstanceCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: CreateRoleInstanceCommand): Promise<Role> {
    const existing = await this.roleRepo.findByScopeAndCode(command.tenantId, command.code)
    if (existing) throw ExceptionFactory.domain(ROLE_ALREADY_EXISTS)

    let templateRole: Role | null = null
    if (command.templateRoleId) {
      templateRole = await this.roleRepo.findRoleTemplateById(command.templateRoleId)
      if (!templateRole) throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND)
    }

    const role = new Role(
      crypto.randomUUID(),
      command.name,
      command.code,
      command.tenantId,
      RoleKind.TENANT_INSTANCE,
      true,
      command.description,
      command.templateRoleId ?? null
    )

    if (templateRole) {
      for (const permission of templateRole.permissions) {
        role.addPermission(
          new RolePermission(role.id, permission.permissionId, permission.permissionCode)
        )
      }
    }

    return this.roleRepo.save(role)
  }
}
