import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { EmployeeBindingSummaryEntity } from '../../../domain/entities/employee-binding-summary.entity'
import { EmployeeBindingRepository } from '../../../domain/repositories/employee-binding.repository'
import { UnbindAccountFromEmployeeCommand } from './unbind-account-from-employee.command'

/** UnbindAccountFromEmployeeHandler removes one existing employee binding without touching HR truth. */
@CommandHandler(UnbindAccountFromEmployeeCommand)
export class UnbindAccountFromEmployeeHandler
  implements ICommandHandler<UnbindAccountFromEmployeeCommand, EmployeeBindingSummaryEntity | null>
{
  constructor(
    @Inject(SYMBOLS.REPO.EMPLOYEE_BINDING)
    private readonly employeeBindingRepository: EmployeeBindingRepository
  ) {}

  async execute(
    command: UnbindAccountFromEmployeeCommand
  ): Promise<EmployeeBindingSummaryEntity | null> {
    return this.employeeBindingRepository.unbindByAccountId(command.accountId)
  }
}
