import { BindAccountToEmployeeCommand } from '../../src/application/commands/employee-binding/bind-account-to-employee.command'
import { BindAccountToEmployeeHandler } from '../../src/application/commands/employee-binding/bind-account-to-employee.handler'
import { ResolveEmployeeLoginAccountQuery } from '../../src/application/queries/employee-binding/resolve-employee-login-account.query'
import { ResolveEmployeeLoginAccountHandler } from '../../src/application/queries/employee-binding/resolve-employee-login-account.handler'
import { EmployeeBindingSummaryEntity } from '../../src/domain/entities/employee-binding-summary.entity'
import { AccountRepository } from '../../src/domain/repositories/account.repository'
import { EmployeeBindingRepository } from '../../src/domain/repositories/employee-binding.repository'
import { UserRepository } from '../../src/domain/repositories/user.repository'
import { HrEmployeeReferencePort } from '../../src/application/ports/hr-employee-reference.port'
import { OESExceptionBase } from '@oes/common/exceptions'
import {
  createAccountSummaryFixture,
  createAccountRepositoryMock,
  createUserRepositoryMock,
  createUserSummaryFixture
} from '../helpers/identity-fixtures'

function createEmployeeBindingRepositoryMock(): jest.Mocked<EmployeeBindingRepository> {
  return {
    bind: jest.fn(),
    findByAccountId: jest.fn(),
    findByEmployeeId: jest.fn(),
    unbindByAccountId: jest.fn()
  } as unknown as jest.Mocked<EmployeeBindingRepository>
}

function createHrEmployeeReferencePortMock(): jest.Mocked<HrEmployeeReferencePort> {
  return {
    getEmployeeById: jest.fn()
  } as unknown as jest.Mocked<HrEmployeeReferencePort>
}

describe('BindAccountToEmployeeHandler', () => {
  it('binds account to employee when tenant and party match', async () => {
    const accountRepository = createAccountRepositoryMock()
    const userRepository = createUserRepositoryMock()
    const bindingRepository = createEmployeeBindingRepositoryMock()
    const hrEmployeeReferencePort = createHrEmployeeReferencePortMock()

    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1'
      })
    )
    userRepository.findById.mockResolvedValue(
      createUserSummaryFixture({
        id: 'user-1',
        partyId: 'party-1'
      })
    )
    hrEmployeeReferencePort.getEmployeeById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      partyId: 'party-1'
    })
    bindingRepository.findByAccountId.mockResolvedValue(null)
    bindingRepository.findByEmployeeId.mockResolvedValue(null)
    bindingRepository.bind.mockResolvedValue(
      new EmployeeBindingSummaryEntity('binding-1', 'tenant-1', 'account-1', 'employee-1')
    )

    const handler = new BindAccountToEmployeeHandler(
      accountRepository as unknown as AccountRepository,
      userRepository as unknown as UserRepository,
      bindingRepository as unknown as EmployeeBindingRepository,
      hrEmployeeReferencePort
    )

    await expect(
      handler.execute(
        new BindAccountToEmployeeCommand({
          tenantId: 'tenant-1',
          accountId: 'account-1',
          employeeId: 'employee-1'
        })
      )
    ).resolves.toMatchObject({
      id: 'binding-1',
      tenantId: 'tenant-1',
      accountId: 'account-1',
      employeeId: 'employee-1'
    })

    expect(bindingRepository.bind).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      accountId: 'account-1',
      employeeId: 'employee-1'
    })
  })

  it('rejects mismatched employee party binding instead of falling back to legacy org membership', async () => {
    const accountRepository = createAccountRepositoryMock()
    const userRepository = createUserRepositoryMock()
    const bindingRepository = createEmployeeBindingRepositoryMock()
    const hrEmployeeReferencePort = createHrEmployeeReferencePortMock()

    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1'
      })
    )
    userRepository.findById.mockResolvedValue(
      createUserSummaryFixture({
        id: 'user-1',
        partyId: 'party-1'
      })
    )
    hrEmployeeReferencePort.getEmployeeById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      partyId: 'party-2'
    })

    const handler = new BindAccountToEmployeeHandler(
      accountRepository as unknown as AccountRepository,
      userRepository as unknown as UserRepository,
      bindingRepository as unknown as EmployeeBindingRepository,
      hrEmployeeReferencePort
    )

    const error = await handler
      .execute(
        new BindAccountToEmployeeCommand({
          tenantId: 'tenant-1',
          accountId: 'account-1',
          employeeId: 'employee-1'
        })
      )
      .then(
        () => null,
        (reason) => reason
      )

    expect(error).toBeInstanceOf(OESExceptionBase)
    expect((error as OESExceptionBase).toRpcPayload()).toMatchObject({
      code: 'IDENTITY_EMPLOYEE_PARTY_MISMATCH',
      message: 'Employee party mismatch',
      grpcStatus: 9
    })

    expect(bindingRepository.bind).not.toHaveBeenCalled()
  })
})

