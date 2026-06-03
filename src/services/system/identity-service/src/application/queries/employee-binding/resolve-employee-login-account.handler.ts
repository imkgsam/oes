import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { EmployeeBindingRepository } from '../../../domain/repositories/employee-binding.repository'
import { EmployeeLoginAccountView } from './employee-binding-query.result'
import { ResolveEmployeeLoginAccountQuery } from './resolve-employee-login-account.query'

/** ResolveEmployeeLoginAccountHandler resolves the enabled tenant account bound to one employee. */
@QueryHandler(ResolveEmployeeLoginAccountQuery)
export class ResolveEmployeeLoginAccountHandler
  implements IQueryHandler<ResolveEmployeeLoginAccountQuery, EmployeeLoginAccountView | null>
{
  constructor(
    @Inject(SYMBOLS.REPO.EMPLOYEE_BINDING)
    private readonly employeeBindingRepository: EmployeeBindingRepository,
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository
  ) {}

  async execute(query: ResolveEmployeeLoginAccountQuery): Promise<EmployeeLoginAccountView | null> {
    const binding = await this.employeeBindingRepository.findByEmployeeId(query.employeeId)
    if (!binding || binding.tenantId !== query.tenantId) {
      return null
    }

    const account = await this.accountRepository.findById(binding.accountId)
    if (!account || account.scopeLevel !== 'TENANT' || account.tenantId !== query.tenantId) {
      return null
    }

    return {
      userId: account.userId,
      accountId: account.id,
      tenantId: account.tenantId,
      scopeLevel: account.scopeLevel,
      displayName: account.displayName,
      accountEnabled: account.isEnabled
    }
  }
}
