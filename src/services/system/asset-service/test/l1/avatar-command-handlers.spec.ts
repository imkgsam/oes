import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { AssetEntity } from '../../src/domain/entities/asset.entity'
import { ObjectStoragePort } from '../../src/domain/ports/object-storage.port'
import { AssetRepository } from '../../src/domain/repositories/asset.repository'
import { BindAccountAvatarCommand } from '../../src/application/commands/avatar/bind-account-avatar.command'
import {
  BindAccountAvatarHandler
} from '../../src/application/commands/avatar/bind-account-avatar.handler'
import { UploadAccountAvatarCommand } from '../../src/application/commands/avatar/upload-account-avatar.command'
import { UploadAccountAvatarHandler } from '../../src/application/commands/avatar/upload-account-avatar.handler'

function buildAsset(overrides: Partial<ConstructorParameters<typeof AssetEntity>[0]> = {}) {
  return new AssetEntity({
    id: overrides.id ?? 'asset-1',
    scopeLevel: overrides.scopeLevel ?? 'TENANT',
    tenantId: Object.prototype.hasOwnProperty.call(overrides, 'tenantId') ? overrides.tenantId! : 'tenant-1',
    ownerAccountId: overrides.ownerAccountId ?? 'account-1',
    category: overrides.category ?? 'ACCOUNT_AVATAR',
    storageKey: overrides.storageKey ?? 'avatar/tenant/tenant-1/account-1/asset-1.webp',
    mimeType: overrides.mimeType ?? 'image/webp',
    size: overrides.size ?? BigInt(12),
    checksum: overrides.checksum ?? 'checksum',
    publicUrl:
      overrides.publicUrl ?? 'http://localhost:9000/oes-assets/avatar/tenant/tenant-1/account-1/asset-1.webp',
    status: overrides.status ?? 'PENDING_BIND',
    createdBy: overrides.createdBy ?? 'operator-1',
    updatedBy: Object.prototype.hasOwnProperty.call(overrides, 'updatedBy') ? overrides.updatedBy! : null,
    createdAt: overrides.createdAt ?? new Date('2026-04-22T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-04-22T00:00:00.000Z')
  })
}

