import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { EmployeeBindingRepository } from '../../../domain/repositories/employee-binding.repository'
import { EmployeeBindingSummaryView } from './employee-binding-query.result'
import { GetEmployeeBindingByAccountIdQuery } from './get-employee-binding-by-account-id.query'

/** GetEmployeeBindingByAccountIdHandler exposes the identity-owned binding lookup by account id. */
@QueryHandler(GetEmployeeBindingByAccountIdQuery)
export class GetEmployeeBindingByAccountIdHandler
  implements IQueryHandler<GetEmployeeBindingByAccountIdQuery, EmployeeBindingSummaryView | null>
{
  constructor(
    @Inject(SYMBOLS.REPO.EMPLOYEE_BINDING)
    private readonly employeeBindingRepository: EmployeeBindingRepository
  ) {}

  async execute(
    query: GetEmployeeBindingByAccountIdQuery
  ): Promise<EmployeeBindingSummaryView | null> {
    const binding = await this.employeeBindingRepository.findByAccountId(query.accountId)
    if (!binding) {
      return null
    }

    return {
      id: binding.id,
      tenantId: binding.tenantId,
      accountId: binding.accountId,
      employeeId: binding.employeeId
    }
  }
}
