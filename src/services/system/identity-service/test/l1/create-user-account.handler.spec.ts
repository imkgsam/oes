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
    const partyRegistrationPort = {
      registerPersonParty: jest.fn().mockResolvedValue({
        partyId: 'party-1',
        tenantPartyId: 'tenant-party-1',
      }),
    }
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
      new CheckResourceService(),
      partyRegistrationPort as any,
    ) as any

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
      partyId: 'party-1',
      phone: '+8613800138000',
      username: undefined
    })
    expect(partyRegistrationPort.registerPersonParty).toHaveBeenCalledWith(
      expect.objectContaining({
        canonicalName: 'Janny',
        localDisplayName: 'Janny',
        tenantId: 'tenant-a',
      }),
    )
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
      new CheckResourceService(),
      { registerPersonParty: jest.fn() } as any,
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
      new CheckResourceService(),
      { registerPersonParty: jest.fn() } as any,
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

  it('creates a system account and registers a canonical person party without a tenant binding', async () => {
    const accountRepository = createAccountRepositoryMock()
    const userRepository = createUserRepositoryMock()
    const partyRegistrationPort = {
      registerPersonParty: jest.fn().mockResolvedValue({
        partyId: 'party-system-1',
      }),
    }
    userRepository.findByEmail.mockResolvedValue(null)
    userRepository.findByPhone.mockResolvedValue(null)
    userRepository.create.mockResolvedValue(
      createUserSummaryFixture({
        id: 'user-system-1',
        personalEmail: 'system@example.com',
        personalPhone: null,
      }),
    )
    accountRepository.createUserAccount.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'account-system-1',
        userId: 'user-system-1',
        tenantId: null as any,
        scopeLevel: 'SYSTEM',
        displayName: 'Platform Operator',
      }),
    )

    const handler = new CreateUserAccountHandler(
      accountRepository,
      userRepository,
      new CheckResourceService(),
      partyRegistrationPort as any,
    ) as any

    await expect(
      handler.execute(
        new CreateUserAccountCommand({
          scopeLevel: 'SYSTEM',
          displayName: 'Platform Operator',
          email: 'system@example.com',
          operatorId: 'operator-system',
          operatorScope: {
            operatorId: 'operator-system',
            isSystemScope: true,
          } as any,
        }),
      ),
    ).resolves.toMatchObject({
      id: 'account-system-1',
      userId: 'user-system-1',
      scopeLevel: 'SYSTEM',
    })

    expect(partyRegistrationPort.registerPersonParty).toHaveBeenCalledWith(
      expect.objectContaining({
        canonicalName: 'Platform Operator',
        localDisplayName: 'Platform Operator',
        tenantId: undefined,
      }),
    )
    expect(userRepository.create).toHaveBeenCalledWith({
      email: 'system@example.com',
      isActive: true,
      partyId: 'party-system-1',
      phone: undefined,
      username: undefined,
    })
  })
})
