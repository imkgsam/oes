import { CheckResourceService } from '../../src/application/authorization'
import { CreateUserAccountCommand } from '../../src/application/commands/account/create-user-account.command'
import { CreateUserAccountHandler } from '../../src/application/commands/account/create-user-account.handler'
import {
  createAccountRepositoryMock,
  createAccountSummaryFixture,
  createUserRepositoryMock,
  createUserSummaryFixture
} from '../helpers/identity-fixtures'

describe('CreateUserAccountHandler', () => {
  it('creates a tenant account inside the operator tenant boundary', async () => {
    const accountRepository = createAccountRepositoryMock()
    const userRepository = createUserRepositoryMock()
    userRepository.findByEmail.mockResolvedValue(null)
    userRepository.findByPhone.mockResolvedValue(null)
    userRepository.create.mockResolvedValue(
      createUserSummaryFixture({
        id: 'user-1',
        personalEmail: 'janny@example.com',
        personalPhone: '+8613800138000'
      })
    )
    accountRepository.createUserAccount.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-a',
        scopeLevel: 'TENANT',
        displayName: 'Janny'
      })
    )

    const handler = new CreateUserAccountHandler(
      accountRepository,
      userRepository,
      new CheckResourceService()
    )

    await expect(
      handler.execute(
        new CreateUserAccountCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-a',
          displayName: 'Janny',
          email: 'janny@example.com',
          phone: '+8613800138000',
          operatorId: 'operator-1',
          operatorScope: {
            operatorId: 'operator-1',
            tenantId: 'tenant-a'
          } as any
        })
      )
    ).resolves.toMatchObject({
      id: 'account-1',
      userId: 'user-1',
      tenantId: 'tenant-a',
      scopeLevel: 'TENANT',
      isEnabled: true
    })

    expect(userRepository.create).toHaveBeenCalledWith({
      email: 'janny@example.com',
      isActive: true,
      phone: '+8613800138000',
      username: undefined
    })
    expect(accountRepository.createUserAccount).toHaveBeenCalledWith({
      displayName: 'Janny',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-a',
      userId: 'user-1'
    })
  })

  it('rejects tenant operators attempting to create system-scope accounts', async () => {
    const handler = new CreateUserAccountHandler(
      createAccountRepositoryMock(),
      createUserRepositoryMock(),
      new CheckResourceService()
    )

    await expect(
      handler.execute(
        new CreateUserAccountCommand({
          scopeLevel: 'SYSTEM',
          displayName: 'System User',
          email: 'system@example.com',
          operatorId: 'operator-1',
          operatorScope: {
            operatorId: 'operator-1',
            tenantId: 'tenant-a'
          } as any
        })
      )
    ).rejects.toThrow()
  })

  it('rejects phone numbers that are not already normalized to the login-page phone format', async () => {
    const handler = new CreateUserAccountHandler(
      createAccountRepositoryMock(),
      createUserRepositoryMock(),
      new CheckResourceService()
    )

    await expect(
      handler.execute(
        new CreateUserAccountCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-a',
          displayName: 'Janny',
          phone: '13800138000',
          operatorId: 'operator-1',
          operatorScope: {
            operatorId: 'operator-1',
            tenantId: 'tenant-a'
          } as any
        })
      )
    ).rejects.toThrow()
  })
})
