import {
  IDENTITY_ACCOUNT_NOT_FOUND,
  IDENTITY_ACCOUNT_ORG_MEMBERSHIP_ALREADY_EXISTS,
  IDENTITY_ACCOUNT_ORG_MEMBERSHIP_NOT_FOUND,
  IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH,
  IDENTITY_ORG_NOT_FOUND,
  IDENTITY_PRIMARY_ORG_CANNOT_BE_REMOVED
} from '../../src/common/constants'
import { AccountOrgMembershipEntity } from '../../src/domain/entities/account-org-membership.entity'
import { AccountSummaryEntity } from '../../src/domain/entities/account-summary.entity'
import { OrgNodeEntity } from '../../src/domain/entities/org-node.entity'
import { AccountOrgMembershipRepository } from '../../src/domain/repositories/account-org-membership.repository'
import { AccountRepository } from '../../src/domain/repositories/account.repository'
import { OrgRepository } from '../../src/domain/repositories/org.repository'
import { AddAccountOrgMembershipCommand } from '../../src/application/commands/org/add-account-org-membership.command'
import { AddAccountOrgMembershipHandler } from '../../src/application/commands/org/add-account-org-membership.handler'
import { RemoveAccountOrgMembershipCommand } from '../../src/application/commands/org/remove-account-org-membership.command'
import { RemoveAccountOrgMembershipHandler } from '../../src/application/commands/org/remove-account-org-membership.handler'

describe('组织归属规则', () => {
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
  const secondaryMembership = new AccountOrgMembershipEntity(
    'mem-1',
    'acc-1',
    'org-1',
    'HQ',
    'DEPARTMENT',
    'SECONDARY',
    false
  )

  it('新增组织归属 / 当账户与组织不属于同一租户时 / 应返回 IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH', async () => {
    const accountRepository = createAccountRepository()
    const orgRepository = createOrgRepository()
    const membershipRepository = createMembershipRepository()
    accountRepository.findById.mockResolvedValue(account)
    orgRepository.findById.mockResolvedValue(
      new OrgNodeEntity('org-x', 'tenant-2', null, 'Other', null, 'DEPARTMENT', 1)
    )

    const handler = new AddAccountOrgMembershipHandler(
      accountRepository,
      orgRepository,
      membershipRepository
    )

    await expect(
      handler.execute(new AddAccountOrgMembershipCommand('acc-1', 'org-x', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH.code })
    })
  })

  it('新增组织归属 / 当归属关系已存在时 / 应返回 IDENTITY_ACCOUNT_ORG_MEMBERSHIP_ALREADY_EXISTS', async () => {
    const accountRepository = createAccountRepository()
    const orgRepository = createOrgRepository()
    const membershipRepository = createMembershipRepository()
    accountRepository.findById.mockResolvedValue(account)
    orgRepository.findById.mockResolvedValue(org)
    membershipRepository.findByAccountAndOrg.mockResolvedValue(secondaryMembership)

    const handler = new AddAccountOrgMembershipHandler(
      accountRepository,
      orgRepository,
      membershipRepository
    )

    await expect(
      handler.execute(new AddAccountOrgMembershipCommand('acc-1', 'org-1', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_ACCOUNT_ORG_MEMBERSHIP_ALREADY_EXISTS.code
      })
    })
  })

  it('新增组织归属 / 当账户不存在时 / 应返回 IDENTITY_ACCOUNT_NOT_FOUND', async () => {
    const accountRepository = createAccountRepository()
    const orgRepository = createOrgRepository()
    const membershipRepository = createMembershipRepository()
    accountRepository.findById.mockResolvedValue(null)

    const handler = new AddAccountOrgMembershipHandler(
      accountRepository,
      orgRepository,
      membershipRepository
    )

    await expect(
      handler.execute(new AddAccountOrgMembershipCommand('missing', 'org-1', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ACCOUNT_NOT_FOUND.code })
    })
  })

  it('新增组织归属 / 当组织不存在时 / 应返回 IDENTITY_ORG_NOT_FOUND', async () => {
    const accountRepository = createAccountRepository()
    const orgRepository = createOrgRepository()
    const membershipRepository = createMembershipRepository()
    accountRepository.findById.mockResolvedValue(account)
    orgRepository.findById.mockResolvedValue(null)

    const handler = new AddAccountOrgMembershipHandler(
      accountRepository,
      orgRepository,
      membershipRepository
    )

    await expect(
      handler.execute(new AddAccountOrgMembershipCommand('acc-1', 'missing-org', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ORG_NOT_FOUND.code })
    })
  })

  it('删除组织归属 / 当目标归属是主组织时 / 应返回 IDENTITY_PRIMARY_ORG_CANNOT_BE_REMOVED', async () => {
    const membershipRepository = createMembershipRepository()
    membershipRepository.findByAccountAndOrg.mockResolvedValue(
      new AccountOrgMembershipEntity('mem-2', 'acc-1', 'org-1', 'HQ', 'DEPARTMENT', 'PRIMARY', true)
    )

    const handler = new RemoveAccountOrgMembershipHandler(membershipRepository)

    await expect(
      handler.execute(new RemoveAccountOrgMembershipCommand('acc-1', 'org-1', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_PRIMARY_ORG_CANNOT_BE_REMOVED.code })
    })
  })

  it('删除组织归属 / 当归属关系不存在时 / 应返回 IDENTITY_ACCOUNT_ORG_MEMBERSHIP_NOT_FOUND', async () => {
    const membershipRepository = createMembershipRepository()
    membershipRepository.findByAccountAndOrg.mockResolvedValue(null)

    const handler = new RemoveAccountOrgMembershipHandler(membershipRepository)

    await expect(
      handler.execute(new RemoveAccountOrgMembershipCommand('acc-1', 'missing-org', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_ACCOUNT_ORG_MEMBERSHIP_NOT_FOUND.code
      })
    })
  })
})
