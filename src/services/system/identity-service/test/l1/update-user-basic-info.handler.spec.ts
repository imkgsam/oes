import { CheckResourceService } from '../../src/application/authorization'
import { UpdateUserBasicInfoCommand } from '../../src/application/commands/account/update-user-basic-info.command'
import { UpdateUserBasicInfoHandler } from '../../src/application/commands/account/update-user-basic-info.handler'
import {
  createAccountRepositoryMock,
  createAccountSummaryFixture,
  createUserRepositoryMock,
  createUserSummaryFixture
} from '../helpers/identity-fixtures'

describe('UpdateUserBasicInfoHandler', () => {
  it('updates one user personal email and canonical phone after uniqueness checks pass', async () => {
    const accountRepository = createAccountRepositoryMock()
    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1'
      })
    )
    const userRepository = createUserRepositoryMock()
    userRepository.findById.mockResolvedValue(
      createUserSummaryFixture({
        id: 'user-1',
        personalEmail: 'old@example.com',
        personalPhone: '+8613800138000'
      })
    )
    userRepository.findByEmail.mockResolvedValue(null)
    userRepository.findByPhone.mockResolvedValue(null)
    userRepository.updateBasicInfo.mockResolvedValue(
      createUserSummaryFixture({
        id: 'user-1',
        personalEmail: 'new@example.com',
        personalPhone: '+8613900139000'
      })
    )

    const handler = new UpdateUserBasicInfoHandler(
      accountRepository,
      userRepository,
      new CheckResourceService()
    )

    await expect(
      handler.execute(
        new UpdateUserBasicInfoCommand({
          accountId: 'account-1',
          userId: 'user-1',
          email: 'new@example.com',
          phone: '+8613900139000'
        })
      )
    ).resolves.toMatchObject({
      id: 'user-1',
      personalEmail: 'new@example.com',
      personalPhone: '+8613900139000'
    })

    expect(userRepository.updateBasicInfo).toHaveBeenCalledWith('user-1', {
      email: 'new@example.com',
      phone: '+8613900139000'
    })
  })

  it('rejects phone numbers that are not already normalized to the login-page phone format', async () => {
    const accountRepository = createAccountRepositoryMock()
    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1'
      })
    )
    const userRepository = createUserRepositoryMock()
    userRepository.findById.mockResolvedValue(
      createUserSummaryFixture({
        id: 'user-1'
      })
    )

    const handler = new UpdateUserBasicInfoHandler(
      accountRepository,
      userRepository,
      new CheckResourceService()
    )

    await expect(
      handler.execute(
        new UpdateUserBasicInfoCommand({
          accountId: 'account-1',
          userId: 'user-1',
          phone: '13800138000'
        })
      )
    ).rejects.toThrow()
  })
})
