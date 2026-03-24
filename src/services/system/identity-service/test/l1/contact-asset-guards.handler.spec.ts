import {
  IDENTITY_ACCOUNT_CONTACT_ASSET_NOT_FOUND,
  IDENTITY_DISABLED_CONTACT_ASSET_CANNOT_BE_PRIMARY,
  IDENTITY_REVOKED_CONTACT_ASSET_CANNOT_BE_MODIFIED
} from '../../src/common/constants'
import { AccountContactAssetEntity } from '../../src/domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../../src/domain/repositories/account-contact-asset.repository'
import { RevokeAccountWorkEmailAssetCommand } from '../../src/application/commands/contact/revoke-account-work-email-asset.command'
import { RevokeAccountWorkEmailAssetHandler } from '../../src/application/commands/contact/revoke-account-work-email-asset.handler'
import { SetAccountPrimaryWorkEmailAssetCommand } from '../../src/application/commands/contact/set-account-primary-work-email-asset.command'
import { SetAccountPrimaryWorkEmailAssetHandler } from '../../src/application/commands/contact/set-account-primary-work-email-asset.handler'
import { SetAccountWorkEmailAssetStatusCommand } from '../../src/application/commands/contact/set-account-work-email-asset-status.command'
import { SetAccountWorkEmailAssetStatusHandler } from '../../src/application/commands/contact/set-account-work-email-asset-status.handler'

describe('工作邮箱资产规则', () => {
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

  const activeAsset = new AccountContactAssetEntity(
    'asset-1',
    'tenant-1',
    'acc-1',
    'WORK_EMAIL',
    'user@corp.com',
    'ACTIVE',
    false,
    new Date('2026-03-24T00:00:00.000Z'),
    null
  )

  const revokedAsset = new AccountContactAssetEntity(
    'asset-2',
    'tenant-1',
    'acc-1',
    'WORK_EMAIL',
    'user@corp.com',
    'REVOKED',
    false,
    new Date('2026-03-24T00:00:00.000Z'),
    new Date('2026-03-25T00:00:00.000Z')
  )

  const disabledAsset = new AccountContactAssetEntity(
    'asset-3',
    'tenant-1',
    'acc-1',
    'WORK_EMAIL',
    'user@corp.com',
    'DISABLED',
    false,
    new Date('2026-03-24T00:00:00.000Z'),
    null
  )

  it('设置工作邮箱状态 / 当资产已回收时 / 应返回 IDENTITY_REVOKED_CONTACT_ASSET_CANNOT_BE_MODIFIED', async () => {
    const assetRepository = createAssetRepository()
    assetRepository.findById.mockResolvedValue(revokedAsset)

    const handler = new SetAccountWorkEmailAssetStatusHandler(assetRepository)

    await expect(
      handler.execute(new SetAccountWorkEmailAssetStatusCommand('asset-2', true))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_REVOKED_CONTACT_ASSET_CANNOT_BE_MODIFIED.code
      })
    })
  })

  it('设置工作邮箱状态 / 当目标状态与当前状态一致时 / 应直接返回当前资产', async () => {
    const assetRepository = createAssetRepository()
    assetRepository.findById.mockResolvedValue(activeAsset)

    const handler = new SetAccountWorkEmailAssetStatusHandler(assetRepository)
    const result = await handler.execute(
      new SetAccountWorkEmailAssetStatusCommand('asset-1', true)
    )

    expect(assetRepository.setStatus).not.toHaveBeenCalled()
    expect(result).toBe(activeAsset)
  })

  it('设置主工作邮箱 / 当资产为禁用状态时 / 应返回 IDENTITY_DISABLED_CONTACT_ASSET_CANNOT_BE_PRIMARY', async () => {
    const assetRepository = createAssetRepository()
    assetRepository.findById.mockResolvedValue(disabledAsset)

    const handler = new SetAccountPrimaryWorkEmailAssetHandler(assetRepository)

    await expect(
      handler.execute(new SetAccountPrimaryWorkEmailAssetCommand('asset-3'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_DISABLED_CONTACT_ASSET_CANNOT_BE_PRIMARY.code
      })
    })
  })

  it('设置主工作邮箱 / 当资产已经是主邮箱时 / 应直接返回当前资产', async () => {
    const assetRepository = createAssetRepository()
    const primaryAsset = new AccountContactAssetEntity(
      'asset-4',
      'tenant-1',
      'acc-1',
      'WORK_EMAIL',
      'primary@corp.com',
      'ACTIVE',
      true,
      new Date('2026-03-24T00:00:00.000Z'),
      null
    )
    assetRepository.findById.mockResolvedValue(primaryAsset)

    const handler = new SetAccountPrimaryWorkEmailAssetHandler(assetRepository)
    const result = await handler.execute(new SetAccountPrimaryWorkEmailAssetCommand('asset-4'))

    expect(assetRepository.setPrimary).not.toHaveBeenCalled()
    expect(result).toBe(primaryAsset)
  })

  it('回收工作邮箱 / 当资产不存在时 / 应返回 IDENTITY_ACCOUNT_CONTACT_ASSET_NOT_FOUND', async () => {
    const assetRepository = createAssetRepository()
    assetRepository.findById.mockResolvedValue(null)

    const handler = new RevokeAccountWorkEmailAssetHandler(assetRepository)

    await expect(
      handler.execute(new RevokeAccountWorkEmailAssetCommand('missing', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_ACCOUNT_CONTACT_ASSET_NOT_FOUND.code
      })
    })
  })
})