describe('avatar command handlers', () => {
  it('rejects unsupported avatar mime types', async () => {
    const repository: jest.Mocked<AssetRepository> = {
      create: jest.fn(),
      findActiveAvatarByAccountId: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn()
    }
    const storage: jest.Mocked<ObjectStoragePort> = {
      deleteObject: jest.fn(),
      putObject: jest.fn()
    }
    const handler = new UploadAccountAvatarHandler(repository, storage)

    await expect(
      handler.execute(
        new UploadAccountAvatarCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          accountId: 'account-1',
          operatorId: 'operator-1',
          file: Buffer.from('avatar'),
          fileName: 'avatar.gif',
          contentType: 'image/gif'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        code: VALIDATION_FAILED.code
      }
    })
  })

  it('uploads system-scope avatars without tenant ownership', async () => {
    const uploadedAsset = buildAsset({
      id: 'asset-system-1',
      scopeLevel: 'SYSTEM',
      tenantId: null,
      storageKey: 'avatar/system/account-1/asset-system-1.webp',
      publicUrl: 'http://localhost:9000/oes-assets/avatar/system/account-1/asset-system-1.webp'
    })
    const repository: jest.Mocked<AssetRepository> = {
      create: jest.fn().mockResolvedValue(uploadedAsset),
      findActiveAvatarByAccountId: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn()
    }
    const storage: jest.Mocked<ObjectStoragePort> = {
      deleteObject: jest.fn(),
      putObject: jest.fn().mockResolvedValue({
        storageKey: 'avatar/system/account-1/asset-system-1.webp',
        publicUrl: 'http://localhost:9000/oes-assets/avatar/system/account-1/asset-system-1.webp'
      })
    }
    const handler = new UploadAccountAvatarHandler(repository, storage)

    const result = await handler.execute(
      new UploadAccountAvatarCommand({
        scopeLevel: 'SYSTEM',
        tenantId: undefined,
        accountId: 'account-1',
        operatorId: 'operator-1',
        file: Buffer.from('avatar'),
        fileName: 'avatar.webp',
        contentType: 'image/webp'
      })
    )

    expect(result.scopeLevel).toBe('SYSTEM')
    expect(result.tenantId).toBeNull()
    expect(storage.putObject).toHaveBeenCalledWith(
      expect.objectContaining({
        scopeLevel: 'SYSTEM',
        tenantId: undefined,
        ownerAccountId: 'account-1'
      })
    )
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        scopeLevel: 'SYSTEM',
        tenantId: undefined,
        ownerAccountId: 'account-1'
      })
    )
  })

  it('marks the previous active avatar as replaced when a new avatar is bound', async () => {
    const nextAsset = buildAsset({ id: 'asset-2', status: 'PENDING_BIND' })
    const previousAsset = buildAsset({ id: 'asset-1', status: 'ACTIVE' })
    const repository: jest.Mocked<AssetRepository> = {
      create: jest.fn(),
      findActiveAvatarByAccountId: jest.fn().mockResolvedValue(previousAsset),
      findById: jest.fn().mockResolvedValue(nextAsset),
      updateStatus: jest
        .fn()
        .mockResolvedValueOnce(buildAsset({ id: 'asset-2', status: 'ACTIVE' }))
        .mockResolvedValueOnce(buildAsset({ id: 'asset-1', status: 'REPLACED' }))
    }
    const handler = new BindAccountAvatarHandler(repository)

    const result = await handler.execute(
      new BindAccountAvatarCommand({
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        accountId: 'account-1',
        operatorId: 'operator-1',
        newAssetId: 'asset-2'
      })
    )

    expect(result.activeAsset.id).toBe('asset-2')
    expect(result.replacedAssetId).toBe('asset-1')
    expect(repository.updateStatus).toHaveBeenNthCalledWith(1, {
      assetId: 'asset-2',
      status: 'ACTIVE',
      updatedBy: 'operator-1'
    })
    expect(repository.updateStatus).toHaveBeenNthCalledWith(2, {
      assetId: 'asset-1',
      status: 'REPLACED',
      updatedBy: 'operator-1'
    })
  })

  it('binds system-scope avatars without tenantId', async () => {
    const nextAsset = buildAsset({
      id: 'asset-system-2',
      scopeLevel: 'SYSTEM',
      tenantId: null,
      status: 'PENDING_BIND',
      storageKey: 'avatar/system/account-1/asset-system-2.webp',
      publicUrl: 'http://localhost:9000/oes-assets/avatar/system/account-1/asset-system-2.webp'
    })
    const previousAsset = buildAsset({
      id: 'asset-system-1',
      scopeLevel: 'SYSTEM',
      tenantId: null,
      status: 'ACTIVE',
      storageKey: 'avatar/system/account-1/asset-system-1.webp',
      publicUrl: 'http://localhost:9000/oes-assets/avatar/system/account-1/asset-system-1.webp'
    })
    const repository: jest.Mocked<AssetRepository> = {
      create: jest.fn(),
      findActiveAvatarByAccountId: jest.fn().mockResolvedValue(previousAsset),
      findById: jest.fn().mockResolvedValue(nextAsset),
      updateStatus: jest
        .fn()
        .mockResolvedValueOnce(buildAsset({ id: 'asset-system-2', scopeLevel: 'SYSTEM', tenantId: null, status: 'ACTIVE' }))
        .mockResolvedValueOnce(buildAsset({ id: 'asset-system-1', scopeLevel: 'SYSTEM', tenantId: null, status: 'REPLACED' }))
    }
    const handler = new BindAccountAvatarHandler(repository)

    const result = await handler.execute(
      new BindAccountAvatarCommand({
        scopeLevel: 'SYSTEM',
        tenantId: undefined,
        accountId: 'account-1',
        operatorId: 'operator-1',
        newAssetId: 'asset-system-2'
      })
    )

    expect(result.activeAsset.id).toBe('asset-system-2')
    expect(result.replacedAssetId).toBe('asset-system-1')
    expect(repository.findActiveAvatarByAccountId).toHaveBeenCalledWith('account-1', 'SYSTEM', undefined)
  })
})
