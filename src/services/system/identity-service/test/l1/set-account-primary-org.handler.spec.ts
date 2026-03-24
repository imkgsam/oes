import {
  IDENTITY_ACCOUNT_NOT_FOUND,
  IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH,
  IDENTITY_ORG_NOT_FOUND
} from '../../src/common/constants'
import { AccountOrgMembershipEntity } from '../../src/domain/entities/account-org-membership.entity'
import { AccountSummaryEntity } from '../../src/domain/entities/account-summary.entity'
import { OrgNodeEntity } from '../../src/domain/entities/org-node.entity'
import { AccountOrgMembershipRepository } from '../../src/domain/repositories/account-org-membership.repository'
import { AccountRepository } from '../../src/domain/repositories/account.repository'
import { OrgRepository } from '../../src/domain/repositories/org.repository'
import { SetAccountPrimaryOrgCommand } from '../../src/application/commands/org/set-account-primary-org.command'
import { SetAccountPrimaryOrgHandler } from '../../src/application/commands/org/set-account-primary-org.handler'

describe('设置主组织', () => {
  const createAccountRepository = (): jest.Mocked<AccountRepository> =>
    ({
      findAvailableByUserId: jest.fn(),
      findById: jest.fn()
    }) as unknown as jest.Mocked<AccountRepository>

  const createOrgRepository = (): jest.Mocked<OrgRepository> =>
    ({
      findById: jest.fn(),
      findTreeByTenantId: jest.fn()
    }) as unknown as jest.Mocked<OrgRepository>

  const createMembershipRepository = (): jest.Mocked<AccountOrgMembershipRepository> =>
    ({
      clearPrimaryByAccountId: jest.fn(),
      findByAccountAndOrg: jest.fn(),
      listByAccountId: jest.fn(),
      addSecondaryMembership: jest.fn(),
      removeMembership: jest.fn(),
      setPrimaryOrg: jest.fn()
    }) as unknown as jest.Mocked<AccountOrgMembershipRepository>

  const account = new AccountSummaryEntity('acc-1', 'user-1', 'tenant-1', 'demo', true)
  const org = new OrgNodeEntity('org-1', 'tenant-1', null, 'HQ', null, 'DEPARTMENT', 1)
  const primaryMembership = new AccountOrgMembershipEntity(
    'mem-1',
    'acc-1',
    'org-1',
    'HQ',
    'DEPARTMENT',
    'PRIMARY',
    true
  )

  it('设置主组织 / 当未传 orgId 时 / 应清空当前主组织', async () => {
    const accountRepository = createAccountRepository()
    const orgRepository = createOrgRepository()
    const membershipRepository = createMembershipRepository()
    accountRepository.findById.mockResolvedValue(account)

    const handler = new SetAccountPrimaryOrgHandler(
      accountRepository,
      orgRepository,
      membershipRepository
    )

    const result = await handler.execute(new SetAccountPrimaryOrgCommand('acc-1', undefined, 'op-1'))

    expect(membershipRepository.clearPrimaryByAccountId).toHaveBeenCalledWith('acc-1')
    expect(result).toBeNull()
  })

  it('设置主组织 / 当账户不存在时 / 应返回 IDENTITY_ACCOUNT_NOT_FOUND', async () => {
    const accountRepository = createAccountRepository()
    const orgRepository = createOrgRepository()
    const membershipRepository = createMembershipRepository()
    accountRepository.findById.mockResolvedValue(null)

    const handler = new SetAccountPrimaryOrgHandler(
      accountRepository,
      orgRepository,
      membershipRepository
    )

    await expect(
      handler.execute(new SetAccountPrimaryOrgCommand('missing-account', 'org-1', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ACCOUNT_NOT_FOUND.code })
    })
  })

  it('设置主组织 / 当组织不存在时 / 应返回 IDENTITY_ORG_NOT_FOUND', async () => {
    const accountRepository = createAccountRepository()
    const orgRepository = createOrgRepository()
    const membershipRepository = createMembershipRepository()
    accountRepository.findById.mockResolvedValue(account)
    orgRepository.findById.mockResolvedValue(null)

    const handler = new SetAccountPrimaryOrgHandler(
      accountRepository,
      orgRepository,
      membershipRepository
    )

    await expect(
      handler.execute(new SetAccountPrimaryOrgCommand('acc-1', 'missing-org', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ORG_NOT_FOUND.code })
    })
  })

  it('设置主组织 / 当组织与账户不属于同一租户时 / 应返回 IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH', async () => {
    const accountRepository = createAccountRepository()
    const orgRepository = createOrgRepository()
    const membershipRepository = createMembershipRepository()
    accountRepository.findById.mockResolvedValue(account)
    orgRepository.findById.mockResolvedValue(
      new OrgNodeEntity('org-x', 'tenant-2', null, 'Other', null, 'DEPARTMENT', 1)
    )

    const handler = new SetAccountPrimaryOrgHandler(
      accountRepository,
      orgRepository,
      membershipRepository
    )

    await expect(
      handler.execute(new SetAccountPrimaryOrgCommand('acc-1', 'org-x', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH.code })
    })
  })

  it('设置主组织 / 当组织与账户属于同一租户时 / 应写入新的主组织', async () => {
    const accountRepository = createAccountRepository()
    const orgRepository = createOrgRepository()
    const membershipRepository = createMembershipRepository()
    accountRepository.findById.mockResolvedValue(account)
    orgRepository.findById.mockResolvedValue(org)
    membershipRepository.setPrimaryOrg.mockResolvedValue(primaryMembership)

    const handler = new SetAccountPrimaryOrgHandler(
      accountRepository,
      orgRepository,
      membershipRepository
    )

    const result = await handler.execute(new SetAccountPrimaryOrgCommand('acc-1', 'org-1', 'op-1'))

    expect(membershipRepository.setPrimaryOrg).toHaveBeenCalledWith('acc-1', 'org-1')
    expect(result).toBe(primaryMembership)
  })
})
