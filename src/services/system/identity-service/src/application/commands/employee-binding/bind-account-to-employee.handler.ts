import {
  Inject,
} from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { HR_EMPLOYEE_REFERENCE_PORT, HrEmployeeReferencePort } from '../../ports/hr-employee-reference.port'
import { SYMBOLS } from '../../../common/constants'
import {
  IDENTITY_ACCOUNT_ALREADY_BOUND_TO_ANOTHER_EMPLOYEE,
  IDENTITY_ACCOUNT_NOT_FOUND,
  IDENTITY_ACCOUNT_TENANT_MISMATCH,
  IDENTITY_EMPLOYEE_ALREADY_BOUND_TO_ANOTHER_ACCOUNT,
  IDENTITY_EMPLOYEE_NOT_FOUND,
  IDENTITY_EMPLOYEE_TENANT_PARTY_MISMATCH,
  IDENTITY_EMPLOYEE_TENANT_MISMATCH,
  IDENTITY_USER_NOT_FOUND
} from '../../../common/constants/exceptions'
import { EmployeeBindingSummaryEntity } from '../../../domain/entities/employee-binding-summary.entity'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { EmployeeBindingRepository } from '../../../domain/repositories/employee-binding.repository'
import { UserRepository } from '../../../domain/repositories/user.repository'
import { BindAccountToEmployeeCommand } from './bind-account-to-employee.command'

/** BindAccountToEmployeeHandler validates tenant and tenant-party consistency before persisting the binding fact. */
@CommandHandler(BindAccountToEmployeeCommand)
export class BindAccountToEmployeeHandler
  implements ICommandHandler<BindAccountToEmployeeCommand, EmployeeBindingSummaryEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    @Inject(SYMBOLS.REPO.USER)
    private readonly userRepository: UserRepository,
    @Inject(SYMBOLS.REPO.EMPLOYEE_BINDING)
    private readonly employeeBindingRepository: EmployeeBindingRepository,
    @Inject(HR_EMPLOYEE_REFERENCE_PORT)
    private readonly hrEmployeeReferencePort: HrEmployeeReferencePort
  ) {}

  async execute(command: BindAccountToEmployeeCommand): Promise<EmployeeBindingSummaryEntity> {
    const account = await this.accountRepository.findById(command.accountId)
    if (!account) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_NOT_FOUND, {
        accountId: command.accountId
      })
    }

    if (account.scopeLevel !== 'TENANT' || account.tenantId !== command.tenantId) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_TENANT_MISMATCH, {
        accountId: command.accountId,
        expectedTenantId: command.tenantId,
        actualTenantId: account.tenantId,
        scopeLevel: account.scopeLevel
      })
    }

    const employee = await this.hrEmployeeReferencePort.getEmployeeById(command.employeeId)
    if (!employee) {
      throw ExceptionFactory.domain(IDENTITY_EMPLOYEE_NOT_FOUND, {
        employeeId: command.employeeId
      })
    }

    if (employee.tenantId !== command.tenantId) {
      throw ExceptionFactory.domain(IDENTITY_EMPLOYEE_TENANT_MISMATCH, {
        employeeId: command.employeeId,
        expectedTenantId: command.tenantId,
        actualTenantId: employee.tenantId
      })
    }

    const user = await this.userRepository.findById(account.userId)
    if (!user) {
      throw ExceptionFactory.domain(IDENTITY_USER_NOT_FOUND, {
        userId: account.userId
      })
    }

    if (!account.tenantPartyId || !employee.tenantPartyId || account.tenantPartyId !== employee.tenantPartyId) {
      throw ExceptionFactory.domain(IDENTITY_EMPLOYEE_TENANT_PARTY_MISMATCH, {
        userId: account.userId,
        employeeId: command.employeeId,
        accountTenantPartyId: account.tenantPartyId,
        employeeTenantPartyId: employee.tenantPartyId
      })
    }

    const existingByAccount = await this.employeeBindingRepository.findByAccountId(command.accountId)
    if (existingByAccount) {
      if (
        existingByAccount.employeeId === command.employeeId &&
        existingByAccount.tenantId === command.tenantId
      ) {
        return existingByAccount
      }
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_ALREADY_BOUND_TO_ANOTHER_EMPLOYEE, {
        accountId: command.accountId,
        employeeId: command.employeeId,
        existingEmployeeId: existingByAccount.employeeId
      })
    }

    const existingByEmployee = await this.employeeBindingRepository.findByEmployeeId(command.employeeId)
    if (existingByEmployee && existingByEmployee.accountId !== command.accountId) {
      throw ExceptionFactory.domain(IDENTITY_EMPLOYEE_ALREADY_BOUND_TO_ANOTHER_ACCOUNT, {
        accountId: command.accountId,
        employeeId: command.employeeId,
        existingAccountId: existingByEmployee.accountId
      })
    }

    return this.employeeBindingRepository.bind({
      tenantId: command.tenantId,
      accountId: command.accountId,
      employeeId: command.employeeId
    })
  }
}
