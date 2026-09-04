import { UpdateAccountProfileCommand } from '../application/commands/account/update-account-profile.command'
import { UpdateAccountProfileHandler } from '../application/commands/account/update-account-profile.handler'
import {
  createAccountRepositoryMock,
  createAccountSummaryFixture
} from '../../test/helpers/identity-fixtures'

describe('更新账户资料', () => {
  it('UpdateAccountProfileHandler / 当更新账户资料时 / 应调用 repository.updateProfile 完成持久化', async () => {
    const accountRepository = createAccountRepositoryMock()
    const checkResourceService = {
      checkAccount: jest.fn()
    }
    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'acc-1',
        tenantId: 'tenant-1',
        displayName: 'current display'
      })
    )
    accountRepository.updateProfile.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'acc-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        displayName: 'updated display'
      })
    )

    const handler = new UpdateAccountProfileHandler(
      accountRepository,
      checkResourceService as any
    )
    const result = await handler.execute(
      new UpdateAccountProfileCommand('acc-1', {
        avatarAssetId: 'asset-1',
        displayName: 'updated display',
        bio: 'updated bio'
      })
    )

    expect(accountRepository.updateProfile).toHaveBeenCalledWith('acc-1', {
      avatarAssetId: 'asset-1',
      displayName: 'updated display',
      bio: 'updated bio'
    })
    expect(checkResourceService.checkAccount).toHaveBeenCalledWith(undefined, {
      resourceId: 'acc-1',
      tenantId: 'tenant-1'
    })
    expect(result).toMatchObject({
      id: 'acc-1',
      tenantId: 'tenant-1',
      displayName: 'updated display'
    })
  })
})
