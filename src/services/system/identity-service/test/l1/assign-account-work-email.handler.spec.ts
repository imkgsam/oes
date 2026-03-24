import {
  IDENTITY_ACCOUNT_NOT_FOUND,
  IDENTITY_INVALID_WORK_EMAIL,
  IDENTITY_WORK_EMAIL_ALREADY_ASSIGNED
} from '../../src/common/constants'
import { AccountContactAssetEntity } from '../../src/domain/entities/account-contact-asset.entity'
import { AccountRepository } from '../../src/domain/repositories/account.repository'
import { AccountContactAssetRepository } from '../../src/domain/repositories/account-contact-asset.repository'
import { AccountSummaryEntity } from '../../src/domain/entities/account-summary.entity'
import { AssignAccountWorkEmailAssetCommand } from '../../src/application/commands/contact/assign-account-work-email-asset.command'
import { AssignAccountWorkEmailAssetHandler } from '../../src/application/commands/contact/assign-account-work-email-asset.handler'

describe('分配工作邮箱', () => {
  const createAccountRepository = (): jest.Mocked<AccountRepository> =>
    ({
      findAvailableByUserId: jest.fn(),
      findById: jest.fn()
    }) as unknown as jest.Mocked<AccountRepository>

  const createAssetRepository = (): jest.Mocked<AccountContactAssetRepository> =>
    ({
      findById: jest.fn(),
      findCurrentByTenantAndTypeAndValue: jest.fn(),
      listByAccountIdAndType: jest.fn(),
      assign: jest.fn(),
      revoke: jest.fn(),
      setStatus: jest.fn(),
      setPrimary: jest.fn()
    }) as unknown as jest.Mocked<AccountContactAssetRepository>

  const account = new AccountSummaryEntity('acc-1', 'user-1', 'tenant-1', 'demo', true)
  const assignedAsset = new AccountContactAssetEntity(
    'asset-1',
    'tenant-1',
    'acc-1',
    'WORK_EMAIL',
    'user@corp.com',
    'ACTIVE',
    true,
    new Date('2026-03-24T00:00:00.000Z'),
    null
  )

  it('分配工作邮箱 / 当邮箱格式合法且租户内未占用时 / 应标准化后分配成功', async () => {
    const accountRepository = createAccountRepository()
    const assetRepository = createAssetRepository()
    accountRepository.findById.mockResolvedValue(account)
    assetRepository.findCurrentByTenantAndTypeAndValue.mockResolvedValue(null)
    assetRepository.assign.mockResolvedValue(assignedAsset)

    const handler = new AssignAccountWorkEmailAssetHandler(accountRepository, assetRepository)
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
    const accountRepository = createAccountRepository()
    const assetRepository = createAssetRepository()
    accountRepository.findById.mockResolvedValue(account)

    const handler = new AssignAccountWorkEmailAssetHandler(accountRepository, assetRepository)

    await expect(
      handler.execute(new AssignAccountWorkEmailAssetCommand('acc-1', 'not-an-email', false, 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_INVALID_WORK_EMAIL.code })
    })
  })

  it('分配工作邮箱 / 当租户内存在当前有效的同值邮箱时 / 应返回 IDENTITY_WORK_EMAIL_ALREADY_ASSIGNED', async () => {
    const accountRepository = createAccountRepository()
    const assetRepository = createAssetRepository()
    accountRepository.findById.mockResolvedValue(account)
    assetRepository.findCurrentByTenantAndTypeAndValue.mockResolvedValue(assignedAsset)

    const handler = new AssignAccountWorkEmailAssetHandler(accountRepository, assetRepository)

    await expect(
      handler.execute(
        new AssignAccountWorkEmailAssetCommand('acc-1', 'user@corp.com', false, 'op-1')
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_WORK_EMAIL_ALREADY_ASSIGNED.code })
    })
  })

  it('分配工作邮箱 / 当账户不存在时 / 应返回 IDENTITY_ACCOUNT_NOT_FOUND', async () => {
    const accountRepository = createAccountRepository()
    const assetRepository = createAssetRepository()
    accountRepository.findById.mockResolvedValue(null)

    const handler = new AssignAccountWorkEmailAssetHandler(accountRepository, assetRepository)

    await expect(
      handler.execute(
        new AssignAccountWorkEmailAssetCommand('missing-account', 'user@corp.com', false, 'op-1')
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_ACCOUNT_NOT_FOUND.code })
    })
  })
})
