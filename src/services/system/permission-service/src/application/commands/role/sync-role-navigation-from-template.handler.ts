import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  ROLE_NOT_FOUND,
  ROLE_TEMPLATE_NOT_FOUND,
  ROLE_TEMPLATE_SYNC_NOT_AVAILABLE
} from '../../../common/constants/exception-enums'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { NavigationRepository, RoleNavigationConfig } from '../../../domain/repositories/navigation.repository'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { assertRoleScopeAccess } from '../../authorization/operator-scope'
import { syncTemplateNavigationToRole } from './template-navigation.sync'
import { SyncRoleNavigationFromTemplateCommand } from './sync-role-navigation-from-template.command'

/** SyncRoleNavigationFromTemplateHandler resets one role instance navigation to match its source template. */
@CommandHandler(SyncRoleNavigationFromTemplateCommand)
export class SyncRoleNavigationFromTemplateHandler
  implements ICommandHandler<SyncRoleNavigationFromTemplateCommand, RoleNavigationConfig>
{
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepo: NavigationRepository
  ) {}

  async execute(command: SyncRoleNavigationFromTemplateCommand): Promise<RoleNavigationConfig> {
    const role = await this.roleRepo.findById(command.roleId)
    if (!role || !role.isAssignable) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    assertRoleScopeAccess(
      command.operatorScope,
      role.kind === RoleKind.SYSTEM_INSTANCE ? ScopeLevel.SYSTEM : ScopeLevel.TENANT,
      role.tenantId,
      { roleId: role.id }
    )

    const templateRoleId = role.templateRoleId?.trim()
    if (!templateRoleId) {
      throw ExceptionFactory.domain(ROLE_TEMPLATE_SYNC_NOT_AVAILABLE, {
        roleId: role.id
      })
    }

    const templateRole = await this.roleRepo.findRoleTemplateById(templateRoleId)
    if (!templateRole) {
      throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND, {
        roleId: role.id,
        templateRoleId
      })
    }

    return syncTemplateNavigationToRole(this.navigationRepo, templateRole.id, role.id)
  }
}
