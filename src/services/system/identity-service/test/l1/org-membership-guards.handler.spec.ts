import { ACCESS_DENIED } from '@oes/common/exceptions'
import {
  IDENTITY_ACCOUNT_NOT_FOUND,
  IDENTITY_ACCOUNT_ORG_MEMBERSHIP_ALREADY_EXISTS,
  IDENTITY_ACCOUNT_ORG_MEMBERSHIP_NOT_FOUND,
  IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH,
  IDENTITY_ORG_NOT_FOUND,
  IDENTITY_PRIMARY_ORG_CANNOT_BE_REMOVED
} from '../../src/common/constants'
import { CheckResourceService } from '../../src/application/authorization'
import { AddAccountOrgMembershipCommand } from '../../src/application/commands/org/add-account-org-membership.command'
import { AddAccountOrgMembershipHandler } from '../../src/application/commands/org/add-account-org-membership.handler'
import { RemoveAccountOrgMembershipCommand } from '../../src/application/commands/org/remove-account-org-membership.command'
import { RemoveAccountOrgMembershipHandler } from '../../src/application/commands/org/remove-account-org-membership.handler'
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

describe('组织归属规则', () => {
  const account = createAccountSummaryFixture()
  const checkResourceService = new CheckResourceService()
  const org = createOrgNodeFixture()
  const secondaryMembership = createAccountOrgMembershipFixture()

  it('新增组织归属 / 当账户与组织不属于同一租户时 / 应返回 IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH', async () => {
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

    const handler = new AddAccountOrgMembershipHandler(
      accountRepository,
      orgRepository,
      membershipRepository,
      checkResourceService
    )

    await expect(
      handler.execute(new AddAccountOrgMembershipCommand('acc-1', 'org-x', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH.code })
    })
  })

  it('新增组织归属 / 当归属关系已存在时 / 应返回 IDENTITY_ACCOUNT_ORG_MEMBERSHIP_ALREADY_EXISTS', async () => {
    const accountRepository = createAccountRepositoryMock()
    const orgRepository = createOrgRepositoryMock()
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    accountRepository.findById.mockResolvedValue(account)
    orgRepository.findById.mockResolvedValue(org)
    membershipRepository.findByAccountAndOrg.mockResolvedValue(secondaryMembership)

    const handler = new AddAccountOrgMembershipHandler(
      accountRepository,
      orgRepository,
      membershipRepository,
      checkResourceService
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
    const accountRepository = createAccountRepositoryMock()
    const orgRepository = createOrgRepositoryMock()
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    accountRepository.findById.mockResolvedValue(null)

    const handler = new AddAccountOrgMembershipHandler(
      accountRepository,
      orgRepository,
      membershipRepository,
      checkResourceService
    )

    await expect(
      handler.execute(new AddAccountOrgMembershipCommand('missing', 'org-1', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ACCOUNT_NOT_FOUND.code })
    })
  })

  it('新增组织归属 / 当组织不存在时 / 应返回 IDENTITY_ORG_NOT_FOUND', async () => {
    const accountRepository = createAccountRepositoryMock()
    const orgRepository = createOrgRepositoryMock()
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    accountRepository.findById.mockResolvedValue(account)
    orgRepository.findById.mockResolvedValue(null)

    const handler = new AddAccountOrgMembershipHandler(
      accountRepository,
      orgRepository,
      membershipRepository,
      checkResourceService
    )

    await expect(
      handler.execute(new AddAccountOrgMembershipCommand('acc-1', 'missing-org', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ORG_NOT_FOUND.code })
    })
  })

  it('删除组织归属 / 当目标归属是主组织时 / 应返回 IDENTITY_PRIMARY_ORG_CANNOT_BE_REMOVED', async () => {
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    membershipRepository.findByAccountAndOrg.mockResolvedValue(
      createAccountOrgMembershipFixture({
        id: 'mem-2',
        relationType: 'PRIMARY',
        isPrimary: true
      })
    )

    const accountRepository = createAccountRepositoryMock()
    accountRepository.findById.mockResolvedValue(account)

    const handler = new RemoveAccountOrgMembershipHandler(
      accountRepository,
      membershipRepository,
      checkResourceService
    )

    await expect(
      handler.execute(new RemoveAccountOrgMembershipCommand('acc-1', 'org-1', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_PRIMARY_ORG_CANNOT_BE_REMOVED.code })
    })
  })

  it('删除组织归属 / 当归属关系不存在时 / 应返回 IDENTITY_ACCOUNT_ORG_MEMBERSHIP_NOT_FOUND', async () => {
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    membershipRepository.findByAccountAndOrg.mockResolvedValue(null)

    const accountRepository = createAccountRepositoryMock()
    const handler = new RemoveAccountOrgMembershipHandler(
      accountRepository,
      membershipRepository,
      checkResourceService
    )

    await expect(
      handler.execute(new RemoveAccountOrgMembershipCommand('acc-1', 'missing-org', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_ACCOUNT_ORG_MEMBERSHIP_NOT_FOUND.code
      })
    })
  })

  it('新增组织归属 / 当租户操作人尝试访问其他租户账户时 / 应返回 ACCESS_DENIED', async () => {
    const accountRepository = createAccountRepositoryMock()
    const orgRepository = createOrgRepositoryMock()
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'acc-2',
        tenantId: 'tenant-2'
      })
    )

    const handler = new AddAccountOrgMembershipHandler(
      accountRepository,
      orgRepository,
      membershipRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new AddAccountOrgMembershipCommand('acc-2', 'org-2', 'op-1', {
          tenantId: 'tenant-1',
          isSystemScope: false
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: ACCESS_DENIED.code })
    })
  })

  it('删除组织归属 / 当租户操作人尝试访问其他租户归属时 / 应返回 ACCESS_DENIED', async () => {
    const accountRepository = createAccountRepositoryMock()
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'acc-2',
        tenantId: 'tenant-2'
      })
    )
    membershipRepository.findByAccountAndOrg.mockResolvedValue(
      createAccountOrgMembershipFixture({
        id: 'mem-9',
        accountId: 'acc-2',
        orgId: 'org-2'
      })
    )

    const handler = new RemoveAccountOrgMembershipHandler(
      accountRepository,
      membershipRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new RemoveAccountOrgMembershipCommand('acc-2', 'org-2', 'op-1', {
          tenantId: 'tenant-1',
          isSystemScope: false
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: ACCESS_DENIED.code })
    })
  })

  it('设置主组织 / 当租户操作人尝试访问其他租户账户时 / 应返回 ACCESS_DENIED', async () => {
    const accountRepository = createAccountRepositoryMock()
    const orgRepository = createOrgRepositoryMock()
    const membershipRepository = createAccountOrgMembershipRepositoryMock()
    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'acc-3',
        tenantId: 'tenant-2'
      })
    )

    const handler = new SetAccountPrimaryOrgHandler(
      accountRepository,
      orgRepository,
      membershipRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new SetAccountPrimaryOrgCommand('acc-3', undefined, 'op-1', {
          tenantId: 'tenant-1',
          isSystemScope: false
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: ACCESS_DENIED.code })
    })
  })
})
