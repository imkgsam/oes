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
      registerTenantParty: jest.fn().mockResolvedValue({
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
      phone: '+8613800138000',
      username: undefined
    })
    expect(partyRegistrationPort.registerTenantParty).toHaveBeenCalledWith(
      expect.objectContaining({
        legalName: 'Janny',
        displayName: 'Janny',
        tenantId: 'tenant-a',
      }),
    )
    expect(accountRepository.createUserAccount).toHaveBeenCalledWith({
      displayName: 'Janny',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-a',
      tenantPartyId: 'tenant-party-1',
      userId: 'user-1'
    })
  })

  it('creates a tenant account with an upstream tenantPartyId without registering another tenant party', async () => {
    const accountRepository = createAccountRepositoryMock()
    const userRepository = createUserRepositoryMock()
    const partyRegistrationPort = {
      registerTenantParty: jest.fn()
    }
    userRepository.findByEmail.mockResolvedValue(null)
    userRepository.findByPhone.mockResolvedValue(null)
    userRepository.create.mockResolvedValue(
      createUserSummaryFixture({
        id: 'user-1',
        personalEmail: 'janny@example.com'
      })
    )
    accountRepository.createUserAccount.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-a',
        tenantPartyId: 'tenant-party-from-hr',
        scopeLevel: 'TENANT',
        displayName: 'Janny'
      })
    )

    const handler = new CreateUserAccountHandler(
      accountRepository,
      userRepository,
      new CheckResourceService(),
      partyRegistrationPort as any
    ) as any

    await expect(
      handler.execute(
        new CreateUserAccountCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-a',
          tenantPartyId: 'tenant-party-from-hr',
          displayName: 'Janny',
          email: 'janny@example.com',
          operatorId: 'operator-1',
          operatorScope: {
            operatorId: 'operator-1',
            tenantId: 'tenant-a'
          } as any
        })
      )
    ).resolves.toMatchObject({
      id: 'account-1',
      tenantPartyId: 'tenant-party-from-hr'
    })

    expect(partyRegistrationPort.registerTenantParty).not.toHaveBeenCalled()
    expect(accountRepository.createUserAccount).toHaveBeenCalledWith({
      displayName: 'Janny',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-a',
      tenantPartyId: 'tenant-party-from-hr',
      userId: 'user-1'
    })
  })

  it('creates a tenant account for an existing user without creating another user', async () => {
    const accountRepository = createAccountRepositoryMock()
    const userRepository = createUserRepositoryMock()
    const partyRegistrationPort = {
      registerTenantParty: jest.fn().mockResolvedValue({
        tenantPartyId: 'tenant-party-system-admin'
      })
    }
    userRepository.findById.mockResolvedValue(
      createUserSummaryFixture({
        id: 'user-system-admin',
        personalEmail: 'sysadmin@example.com'
      })
    )
    accountRepository.findByUserScope.mockResolvedValue(null)
    accountRepository.createUserAccount.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'tenant-account-1',
        userId: 'user-system-admin',
        tenantId: 'tenant-a',
        tenantPartyId: 'tenant-party-system-admin',
        scopeLevel: 'TENANT',
        displayName: 'System Admin'
      })
    )

    const handler = new CreateUserAccountHandler(
      accountRepository,
      userRepository,
      new CheckResourceService(),
      partyRegistrationPort as any
    ) as any

    await expect(
      handler.execute(
        new CreateUserAccountCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-a',
          displayName: 'System Admin',
          existingUserId: 'user-system-admin',
          operatorId: 'platform-account-1',
          operatorScope: {
            operatorId: 'platform-account-1',
            isSystemScope: true
          } as any
        })
      )
    ).resolves.toMatchObject({
      id: 'tenant-account-1',
      userId: 'user-system-admin',
      tenantId: 'tenant-a',
      scopeLevel: 'TENANT',
      tenantPartyId: 'tenant-party-system-admin'
    })

    expect(userRepository.create).not.toHaveBeenCalled()
    expect(partyRegistrationPort.registerTenantParty).toHaveBeenCalledWith(
      expect.objectContaining({
        legalName: 'System Admin',
        displayName: 'System Admin',
        tenantId: 'tenant-a',
      })
    )
    expect(accountRepository.createUserAccount).toHaveBeenCalledWith({
      displayName: 'System Admin',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-a',
      tenantPartyId: 'tenant-party-system-admin',
      userId: 'user-system-admin'
    })
  })

  it('creates a tenant account for an existing user with an upstream tenantPartyId without registering another tenant party', async () => {
    const accountRepository = createAccountRepositoryMock()
    const userRepository = createUserRepositoryMock()
    const partyRegistrationPort = {
      registerTenantParty: jest.fn()
    }
    userRepository.findById.mockResolvedValue(
      createUserSummaryFixture({
        id: 'user-system-admin',
        personalEmail: 'sysadmin@example.com'
      })
    )
    accountRepository.findByUserScope.mockResolvedValue(null)
    accountRepository.createUserAccount.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'tenant-account-1',
        userId: 'user-system-admin',
        tenantId: 'tenant-a',
        tenantPartyId: 'tenant-party-from-hr',
        scopeLevel: 'TENANT',
        displayName: 'System Admin'
      })
    )

    const handler = new CreateUserAccountHandler(
      accountRepository,
      userRepository,
      new CheckResourceService(),
      partyRegistrationPort as any
    ) as any

    await expect(
      handler.execute(
        new CreateUserAccountCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-a',
          tenantPartyId: 'tenant-party-from-hr',
          displayName: 'System Admin',
          existingUserId: 'user-system-admin',
          operatorId: 'platform-account-1',
          operatorScope: {
            operatorId: 'platform-account-1',
            isSystemScope: true
          } as any
        })
      )
    ).resolves.toMatchObject({
      id: 'tenant-account-1',
      tenantPartyId: 'tenant-party-from-hr'
    })

    expect(userRepository.create).not.toHaveBeenCalled()
    expect(partyRegistrationPort.registerTenantParty).not.toHaveBeenCalled()
    expect(accountRepository.createUserAccount).toHaveBeenCalledWith({
      displayName: 'System Admin',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-a',
      tenantPartyId: 'tenant-party-from-hr',
      userId: 'user-system-admin'
    })
  })

  it('reuses an existing tenant account when binding an existing user is retried', async () => {
    const accountRepository = createAccountRepositoryMock()
    const userRepository = createUserRepositoryMock()
    const partyRegistrationPort = {
      registerTenantParty: jest.fn().mockResolvedValue({
        tenantPartyId: 'tenant-party-system-admin'
      })
    }
    userRepository.findById.mockResolvedValue(
      createUserSummaryFixture({
        id: 'user-system-admin'
      })
    )
    accountRepository.findByUserScope.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'tenant-account-1',
        userId: 'user-system-admin',
        tenantId: 'tenant-a',
        tenantPartyId: 'tenant-party-system-admin',
        scopeLevel: 'TENANT',
        displayName: 'System Admin'
      })
    )

    const handler = new CreateUserAccountHandler(
      accountRepository,
      userRepository,
      new CheckResourceService(),
      partyRegistrationPort as any
    ) as any

    await expect(
      handler.execute(
        new CreateUserAccountCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-a',
          displayName: 'System Admin',
          existingUserId: 'user-system-admin',
          operatorId: 'platform-account-1',
          operatorScope: {
            operatorId: 'platform-account-1',
            isSystemScope: true
          } as any
        })
      )
    ).resolves.toMatchObject({
      id: 'tenant-account-1',
      userId: 'user-system-admin',
      tenantId: 'tenant-a',
      tenantPartyId: 'tenant-party-system-admin'
    })

    expect(accountRepository.createUserAccount).not.toHaveBeenCalled()
    expect(partyRegistrationPort.registerTenantParty).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-a'
      })
    )
  })

  it('rejects tenant operators attempting to create system-scope accounts', async () => {
    const handler = new CreateUserAccountHandler(
      createAccountRepositoryMock(),
      createUserRepositoryMock(),
      new CheckResourceService(),
      { registerTenantParty: jest.fn() } as any,
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
      { registerTenantParty: jest.fn() } as any,
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

  it('creates a system account without registering a tenant party', async () => {
    const accountRepository = createAccountRepositoryMock()
    const userRepository = createUserRepositoryMock()
    const partyRegistrationPort = {
      registerTenantParty: jest.fn()
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

    expect(partyRegistrationPort.registerTenantParty).not.toHaveBeenCalled()
    expect(userRepository.create).toHaveBeenCalledWith({
      email: 'system@example.com',
      isActive: true,
      phone: undefined,
      username: undefined,
    })
  })
})
