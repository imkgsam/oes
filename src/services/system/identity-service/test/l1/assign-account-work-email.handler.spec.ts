import { ACCESS_DENIED } from '@oes/common/exceptions'
import {
  IDENTITY_ACCOUNT_NOT_FOUND,
  IDENTITY_INVALID_WORK_EMAIL,
  IDENTITY_WORK_EMAIL_ALREADY_ASSIGNED
} from '../../src/common/constants'
import { CheckResourceService } from '../../src/application/authorization'
import { AssignAccountWorkEmailAssetCommand } from '../../src/application/commands/contact/assign-account-work-email-asset.command'
import { AssignAccountWorkEmailAssetHandler } from '../../src/application/commands/contact/assign-account-work-email-asset.handler'
import {
  createAccountContactAssetRepositoryMock,
  createAccountRepositoryMock,
  createAccountSummaryFixture,
  createContactAssetFixture
} from '../helpers/identity-fixtures'

describe('分配工作邮箱', () => {
  const account = createAccountSummaryFixture()
  const checkResourceService = new CheckResourceService()
  const assignedAsset = createContactAssetFixture({
    isPrimary: true
  })

  it('分配工作邮箱 / 当邮箱格式合法且租户内未占用时 / 应标准化后分配成功', async () => {
    const accountRepository = createAccountRepositoryMock()
    const assetRepository = createAccountContactAssetRepositoryMock()
    accountRepository.findById.mockResolvedValue(account)
    assetRepository.findCurrentByTenantAndTypeAndValue.mockResolvedValue(null)
    assetRepository.assign.mockResolvedValue(assignedAsset)

    const handler = new AssignAccountWorkEmailAssetHandler(
      accountRepository,
      assetRepository,
      checkResourceService
    )
    const result = await handler.execute(
      new AssignAccountWorkEmailAssetCommand('acc-1', ' User@Corp.COM ', true, 'op-1')
    )

    expect(assetRepository.findCurrentByTenantAndTypeAndValue).toHaveBeenCalledWith(
      'tenant-1',
      'WORK_EMAIL',
      'user@corp.com'
    )
    expect(assetRepository.assign).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      accountId: 'acc-1',
      type: 'WORK_EMAIL',
      value: 'user@corp.com',
      isPrimary: true,
      assignedBy: 'op-1'
    })
    expect(result).toBe(assignedAsset)
  })

  it('分配工作邮箱 / 当邮箱格式非法时 / 应返回 IDENTITY_INVALID_WORK_EMAIL', async () => {
    const accountRepository = createAccountRepositoryMock()
    const assetRepository = createAccountContactAssetRepositoryMock()
    accountRepository.findById.mockResolvedValue(account)

    const handler = new AssignAccountWorkEmailAssetHandler(
      accountRepository,
      assetRepository,
      checkResourceService
    )

    await expect(
      handler.execute(new AssignAccountWorkEmailAssetCommand('acc-1', 'not-an-email', false, 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_INVALID_WORK_EMAIL.code })
    })
  })

  it('分配工作邮箱 / 当租户内存在当前有效的同值邮箱时 / 应返回 IDENTITY_WORK_EMAIL_ALREADY_ASSIGNED', async () => {
    const accountRepository = createAccountRepositoryMock()
    const assetRepository = createAccountContactAssetRepositoryMock()
    accountRepository.findById.mockResolvedValue(account)
    assetRepository.findCurrentByTenantAndTypeAndValue.mockResolvedValue(assignedAsset)

    const handler = new AssignAccountWorkEmailAssetHandler(
      accountRepository,
      assetRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new AssignAccountWorkEmailAssetCommand('acc-1', 'user@corp.com', false, 'op-1')
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_WORK_EMAIL_ALREADY_ASSIGNED.code })
    })
  })

  it('分配工作邮箱 / 当账户不存在时 / 应返回 IDENTITY_ACCOUNT_NOT_FOUND', async () => {
    const accountRepository = createAccountRepositoryMock()
    const assetRepository = createAccountContactAssetRepositoryMock()
    accountRepository.findById.mockResolvedValue(null)

    const handler = new AssignAccountWorkEmailAssetHandler(
      accountRepository,
      assetRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new AssignAccountWorkEmailAssetCommand('missing-account', 'user@corp.com', false, 'op-1')
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ACCOUNT_NOT_FOUND.code })
    })
  })

  it('分配工作邮箱 / 当租户操作人尝试访问其他租户账户时 / 应返回 ACCESS_DENIED', async () => {
    const accountRepository = createAccountRepositoryMock()
    const assetRepository = createAccountContactAssetRepositoryMock()
    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'acc-2',
        tenantId: 'tenant-2'
      })
    )

    const handler = new AssignAccountWorkEmailAssetHandler(
      accountRepository,
      assetRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new AssignAccountWorkEmailAssetCommand(
          'acc-2',
          'user@corp.com',
          false,
          'op-1',
          {
            tenantId: 'tenant-1',
            isSystemScope: false
          }
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: ACCESS_DENIED.code })
    })
  })
})
