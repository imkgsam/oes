import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { randomUUID } from 'crypto'
import { ROLE_TEMPLATE_NOT_FOUND } from '../../../common/constants/exception-enums'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { RolePermission } from '../../../domain/vo/role-permission.value-object'
import { SYMBOLS } from '../../../common/constants/symbols'
import { assertTenantAccess } from '../../authorization/operator-scope'
import { syncTemplateNavigationToRole } from './template-navigation.sync'
import { NavigationRepository } from '../../../domain/repositories/navigation.repository'
import { EnsureTenantRoleInstanceFromTemplateCommand } from './ensure-tenant-role-instance-from-template.command'

export type EnsureTenantRoleInstanceFromTemplateResult = {
  role: Role
  created: boolean
}

/** EnsureTenantRoleInstanceFromTemplateHandler idempotently derives a tenant role instance from a system template code. */
@CommandHandler(EnsureTenantRoleInstanceFromTemplateCommand)
export class EnsureTenantRoleInstanceFromTemplateHandler
  implements ICommandHandler<EnsureTenantRoleInstanceFromTemplateCommand, EnsureTenantRoleInstanceFromTemplateResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepository: RoleRepository,
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepository: NavigationRepository
  ) {}

  async execute(command: EnsureTenantRoleInstanceFromTemplateCommand): Promise<EnsureTenantRoleInstanceFromTemplateResult> {
    const tenantId = command.tenantId.trim()
    const templateRoleCode = command.templateRoleCode.trim()

    assertTenantAccess(command.operatorScope, tenantId, {
      requestedTenantId: tenantId
    })

    const existing = await this.roleRepository.findByScopeKindAndCode(
      tenantId,
      RoleKind.TENANT_INSTANCE,
      templateRoleCode
    )
    if (existing) {
      return { role: existing, created: false }
    }

    const templateRole = await this.roleRepository.findByScopeKindAndCode(
      '__SYSTEM_TEMPLATE__',
      RoleKind.SYSTEM_TEMPLATE,
      templateRoleCode
    )
    if (!templateRole || !templateRole.isEnabled) {
      throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND, {
        templateRoleCode
      })
    }

    const role = new Role(
      randomUUID(),
      command.name?.trim() || templateRole.name,
      templateRole.code,
      tenantId,
      RoleKind.TENANT_INSTANCE,
      true,
      command.description?.trim() || templateRole.description,
      templateRole.id
    )

    for (const permission of templateRole.permissions) {
      role.addPermission(new RolePermission(role.id, permission.permissionId, permission.permissionCode))
    }

    const savedRole = await this.roleRepository.save(role)
    await syncTemplateNavigationToRole(this.navigationRepository, templateRole.id, savedRole.id)
    return { role: savedRole, created: true }
  }
}
