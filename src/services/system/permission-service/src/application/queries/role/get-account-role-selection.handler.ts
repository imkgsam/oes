import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetAccountRoleSelectionQuery } from './get-account-role-selection.query'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'

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
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: GetAccountRoleSelectionQuery): Promise<AccountRoleSelectionResult> {
    const [availableRoles, assignedRoles] = await Promise.all([
      this.roleRepo.findTenantRoles(query.tenantId),
      this.roleRepo.findAccountRoles(query.accountId, query.tenantId)
    ])

    return {
      availableRoles,
      selectedRoleIds: assignedRoles.map((role) => role.id)
    }
  }
}
