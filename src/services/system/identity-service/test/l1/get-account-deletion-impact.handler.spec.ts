import { GetAccountDeletionImpactHandler } from '../../src/application/queries/account/get-account-deletion-impact.handler'
import { GetAccountDeletionImpactQuery } from '../../src/application/queries/account/get-account-deletion-impact.query'
import {
  createAccountRepositoryMock,
  createAccountSummaryFixture
} from '../helpers/identity-fixtures'

describe('账号删除影响预检', () => {
  it('GetAccountDeletionImpactHandler / 当账号可删除时 / 应返回清理计划与 identity 级计数', async () => {
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
      orgMembershipCount: 1,
      contactAssetCount: 2,
      blockingReasons: []
    })

    const handler = new GetAccountDeletionImpactHandler(
      accountRepository,
      accountDeletionBlockerService as any,
      checkResourceService as any
    )

    const result = await handler.execute(
      new GetAccountDeletionImpactQuery('acc-1', {
        operatorId: 'operator-1',
        tenantId: 'tenant-1',
        isSystemScope: false
      } as any)
    )

    expect(accountRepository.getDeletionImpact).toHaveBeenCalledWith('acc-1')
    expect(accountDeletionBlockerService.getBlockingReasons).toHaveBeenCalledWith({
      accountId: 'acc-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
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
    expect(result).toEqual({
      accountId: 'acc-1',
      canDelete: true,
      userRetained: true,
      cleanupPlan: {
        willDeleteSessions: true,
        willClearRoles: true,
        willDeleteOrgMemberships: true,
        willDeleteContactAssets: true
      },
      blockingReasons: [],
      orgMembershipCount: 1,
      contactAssetCount: 2
    })
  })

  it('GetAccountDeletionImpactHandler / 当存在业务阻断时 / 应返回 blocker 列表', async () => {
    const accountRepository = createAccountRepositoryMock()
    const accountDeletionBlockerService = {
      getBlockingReasons: jest.fn().mockResolvedValue([
        {
          resourceType: 'sales_order_owner',
          resourceCount: 4,
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
        tenantId: 'tenant-2'
      }),
      orgMembershipCount: 0,
      contactAssetCount: 1,
      blockingReasons: []
    })

    const handler = new GetAccountDeletionImpactHandler(
      accountRepository,
      accountDeletionBlockerService as any,
      checkResourceService as any
    )

    await expect(
      handler.execute(new GetAccountDeletionImpactQuery('acc-2'))
    ).resolves.toMatchObject({
      accountId: 'acc-2',
      canDelete: false,
      blockingReasons: [
        {
          resourceType: 'sales_order_owner',
          resourceCount: 4,
          message: '账号仍有业务归属'
        }
      ]
    })
    expect(accountDeletionBlockerService.getBlockingReasons).toHaveBeenCalledWith({
      accountId: 'acc-2',
      userId: 'user-1',
      tenantId: 'tenant-2',
      scopeLevel: 'TENANT'
    })
  })
})