describe('ResolveEmployeeLoginAccountHandler', () => {
  it('resolves the enabled tenant account bound to the employee', async () => {
    const accountRepository = createAccountRepositoryMock()
    const bindingRepository = createEmployeeBindingRepositoryMock()

    bindingRepository.findByEmployeeId.mockResolvedValue(
      new EmployeeBindingSummaryEntity('binding-1', 'tenant-1', 'account-1', 'employee-1')
    )
    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'PDA Operator',
        isEnabled: true
      })
    )

    const handler = new ResolveEmployeeLoginAccountHandler(
      bindingRepository as unknown as EmployeeBindingRepository,
      accountRepository as unknown as AccountRepository
    )

    await expect(
      handler.execute(
        new ResolveEmployeeLoginAccountQuery({
          tenantId: 'tenant-1',
          employeeId: 'employee-1'
        })
      )
    ).resolves.toEqual({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      displayName: 'PDA Operator',
      accountEnabled: true
    })
  })

  it('does not resolve an account when the binding tenant does not match the request tenant', async () => {
    const accountRepository = createAccountRepositoryMock()
    const bindingRepository = createEmployeeBindingRepositoryMock()

    bindingRepository.findByEmployeeId.mockResolvedValue(
      new EmployeeBindingSummaryEntity('binding-1', 'tenant-2', 'account-1', 'employee-1')
    )

    const handler = new ResolveEmployeeLoginAccountHandler(
      bindingRepository as unknown as EmployeeBindingRepository,
      accountRepository as unknown as AccountRepository
    )

    await expect(
      handler.execute(
        new ResolveEmployeeLoginAccountQuery({
          tenantId: 'tenant-1',
          employeeId: 'employee-1'
        })
      )
    ).resolves.toBeNull()

    expect(accountRepository.findById).not.toHaveBeenCalled()
  })

  it('resolves a disabled bound account with accountEnabled=false for caller-side audit', async () => {
    const accountRepository = createAccountRepositoryMock()
    const bindingRepository = createEmployeeBindingRepositoryMock()

    bindingRepository.findByEmployeeId.mockResolvedValue(
      new EmployeeBindingSummaryEntity('binding-1', 'tenant-1', 'account-1', 'employee-1')
    )
    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'PDA Operator',
        isEnabled: false
      })
    )

    const handler = new ResolveEmployeeLoginAccountHandler(
      bindingRepository as unknown as EmployeeBindingRepository,
      accountRepository as unknown as AccountRepository
    )

    await expect(
      handler.execute(
        new ResolveEmployeeLoginAccountQuery({
          tenantId: 'tenant-1',
          employeeId: 'employee-1'
        })
      )
    ).resolves.toEqual({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      displayName: 'PDA Operator',
      accountEnabled: false
    })
  })
})
