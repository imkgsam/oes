import { ACCESS_DENIED } from '@oes/common/exceptions'
import {
  IDENTITY_ACCOUNT_CONTACT_ASSET_NOT_FOUND,
  IDENTITY_CONTACT_ASSET_TYPE_MISMATCH,
  IDENTITY_DISABLED_CONTACT_ASSET_CANNOT_BE_PRIMARY,
  IDENTITY_REVOKED_CONTACT_ASSET_CANNOT_BE_MODIFIED
} from '../common/constants'
import { CheckResourceService } from '../application/authorization'
import { RevokeAccountWorkEmailAssetCommand } from '../application/commands/contact/revoke-account-work-email-asset.command'
import { RevokeAccountWorkEmailAssetHandler } from '../application/commands/contact/revoke-account-work-email-asset.handler'
import { RevokeAccountWorkPhoneAssetCommand } from '../application/commands/contact/revoke-account-work-phone-asset.command'
import { RevokeAccountWorkPhoneAssetHandler } from '../application/commands/contact/revoke-account-work-phone-asset.handler'
import { SetAccountPrimaryWorkEmailAssetCommand } from '../application/commands/contact/set-account-primary-work-email-asset.command'
import { SetAccountPrimaryWorkEmailAssetHandler } from '../application/commands/contact/set-account-primary-work-email-asset.handler'
import { SetAccountPrimaryWorkPhoneAssetCommand } from '../application/commands/contact/set-account-primary-work-phone-asset.command'
import { SetAccountPrimaryWorkPhoneAssetHandler } from '../application/commands/contact/set-account-primary-work-phone-asset.handler'
import { SetAccountWorkEmailAssetStatusCommand } from '../application/commands/contact/set-account-work-email-asset-status.command'
import { SetAccountWorkEmailAssetStatusHandler } from '../application/commands/contact/set-account-work-email-asset-status.handler'
import { SetAccountWorkPhoneAssetStatusCommand } from '../application/commands/contact/set-account-work-phone-asset-status.command'
import { SetAccountWorkPhoneAssetStatusHandler } from '../application/commands/contact/set-account-work-phone-asset-status.handler'
import {
  createAccountContactAssetRepositoryMock,
  createContactAssetFixture
} from '../../test/helpers/identity-fixtures'

