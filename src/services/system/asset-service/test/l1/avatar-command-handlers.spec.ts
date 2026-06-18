import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { AssetEntity } from '../../src/domain/entities/asset.entity'
import { ObjectStoragePort } from '../../src/domain/ports/object-storage.port'
import { AssetRepository } from '../../src/domain/repositories/asset.repository'
import { BindAccountAvatarCommand } from '../../src/application/commands/avatar/bind-account-avatar.command'
import {
  BindAccountAvatarHandler
} from '../../src/application/commands/avatar/bind-account-avatar.handler'
import { BindEmployeeOfficialPhotoCommand } from '../../src/application/commands/avatar/bind-employee-official-photo.command'
import {
  BindEmployeeOfficialPhotoHandler
} from '../../src/application/commands/avatar/bind-employee-official-photo.handler'
import { UploadAccountAvatarCommand } from '../../src/application/commands/avatar/upload-account-avatar.command'
import { UploadAccountAvatarHandler } from '../../src/application/commands/avatar/upload-account-avatar.handler'
import { UploadEmployeeOfficialPhotoCommand } from '../../src/application/commands/avatar/upload-employee-official-photo.command'
import {
  UploadEmployeeOfficialPhotoHandler
} from '../../src/application/commands/avatar/upload-employee-official-photo.handler'
import {
  S3CompatibleObjectStorageAdaptor
} from '../../src/infrastructure/adaptors/storage/s3-compatible-object-storage.adaptor'

