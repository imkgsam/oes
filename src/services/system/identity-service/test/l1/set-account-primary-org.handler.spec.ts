import {
  IDENTITY_ACCOUNT_NOT_FOUND,
  IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH,
  IDENTITY_ORG_NOT_FOUND
} from '../../src/common/constants'
import { CheckResourceService } from '../../src/application/authorization'
import { SetAccountPrimaryOrgCommand } from '../../src/application/commands/org/set-account-primary-org.command'
import { SetAccountPrimaryOrgHandler } from '../../src/application/commands/org/set-account-primary-org.handler'
import {
  createAccountOrgMembershipFixture,
  createAccountOrgMembershipRepositoryMock,
  createAccountRepositoryMock,
  createAccountSummaryFixture,
  createOrgNodeFixture,
  createOrgRepositoryMock
} from '../helpers/identity-fixtures'

describe('设置主组织', () => {
  const account = createAccountSummaryFixture()
  const checkResourceService = new CheckResourceService()
  const org = createOrgNodeFixture()
  const primaryMembership = createAccountOrgMembershipFixture({
    relationType: 'PRIMARY',
    isPrimary: true
  })

  it('设置主组织 / 当未传 orgId 时 / 应清空当前主组织', async () => {
    const accountRepository = createAccountRepositoryMock()
    const orgRepository = createOrgRepositoryMock()
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    accountRepository.findById.mockResolvedValue(account)

    const handler = new SetAccountPrimaryOrgHandler(
      accountRepository,
      orgRepository,
      membershipRepository,
      checkResourceService
    )

    const result = await handler.execute(new SetAccountPrimaryOrgCommand('acc-1', undefined, 'op-1'))

    expect(membershipRepository.clearPrimaryByAccountId).toHaveBeenCalledWith('acc-1')
    expect(result).toBeNull()
  })

  it('设置主组织 / 当账户不存在时 / 应返回 IDENTITY_ACCOUNT_NOT_FOUND', async () => {
    const accountRepository = createAccountRepositoryMock()
    const orgRepository = createOrgRepositoryMock()
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    accountRepository.findById.mockResolvedValue(null)

    const handler = new SetAccountPrimaryOrgHandler(
      accountRepository,
      orgRepository,
      membershipRepository,
      checkResourceService
    )

    await expect(
      handler.execute(new SetAccountPrimaryOrgCommand('missing-account', 'org-1', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ACCOUNT_NOT_FOUND.code })
    })
  })

  it('设置主组织 / 当组织不存在时 / 应返回 IDENTITY_ORG_NOT_FOUND', async () => {
    const accountRepository = createAccountRepositoryMock()
    const orgRepository = createOrgRepositoryMock()
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    accountRepository.findById.mockResolvedValue(account)
    orgRepository.findById.mockResolvedValue(null)

    const handler = new SetAccountPrimaryOrgHandler(
      accountRepository,
      orgRepository,
      membershipRepository,
      checkResourceService
    )

    await expect(
      handler.execute(new SetAccountPrimaryOrgCommand('acc-1', 'missing-org', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ORG_NOT_FOUND.code })
    })
  })

  it('设置主组织 / 当组织与账户不属于同一租户时 / 应返回 IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH', async () => {
    const accountRepository = createAccountRepositoryMock()
    const orgRepository = createOrgRepositoryMock()
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    accountRepository.findById.mockResolvedValue(account)
    orgRepository.findById.mockResolvedValue(
      createOrgNodeFixture({
        id: 'org-x',
        tenantId: 'tenant-2',
        name: 'Other'
      })
    )

    const handler = new SetAccountPrimaryOrgHandler(
      accountRepository,
      orgRepository,
      membershipRepository,
      checkResourceService
    )

    await expect(
      handler.execute(new SetAccountPrimaryOrgCommand('acc-1', 'org-x', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH.code })
    })
  })

  it('设置主组织 / 当组织与账户属于同一租户时 / 应写入新的主组织', async () => {
    const accountRepository = createAccountRepositoryMock()
    const orgRepository = createOrgRepositoryMock()
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    accountRepository.findById.mockResolvedValue(account)
    orgRepository.findById.mockResolvedValue(org)
    membershipRepository.setPrimaryOrg.mockResolvedValue(primaryMembership)

    const handler = new SetAccountPrimaryOrgHandler(
      accountRepository,
      orgRepository,
      membershipRepository,
      checkResourceService
    )

    const result = await handler.execute(new SetAccountPrimaryOrgCommand('acc-1', 'org-1', 'op-1'))

    expect(membershipRepository.setPrimaryOrg).toHaveBeenCalledWith('acc-1', 'org-1')
    expect(result).toBe(primaryMembership)
  })
})
