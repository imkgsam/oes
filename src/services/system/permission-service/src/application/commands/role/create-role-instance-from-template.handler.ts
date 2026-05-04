import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CreateRoleInstanceFromTemplateCommand } from './create-role-instance-from-template.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { NavigationRepository } from '../../../domain/repositories/navigation.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { RolePermission } from '../../../domain/vo/role-permission.value-object'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  ROLE_ALREADY_EXISTS,
  ROLE_CREATE_CONSTRAINT_INVALID,
  ROLE_TEMPLATE_NOT_FOUND
} from '../../../common/constants/exception-enums'
import { assertTenantAccess } from '../../authorization/operator-scope'
import { syncTemplateNavigationToRole } from './template-navigation.sync'

@CommandHandler(CreateRoleInstanceFromTemplateCommand)
export class CreateRoleInstanceFromTemplateHandler
  implements ICommandHandler<CreateRoleInstanceFromTemplateCommand>
{
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepo: NavigationRepository
  ) {}

  async execute(command: CreateRoleInstanceFromTemplateCommand): Promise<Role> {
    assertTenantAccess(command.operatorScope, command.tenantId, {
      requestedTenantId: command.tenantId
    })

    const templateRole = await this.roleRepo.findRoleTemplateById(command.templateRoleId)
    if (!templateRole) throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND)

    const code = templateRole.code
    const name = command.name ?? templateRole.name
    const description = command.description ?? templateRole.description

    if (!name || !code) {
      throw ExceptionFactory.domain(ROLE_CREATE_CONSTRAINT_INVALID)
    }

    const existing = await this.roleRepo.findByScopeKindAndCode(
      command.tenantId,
      RoleKind.TENANT_INSTANCE,
      code
    )
    if (existing) throw ExceptionFactory.domain(ROLE_ALREADY_EXISTS)

    const role = new Role(
      crypto.randomUUID(),
      name,
      code,
      command.tenantId,
      RoleKind.TENANT_INSTANCE,
      true,
      description,
      command.templateRoleId,
      [],
      templateRole.allowTenantPermissionOverride,
      templateRole.isProtected
    )

    for (const permission of templateRole.permissions) {
      role.addPermission(new RolePermission(role.id, permission.permissionId, permission.permissionCode))
    }

    const savedRole = await this.roleRepo.save(role)
    await syncTemplateNavigationToRole(this.navigationRepo, command.templateRoleId, savedRole.id)

    return savedRole
  }
}