function buildAsset(overrides: Partial<ConstructorParameters<typeof AssetEntity>[0]> = {}) {
  return new AssetEntity({
    id: overrides.id ?? 'asset-1',
    scopeLevel: overrides.scopeLevel ?? 'TENANT',
    tenantId: Object.prototype.hasOwnProperty.call(overrides, 'tenantId') ? overrides.tenantId! : 'tenant-1',
    ownerAccountId: Object.prototype.hasOwnProperty.call(overrides, 'ownerAccountId')
      ? overrides.ownerAccountId!
      : 'account-1',
    ownerEmployeeId: Object.prototype.hasOwnProperty.call(overrides, 'ownerEmployeeId')
      ? overrides.ownerEmployeeId!
      : null,
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
      activateEmployeeOfficialPhoto: jest.fn(),
      create: jest.fn(),
      findActiveAvatarByAccountId: jest.fn(),
      findActiveEmployeeOfficialPhotoByEmployeeId: jest.fn(),
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
      activateEmployeeOfficialPhoto: jest.fn(),
      create: jest.fn().mockResolvedValue(uploadedAsset),
      findActiveAvatarByAccountId: jest.fn(),
      findActiveEmployeeOfficialPhotoByEmployeeId: jest.fn(),
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
      activateEmployeeOfficialPhoto: jest.fn(),
      create: jest.fn(),
      findActiveAvatarByAccountId: jest.fn().mockResolvedValue(previousAsset),
      findActiveEmployeeOfficialPhotoByEmployeeId: jest.fn(),
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
      activateEmployeeOfficialPhoto: jest.fn(),
      create: jest.fn(),
      findActiveAvatarByAccountId: jest.fn().mockResolvedValue(previousAsset),
      findActiveEmployeeOfficialPhotoByEmployeeId: jest.fn(),
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

  it('uploads employee official photos as pending tenant-owned employee assets', async () => {
    const repository: jest.Mocked<AssetRepository> = {
      activateEmployeeOfficialPhoto: jest.fn(),
      create: jest.fn().mockImplementation((input) =>
        Promise.resolve(
          buildAsset({
            id: 'asset-employee-1',
            scopeLevel: input.scopeLevel,
            tenantId: input.tenantId ?? null,
            ownerAccountId: input.ownerAccountId ?? null,
            ownerEmployeeId: input.ownerEmployeeId ?? null,
            category: input.category,
            storageKey: input.storageKey,
            publicUrl: input.publicUrl,
            status: input.status
          })
        )
      ),
      findActiveAvatarByAccountId: jest.fn(),
      findActiveEmployeeOfficialPhotoByEmployeeId: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn()
    }
    const client = {
      send: jest.fn().mockResolvedValue({})
    }
    const storage = new S3CompatibleObjectStorageAdaptor({
      bucket: 'oes-assets',
      client,
      keyPrefix: 'avatar',
      publicBaseUrl: 'http://localhost:9000/oes-assets'
    })
    const handler = new UploadEmployeeOfficialPhotoHandler(repository, storage)

    const result = await handler.execute(
      new UploadEmployeeOfficialPhotoCommand({
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        operatorId: 'admin-1',
        file: Buffer.from('avatar'),
        fileName: 'official.png',
        contentType: 'image/png'
      })
    )

    expect(result).toMatchObject({
      category: 'EMPLOYEE_OFFICIAL_PHOTO',
      tenantId: 'tenant-1',
      ownerAccountId: null,
      ownerEmployeeId: 'employee-1',
      status: 'PENDING_BIND'
    })
    expect(result.storageKey).toMatch(
      /^avatar\/tenant\/tenant-1\/employee\/employee-1\/official\/.+\.png$/
    )
    expect(client.send.mock.calls[0][0].input.Key).toBe(result.storageKey)
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        ownerAccountId: null,
        ownerEmployeeId: 'employee-1',
        category: 'EMPLOYEE_OFFICIAL_PHOTO',
        status: 'PENDING_BIND'
      })
    )
  })

  it('rejects employee official photo uploads without employee ownership', async () => {
    const repository: jest.Mocked<AssetRepository> = {
      activateEmployeeOfficialPhoto: jest.fn(),
      create: jest.fn(),
      findActiveAvatarByAccountId: jest.fn(),
      findActiveEmployeeOfficialPhotoByEmployeeId: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn()
    }
    const storage: jest.Mocked<ObjectStoragePort> = {
      deleteObject: jest.fn(),
      putObject: jest.fn()
    }
    const handler = new UploadEmployeeOfficialPhotoHandler(repository, storage)

    await expect(
      handler.execute(
        new UploadEmployeeOfficialPhotoCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          employeeId: '',
          operatorId: 'admin-1',
          file: Buffer.from('avatar'),
          fileName: 'official.png',
          contentType: 'image/png'
        })
      )
    ).rejects.toMatchObject({
      additionalDetails: {
        violations: ['employeeId is required']
      }
    })

    expect(storage.putObject).not.toHaveBeenCalled()
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('binds employee official photos and replaces the previous matching employee photo', async () => {
    const nextAsset = buildAsset({
      id: 'asset-employee-2',
      ownerAccountId: null,
      ownerEmployeeId: 'employee-1',
      category: 'EMPLOYEE_OFFICIAL_PHOTO',
      status: 'PENDING_BIND'
    })
    const previousAsset = buildAsset({
      id: 'asset-employee-1',
      ownerAccountId: null,
      ownerEmployeeId: 'employee-1',
      category: 'EMPLOYEE_OFFICIAL_PHOTO',
      status: 'ACTIVE'
    })
    const repository: jest.Mocked<AssetRepository> = {
      activateEmployeeOfficialPhoto: jest.fn().mockResolvedValue({
        activeAsset: buildAsset({
          id: 'asset-employee-2',
          ownerAccountId: null,
          ownerEmployeeId: 'employee-1',
          category: 'EMPLOYEE_OFFICIAL_PHOTO',
          status: 'ACTIVE'
        }),
        replacedAssetId: 'asset-employee-1'
      }),
      create: jest.fn(),
      findActiveAvatarByAccountId: jest.fn(),
      findActiveEmployeeOfficialPhotoByEmployeeId: jest.fn(),
      findById: jest.fn().mockResolvedValue(nextAsset),
      updateStatus: jest.fn()
    }
    const handler = new BindEmployeeOfficialPhotoHandler(repository)

    const result = await handler.execute(
      new BindEmployeeOfficialPhotoCommand({
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        operatorId: 'admin-1',
        newAssetId: 'asset-employee-2'
      })
    )

    expect(result.activeAsset.id).toBe('asset-employee-2')
    expect(result.replacedAssetId).toBe('asset-employee-1')
    expect(repository.activateEmployeeOfficialPhoto).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      newAssetId: 'asset-employee-2',
      previousAssetId: undefined,
      updatedBy: 'admin-1'
    })
    expect(repository.updateStatus).not.toHaveBeenCalled()
    expect(repository.findActiveEmployeeOfficialPhotoByEmployeeId).not.toHaveBeenCalled()
  })

  it('rejects account-owned assets when binding employee official photos', async () => {
    const repository: jest.Mocked<AssetRepository> = {
      activateEmployeeOfficialPhoto: jest.fn().mockRejectedValue(
        Object.assign(new Error('newAssetId: employee official photo asset does not belong to the current employee context'), {
          definition: {
            code: VALIDATION_FAILED.code
          }
        })
      ),
      create: jest.fn(),
      findActiveAvatarByAccountId: jest.fn(),
      findActiveEmployeeOfficialPhotoByEmployeeId: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn()
    }
    const handler = new BindEmployeeOfficialPhotoHandler(repository)

    await expect(
      handler.execute(
        new BindEmployeeOfficialPhotoCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          employeeId: 'employee-1',
          operatorId: 'admin-1',
          newAssetId: 'asset-account-1'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        code: VALIDATION_FAILED.code
      }
    })

    expect(repository.updateStatus).not.toHaveBeenCalled()
  })

  it('rejects employee official photos owned by a different employee', async () => {
    const repository: jest.Mocked<AssetRepository> = {
      activateEmployeeOfficialPhoto: jest.fn().mockRejectedValue(
        Object.assign(new Error('newAssetId: employee official photo asset does not belong to the current employee context'), {
          definition: {
            code: VALIDATION_FAILED.code
          }
        })
      ),
      create: jest.fn(),
      findActiveAvatarByAccountId: jest.fn(),
      findActiveEmployeeOfficialPhotoByEmployeeId: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn()
    }
    const handler = new BindEmployeeOfficialPhotoHandler(repository)

    await expect(
      handler.execute(
        new BindEmployeeOfficialPhotoCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          employeeId: 'employee-1',
          operatorId: 'admin-1',
          newAssetId: 'asset-employee-other'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        code: VALIDATION_FAILED.code
      }
    })

    expect(repository.updateStatus).not.toHaveBeenCalled()
  })

  it('rejects stale previous employee photo ids instead of leaving the current active photo unreplaced', async () => {
    const nextAsset = buildAsset({
      id: 'asset-employee-2',
      ownerAccountId: null,
      ownerEmployeeId: 'employee-1',
      category: 'EMPLOYEE_OFFICIAL_PHOTO',
      status: 'PENDING_BIND'
    })
    const currentActiveAsset = buildAsset({
      id: 'asset-employee-current',
      ownerAccountId: null,
      ownerEmployeeId: 'employee-1',
      category: 'EMPLOYEE_OFFICIAL_PHOTO',
      status: 'ACTIVE'
    })
    const stalePreviousAsset = buildAsset({
      id: 'asset-employee-stale',
      ownerAccountId: null,
      ownerEmployeeId: 'employee-1',
      category: 'EMPLOYEE_OFFICIAL_PHOTO',
      status: 'REPLACED'
    })
    const repository: jest.Mocked<AssetRepository> = {
      activateEmployeeOfficialPhoto: jest.fn().mockRejectedValue(
        Object.assign(new Error('previousAssetId: employee official photo asset is not the current active photo'), {
          definition: {
            code: VALIDATION_FAILED.code
          }
        })
      ),
      create: jest.fn(),
      findActiveAvatarByAccountId: jest.fn(),
      findActiveEmployeeOfficialPhotoByEmployeeId: jest.fn(),
      findById: jest.fn()
        .mockResolvedValueOnce(nextAsset),
      updateStatus: jest.fn()
    }
    const handler = new BindEmployeeOfficialPhotoHandler(repository)

    await expect(
      handler.execute(
        new BindEmployeeOfficialPhotoCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          employeeId: 'employee-1',
          operatorId: 'admin-1',
          newAssetId: 'asset-employee-2',
          previousAssetId: 'asset-employee-stale'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        code: VALIDATION_FAILED.code
      }
    })

    expect(repository.activateEmployeeOfficialPhoto).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      newAssetId: 'asset-employee-2',
      previousAssetId: 'asset-employee-stale',
      updatedBy: 'admin-1'
    })
    expect(repository.updateStatus).not.toHaveBeenCalled()
  })

  it('rejects supplied previous employee photo ids when no current active photo exists', async () => {
    const nextAsset = buildAsset({
      id: 'asset-employee-2',
      ownerAccountId: null,
      ownerEmployeeId: 'employee-1',
      category: 'EMPLOYEE_OFFICIAL_PHOTO',
      status: 'PENDING_BIND'
    })
    const suppliedPreviousAsset = buildAsset({
      id: 'asset-employee-old',
      ownerAccountId: null,
      ownerEmployeeId: 'employee-1',
      category: 'EMPLOYEE_OFFICIAL_PHOTO',
      status: 'REPLACED'
    })
    const repository: jest.Mocked<AssetRepository> = {
      activateEmployeeOfficialPhoto: jest.fn().mockRejectedValue(
        Object.assign(new Error('previousAssetId: employee official photo asset is not the current active photo'), {
          definition: {
            code: VALIDATION_FAILED.code
          }
        })
      ),
      create: jest.fn(),
      findActiveAvatarByAccountId: jest.fn(),
      findActiveEmployeeOfficialPhotoByEmployeeId: jest.fn(),
      findById: jest.fn()
        .mockResolvedValueOnce(nextAsset),
      updateStatus: jest.fn()
    }
    const handler = new BindEmployeeOfficialPhotoHandler(repository)

    await expect(
      handler.execute(
        new BindEmployeeOfficialPhotoCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          employeeId: 'employee-1',
          operatorId: 'admin-1',
          newAssetId: 'asset-employee-2',
          previousAssetId: 'asset-employee-old'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        code: VALIDATION_FAILED.code
      }
    })

    expect(repository.updateStatus).not.toHaveBeenCalled()
  })
})
