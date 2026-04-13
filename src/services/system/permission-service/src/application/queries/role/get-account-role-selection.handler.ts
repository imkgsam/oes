import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { AuthorizationQueryScopeService } from '../../authorization'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { GetAccountRoleSelectionQuery } from './get-account-role-selection.query'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AccountRoleQueryScope } from '../../authorization/operator-scope'

export interface AccountRoleSelectionResult {
  availableRoles: Role[]
  selectedRoleIds: string[]
}

@QueryHandler(GetAccountRoleSelectionQuery)
export class GetAccountRoleSelectionHandler
  implements IQueryHandler<GetAccountRoleSelectionQuery, AccountRoleSelectionResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: GetAccountRoleSelectionQuery): Promise<AccountRoleSelectionResult> {
    const queryScope = this.authorizationQueryScopeService.build<AccountRoleQueryScope>({
      resource: 'account_role',
      action: 'selection',
      operatorScope: query.operatorScope,
      filters: {
        tenantId: query.tenantId,
        scopeLevel: query.scopeLevel
      }
    })

    const [availableRoles, assignedRoles] = await Promise.all([
      queryScope.scopeLevel === ScopeLevel.SYSTEM
        ? this.roleRepo.findSystemRoles()
        : this.roleRepo.findTenantRoles(queryScope.tenantId!),
      this.roleRepo.findAccountRoles(query.accountId, queryScope.tenantId, queryScope.scopeLevel)
    ])

    return {
      availableRoles,
      selectedRoleIds: assignedRoles.map((role) => role.id)
    }
  }
}
