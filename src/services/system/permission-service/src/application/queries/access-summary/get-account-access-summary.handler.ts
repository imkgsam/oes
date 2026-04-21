import { Inject, Logger } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AUTHORIZATION_DENIED } from '../../../common/constants/exception-enums'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { GetAccountAccessSummaryQuery } from './get-account-access-summary.query'

export interface AccountAccessRoleSummaryResult {
  roleId: string
  code: string
  name: string
  tenantId: string
  scope: string
}

export interface AccountAccessSummaryResult {
  roles: AccountAccessRoleSummaryResult[]
  actionCodes: string[]
}

@QueryHandler(GetAccountAccessSummaryQuery)
// Builds the current account's effective role and action-code summary for BFF self-context access checks.
export class GetAccountAccessSummaryHandler
  implements IQueryHandler<GetAccountAccessSummaryQuery, AccountAccessSummaryResult>
{
  private readonly logger = new Logger(GetAccountAccessSummaryHandler.name)

  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(query: GetAccountAccessSummaryQuery): Promise<AccountAccessSummaryResult> {
    const tenantId = query.scopeLevel === ScopeLevel.SYSTEM ? null : query.tenantId?.trim()
    if (query.scopeLevel === ScopeLevel.TENANT && !tenantId) {
      throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
        reason: 'tenant access summary requires tenantId'
      })
    }

    const roles = await this.roleRepo.findAccountRoles(
      query.accountId,
      tenantId,
      query.scopeLevel
    )

    const actionCodes = collectActionCodes(roles)

    const resolvedMessage = `access summary resolved: accountId=${query.accountId}; tenantId=${
      tenantId ?? ''
    }; scopeLevel=${query.scopeLevel}; roles=${roles.length}; roleCodes=${roles
      .map((role) => role.code)
      .join(',')}; actionCodes=${actionCodes.length}; sample=${actionCodes.slice(0, 12).join(',')}`

    if (actionCodes.length === 0) {
      this.logger.warn(resolvedMessage)
    } else {
      this.logger.log(resolvedMessage)
    }

    return {
      roles: roles.map(toRoleSummary).sort(sortRoleSummary),
      actionCodes
    }
  }
}

// Converts a role aggregate into the compact display summary exposed by the access-summary contract.
function toRoleSummary(role: Role): AccountAccessRoleSummaryResult {
  return {
    roleId: role.id,
    code: role.code,
    name: role.name,
    tenantId: role.tenantId ?? '',
    scope: role.isSystem ? 'SYSTEM' : 'TENANT'
  }
}

// Produces a stable, de-duplicated action-code list from the permissions attached to effective roles.
function collectActionCodes(roles: Role[]): string[] {
  const codes = new Set<string>()

  for (const role of roles) {
    for (const permission of role.permissions) {
      if (permission.permissionCode.trim()) {
        codes.add(permission.permissionCode)
      }
    }
  }

  return [...codes].sort((left, right) => left.localeCompare(right))
}

// Keeps role summaries deterministic so UI hydration and tests do not depend on repository row order.
function sortRoleSummary(
  left: AccountAccessRoleSummaryResult,
  right: AccountAccessRoleSummaryResult
): number {
  return left.name.localeCompare(right.name) || left.code.localeCompare(right.code)
}
