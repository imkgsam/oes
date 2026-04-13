import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AuthorizationQueryScopeService,
  AccountRoleQueryScope
} from '../../authorization'
import { ListRolePermissionsQuery } from './list-role-permissions.query'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'

@QueryHandler(ListRolePermissionsQuery)
export class ListRolePermissionsHandler implements IQueryHandler<ListRolePermissionsQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: ListRolePermissionsQuery): Promise<Permission[]> {
    const role = await this.roleRepo.findById(query.roleId)
    if (!role || !role.isAssignable) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    this.authorizationQueryScopeService.build<AccountRoleQueryScope>({
      resource: 'role_permission',
      action: 'list',
      operatorScope: query.operatorScope,
      filters: {
        tenantId: role.tenantId,
        scopeLevel: role.kind === RoleKind.SYSTEM_INSTANCE ? ScopeLevel.SYSTEM : ScopeLevel.TENANT,
        roleId: role.id
      }
    })

    return this.roleRepo.findOwnPermissions(query.roleId)
  }
}
