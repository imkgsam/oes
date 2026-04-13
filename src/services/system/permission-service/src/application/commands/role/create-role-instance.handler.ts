import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CreateRoleInstanceCommand } from './create-role-instance.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { RolePermission } from '../../../domain/vo/role-permission.value-object'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  AUTHORIZATION_DENIED,
  ROLE_ALREADY_EXISTS,
  ROLE_TEMPLATE_NOT_FOUND
} from '../../../common/constants/exception-enums'
import { assertRoleScopeAccess } from '../../authorization/operator-scope'

@CommandHandler(CreateRoleInstanceCommand)
export class CreateRoleInstanceHandler implements ICommandHandler<CreateRoleInstanceCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: CreateRoleInstanceCommand): Promise<Role> {
    assertRoleScopeAccess(command.operatorScope, command.scopeLevel, command.tenantId, {
      requestedTenantId: command.tenantId
    })

    const tenantId = command.scopeLevel === ScopeLevel.SYSTEM ? null : command.tenantId?.trim()
    if (command.scopeLevel === ScopeLevel.TENANT && !tenantId) {
      throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
        reason: 'tenant role instance requires tenantId'
      })
    }
    const scopeKey = command.scopeLevel === ScopeLevel.SYSTEM ? '__SYSTEM__' : tenantId
    const roleKind =
      command.scopeLevel === ScopeLevel.SYSTEM
        ? RoleKind.SYSTEM_INSTANCE
        : RoleKind.TENANT_INSTANCE

    const existing = await this.roleRepo.findByScopeKindAndCode(scopeKey!, roleKind, command.code)
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
      tenantId,
      roleKind,
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