describe('工作邮箱资产规则', () => {
  const checkResourceService = new CheckResourceService()
  const activeAsset = createContactAssetFixture()
  const revokedAsset = createContactAssetFixture({
    id: 'asset-2',
    status: 'REVOKED',
    revokedAt: new Date('2026-03-25T00:00:00.000Z')
  })
  const disabledAsset = createContactAssetFixture({
    id: 'asset-3',
    status: 'DISABLED'
  })
  const phoneAsset = createContactAssetFixture({
    id: 'asset-5',
    type: 'WORK_PHONE',
    value: '+81 90 1234 5678'
  })

  it('设置工作邮箱状态 / 当资产已回收时 / 应返回 IDENTITY_REVOKED_CONTACT_ASSET_CANNOT_BE_MODIFIED', async () => {
    const assetRepository = createAccountContactAssetRepositoryMock()
    assetRepository.findById.mockResolvedValue(revokedAsset)

    const handler = new SetAccountWorkEmailAssetStatusHandler(assetRepository, checkResourceService)

    await expect(
      handler.execute(new SetAccountWorkEmailAssetStatusCommand('asset-2', true))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_REVOKED_CONTACT_ASSET_CANNOT_BE_MODIFIED.code
      })
    })
  })

  it('设置工作邮箱状态 / 当目标状态与当前状态一致时 / 应直接返回当前资产', async () => {
    const assetRepository = createAccountContactAssetRepositoryMock()
    assetRepository.findById.mockResolvedValue(activeAsset)

    const handler = new SetAccountWorkEmailAssetStatusHandler(assetRepository, checkResourceService)
    const result = await handler.execute(
      new SetAccountWorkEmailAssetStatusCommand(
        'asset-1',
        true,
        '11111111-1111-4111-8111-111111111111'
      )
    )

    expect(assetRepository.setStatus).not.toHaveBeenCalled()
    expect(result).toBe(activeAsset)
  })

  it('设置主工作邮箱 / 当资产为禁用状态时 / 应返回 IDENTITY_DISABLED_CONTACT_ASSET_CANNOT_BE_PRIMARY', async () => {
    const assetRepository = createAccountContactAssetRepositoryMock()
    assetRepository.findById.mockResolvedValue(disabledAsset)

    const handler = new SetAccountPrimaryWorkEmailAssetHandler(assetRepository, checkResourceService)

    await expect(
      handler.execute(
        new SetAccountPrimaryWorkEmailAssetCommand(
          'asset-3',
          '11111111-1111-4111-8111-111111111111'
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_DISABLED_CONTACT_ASSET_CANNOT_BE_PRIMARY.code
      })
    })
  })

  it('设置主工作邮箱 / 当资产已经是主邮箱时 / 应直接返回当前资产', async () => {
    const assetRepository = createAccountContactAssetRepositoryMock()
    const primaryAsset = createContactAssetFixture({
      id: 'asset-4',
      value: 'primary@corp.com',
      isPrimary: true
    })
    assetRepository.findById.mockResolvedValue(primaryAsset)

    const handler = new SetAccountPrimaryWorkEmailAssetHandler(assetRepository, checkResourceService)
    const result = await handler.execute(
      new SetAccountPrimaryWorkEmailAssetCommand(
        'asset-4',
        '11111111-1111-4111-8111-111111111111'
      )
    )

    expect(assetRepository.setPrimary).not.toHaveBeenCalled()
    expect(result).toBe(primaryAsset)
  })

  it('回收工作邮箱 / 当资产不存在时 / 应返回 IDENTITY_ACCOUNT_CONTACT_ASSET_NOT_FOUND', async () => {
    const assetRepository = createAccountContactAssetRepositoryMock()
    assetRepository.findById.mockResolvedValue(null)

    const handler = new RevokeAccountWorkEmailAssetHandler(assetRepository, checkResourceService)

    await expect(
      handler.execute(new RevokeAccountWorkEmailAssetCommand('missing', 'op-1'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_ACCOUNT_CONTACT_ASSET_NOT_FOUND.code
      })
    })
  })

  it('设置主工作邮箱 / 当 asset 实际为工作手机号时 / 应返回 IDENTITY_CONTACT_ASSET_TYPE_MISMATCH', async () => {
    const assetRepository = createAccountContactAssetRepositoryMock()
    assetRepository.findById.mockResolvedValue(phoneAsset)

    const handler = new SetAccountPrimaryWorkEmailAssetHandler(assetRepository, checkResourceService)

    await expect(
      handler.execute(
        new SetAccountPrimaryWorkEmailAssetCommand(
          'asset-5',
          '11111111-1111-4111-8111-111111111111'
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_CONTACT_ASSET_TYPE_MISMATCH.code
      })
    })
  })

  it('回收工作手机号 / 当 asset 实际为工作邮箱时 / 应返回 IDENTITY_CONTACT_ASSET_TYPE_MISMATCH', async () => {
    const assetRepository = createAccountContactAssetRepositoryMock()
    assetRepository.findById.mockResolvedValue(activeAsset)

    const handler = new RevokeAccountWorkPhoneAssetHandler(assetRepository, checkResourceService)

    await expect(
      handler.execute(
        new RevokeAccountWorkPhoneAssetCommand(
          'asset-1',
          '11111111-1111-4111-8111-111111111111'
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_CONTACT_ASSET_TYPE_MISMATCH.code
      })
    })
  })

  it('设置工作手机号状态 / 当 asset 实际为工作邮箱时 / 应返回 IDENTITY_CONTACT_ASSET_TYPE_MISMATCH', async () => {
    const assetRepository = createAccountContactAssetRepositoryMock()
    assetRepository.findById.mockResolvedValue(activeAsset)

    const handler = new SetAccountWorkPhoneAssetStatusHandler(assetRepository, checkResourceService)

    await expect(
      handler.execute(
        new SetAccountWorkPhoneAssetStatusCommand(
          'asset-1',
          true,
          '11111111-1111-4111-8111-111111111111'
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_CONTACT_ASSET_TYPE_MISMATCH.code
      })
    })
  })

  it('设置主工作手机号 / 当 asset 已经是主手机号时 / 应直接返回当前资产', async () => {
    const assetRepository = createAccountContactAssetRepositoryMock()
    const primaryPhoneAsset = createContactAssetFixture({
      id: 'asset-6',
      type: 'WORK_PHONE',
      value: '+81 80 1234 5678',
      isPrimary: true
    })
    assetRepository.findById.mockResolvedValue(primaryPhoneAsset)

    const handler = new SetAccountPrimaryWorkPhoneAssetHandler(assetRepository, checkResourceService)
    const result = await handler.execute(
      new SetAccountPrimaryWorkPhoneAssetCommand(
        'asset-6',
        '11111111-1111-4111-8111-111111111111'
      )
    )

    expect(assetRepository.setPrimary).not.toHaveBeenCalled()
    expect(result).toBe(primaryPhoneAsset)
  })

  it('回收工作邮箱 / 当租户操作人尝试访问其他租户资产时 / 应返回 ACCESS_DENIED', async () => {
    const assetRepository = createAccountContactAssetRepositoryMock()
    assetRepository.findById.mockResolvedValue(
      createContactAssetFixture({
        id: 'asset-9',
        tenantId: 'tenant-2'
      })
    )

    const handler = new RevokeAccountWorkEmailAssetHandler(assetRepository, checkResourceService)

    await expect(
      handler.execute(
        new RevokeAccountWorkEmailAssetCommand('asset-9', 'op-1', {
          tenantId: 'tenant-1',
          isSystemScope: false
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: ACCESS_DENIED.code
      })
    })
  })
})
