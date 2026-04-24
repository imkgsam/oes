import { DeleteAccountCommand } from '../../src/application/commands/account/delete-account.command'
import { DeleteAccountHandler } from '../../src/application/commands/account/delete-account.handler'
import {
  createAccountRepositoryMock,
  createAccountSummaryFixture
} from '../helpers/identity-fixtures'

describe('账号删除', () => {
  it('DeleteAccountHandler / 当删除一个租户账号时 / 应只删除 account 并返回 identity 级清理计数', async () => {
    const accountRepository = createAccountRepositoryMock()
    const accountDeletionBlockerService = {
      getBlockingReasons: jest.fn().mockResolvedValue([])
    }
    const checkResourceService = {
      checkAccount: jest.fn()
    }

    accountRepository.getDeletionImpact.mockResolvedValue({
      account: createAccountSummaryFixture({
        id: 'acc-1',
        userId: 'user-1',
        tenantId: 'tenant-1'
      }),
      orgMembershipCount: 2,
      contactAssetCount: 1,
      blockingReasons: []
    })
    accountRepository.delete.mockResolvedValue({
      deletedOrgMembershipCount: 2,
      deletedContactAssetCount: 1
    })

    const handler = new DeleteAccountHandler(
      accountRepository,
      accountDeletionBlockerService as any,
      checkResourceService as any
    )
    const result = await handler.execute(
      new DeleteAccountCommand('acc-1', {
        operatorId: 'operator-1',
        operatorScope: {
          operatorId: 'operator-1',
          tenantId: 'tenant-1',
          isSystemScope: false
        } as any
      })
    )

    expect(checkResourceService.checkAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        operatorId: 'operator-1',
        tenantId: 'tenant-1',
        isSystemScope: false
      }),
      {
        resourceId: 'acc-1',
        tenantId: 'tenant-1'
      }
    )
    expect(accountDeletionBlockerService.getBlockingReasons).toHaveBeenCalledWith({
      accountId: 'acc-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
    expect(accountRepository.delete).toHaveBeenCalledWith('acc-1')
    expect(result).toEqual({
      accountId: 'acc-1',
      deletedOrgMembershipCount: 2,
      deletedContactAssetCount: 1,
      userRetained: true
    })
  })

  it('DeleteAccountHandler / 当存在业务阻断时 / 应拒绝最终删除而不是只依赖预检', async () => {
    const accountRepository = createAccountRepositoryMock()
    const accountDeletionBlockerService = {
      getBlockingReasons: jest.fn().mockResolvedValue([
        {
          resourceType: 'sales_order_owner',
          resourceCount: 2,
          message: '账号仍有业务归属'
        }
      ])
    }
    const checkResourceService = {
      checkAccount: jest.fn()
    }

    accountRepository.getDeletionImpact.mockResolvedValue({
      account: createAccountSummaryFixture({
        id: 'acc-2',
        userId: 'user-2',
        tenantId: 'tenant-2'
      }),
      orgMembershipCount: 0,
      contactAssetCount: 0,
      blockingReasons: []
    })

    const handler = new DeleteAccountHandler(
      accountRepository,
      accountDeletionBlockerService as any,
      checkResourceService as any
    )

    await expect(
      handler.execute(
        new DeleteAccountCommand('acc-2', {
          operatorId: 'operator-1',
          operatorScope: {
            operatorId: 'operator-1',
            tenantId: 'tenant-2',
            isSystemScope: false
          } as any
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: 'IDENTITY_ACCOUNT_DELETE_BLOCKED'
      })
    })
    expect(accountRepository.delete).not.toHaveBeenCalled()
  })
})
