import {
  AssetServiceControllerMethods,
  BindAccountAvatarRequest,
  BindEmployeeOfficialPhotoRequest,
  UploadAccountAvatarRequest,
  UploadEmployeeOfficialPhotoRequest
} from '@oes/common/generated/asset_service'
import { getRpcAuthorizationModeDeclaration } from '@oes/common/authorization'
import { AssetGrpcController } from '../../src/interfaces/grpc/asset.grpc.controller'
import {
  BindAccountAvatarCommand,
  BindEmployeeOfficialPhotoCommand,
  BindEmployeeOfficialPhotoResult,
  UploadAccountAvatarCommand,
  UploadEmployeeOfficialPhotoCommand
} from '../../src/application/commands/avatar'
import { ResolveAssetPublicUrlQuery } from '../../src/application/queries/avatar'
import { AssetEntity } from '../../src/domain/entities/asset.entity'

function buildEmployeePhotoAsset(
  overrides: Partial<ConstructorParameters<typeof AssetEntity>[0]> = {}
) {
  return new AssetEntity({
    id: overrides.id ?? 'asset-employee-1',
    scopeLevel: overrides.scopeLevel ?? 'TENANT',
    tenantId: Object.prototype.hasOwnProperty.call(overrides, 'tenantId')
      ? overrides.tenantId!
      : 'tenant-1',
    ownerAccountId: Object.prototype.hasOwnProperty.call(overrides, 'ownerAccountId')
      ? overrides.ownerAccountId!
      : null,
    ownerEmployeeId: Object.prototype.hasOwnProperty.call(overrides, 'ownerEmployeeId')
      ? overrides.ownerEmployeeId!
      : 'employee-1',
    category: overrides.category ?? 'EMPLOYEE_OFFICIAL_PHOTO',
    storageKey:
      overrides.storageKey ??
      'avatar/tenant/tenant-1/employee/employee-1/official/asset-employee-1.webp',
    mimeType: overrides.mimeType ?? 'image/webp',
    size: overrides.size ?? BigInt(12),
    checksum: overrides.checksum ?? 'checksum',
    publicUrl:
      overrides.publicUrl ??
      'http://localhost:9000/oes-assets/avatar/tenant/tenant-1/employee/employee-1/official/asset-employee-1.webp',
    status: overrides.status ?? 'PENDING_BIND',
    createdBy: overrides.createdBy ?? 'operator-1',
    updatedBy: Object.prototype.hasOwnProperty.call(overrides, 'updatedBy')
      ? overrides.updatedBy!
      : null,
    createdAt: overrides.createdAt ?? new Date('2026-04-22T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-04-22T00:00:00.000Z')
  })
}

describe('AssetGrpcController', () => {
  const trustedTenantContext = Object.freeze({
    subject: 'account-trusted',
    principalType: 'HUMAN',
    tenantId: 'tenant-trusted',
    requestId: 'request-1',
    traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
  })

  /** Builds a controller whose context store represents the already-verified all-mode guard output. */
  function controllerFixture(context = trustedTenantContext) {
    const commandBus = { execute: jest.fn() }
    const queryBus = { execute: jest.fn() }
    const contextStore = { require: jest.fn(() => context) }
    const controller = new (AssetGrpcController as any)(
      commandBus,
      queryBus,
      contextStore
    ) as AssetGrpcController
    return { commandBus, queryBus, contextStore, controller }
  }

  it('declares the frozen authorization mode on all five RPCs', () => {
    expect(
      getRpcAuthorizationModeDeclaration(AssetGrpcController.prototype, 'uploadAccountAvatar')
    ).toEqual({
      mode: 'SELF_SERVICE',
      allowDelegated: true
    })
    expect(
      getRpcAuthorizationModeDeclaration(AssetGrpcController.prototype, 'bindAccountAvatar')
    ).toEqual({
      mode: 'SELF_SERVICE',
      allowDelegated: true
    })
    expect(
      getRpcAuthorizationModeDeclaration(
        AssetGrpcController.prototype,
        'uploadEmployeeOfficialPhoto'
      )
    ).toEqual({
      mode: 'BUSINESS',
      permissions: { all: ['hr.employee.create'] }
    })
    expect(
      getRpcAuthorizationModeDeclaration(AssetGrpcController.prototype, 'bindEmployeeOfficialPhoto')
    ).toEqual({
      mode: 'BUSINESS',
      permissions: { all: ['hr.employee.create'] }
    })
    expect(
      getRpcAuthorizationModeDeclaration(AssetGrpcController.prototype, 'resolveAssetPublicUrl')
    ).toEqual({
      mode: 'INTERNAL',
      permissions: { all: ['asset.internal.avatar.resolve_public_url'] }
    })
  })

  it('derives account upload and bind identity only from trusted context', async () => {
    const uploadAsset = buildEmployeePhotoAsset({
      ownerAccountId: 'account-trusted',
      ownerEmployeeId: null,
      category: 'ACCOUNT_AVATAR'
    })
    const activeAsset = buildEmployeePhotoAsset({
      id: 'asset-account-2',
      ownerAccountId: 'account-trusted',
      ownerEmployeeId: null,
      category: 'ACCOUNT_AVATAR',
      status: 'ACTIVE'
    })
    const { controller, commandBus } = controllerFixture()
    commandBus.execute
      .mockResolvedValueOnce(uploadAsset)
      .mockResolvedValueOnce({ activeAsset, replacedAssetId: 'asset-account-1' })
    const uploadRequest = {
      file: Buffer.from('avatar'),
      fileName: 'avatar.webp',
      contentType: 'image/webp',
      tenantId: 'body-tenant',
      accountId: 'body-account',
      operatorId: 'body-operator',
      scopeLevel: 'SYSTEM'
    } as UploadAccountAvatarRequest
    const bindRequest = {
      newAssetId: 'asset-account-2',
      previousAssetId: 'asset-account-1',
      tenantId: 'body-tenant',
      accountId: 'body-account',
      operatorId: 'body-operator',
      scopeLevel: 'SYSTEM'
    } as BindAccountAvatarRequest

    await controller.uploadAccountAvatar(uploadRequest)
    await controller.bindAccountAvatar(bindRequest)

    expect(commandBus.execute.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        scopeLevel: 'TENANT',
        tenantId: 'tenant-trusted',
        accountId: 'account-trusted',
        operatorId: 'account-trusted'
      })
    )
    expect(commandBus.execute.mock.calls[0][0]).toBeInstanceOf(UploadAccountAvatarCommand)
    expect(commandBus.execute.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        scopeLevel: 'TENANT',
        tenantId: 'tenant-trusted',
        accountId: 'account-trusted',
        operatorId: 'account-trusted',
        newAssetId: 'asset-account-2'
      })
    )
    expect(commandBus.execute.mock.calls[1][0]).toBeInstanceOf(BindAccountAvatarCommand)
  })

  it('exposes generated employee official photo gRPC methods', () => {
    const decoratorSource = AssetServiceControllerMethods.toString()

    expect(decoratorSource).toContain('uploadEmployeeOfficialPhoto')
    expect(decoratorSource).toContain('bindEmployeeOfficialPhoto')
  })

  it('maps generated employee official photo upload requests to commands', async () => {
    const asset = buildEmployeePhotoAsset()
    const commandBus = {
      execute: jest.fn().mockResolvedValue(asset)
    }
    const queryBus = {
      execute: jest.fn()
    }
    const contextStore = { require: jest.fn(() => trustedTenantContext) }
    const controller = new (AssetGrpcController as any)(commandBus, queryBus, contextStore)
    const request: UploadEmployeeOfficialPhotoRequest = {
      employeeId: 'employee-1',
      file: Buffer.from('avatar'),
      fileName: 'official.webp',
      contentType: 'image/webp'
    }

    const response = await controller.uploadEmployeeOfficialPhoto(request)

    expect(commandBus.execute).toHaveBeenCalledWith(expect.any(UploadEmployeeOfficialPhotoCommand))
    expect(commandBus.execute.mock.calls[0][0]).toMatchObject({
      scopeLevel: 'TENANT',
      tenantId: 'tenant-trusted',
      employeeId: 'employee-1',
      operatorId: 'account-trusted',
      fileName: 'official.webp',
      contentType: 'image/webp'
    })
    expect(response.asset).toMatchObject({
      assetId: 'asset-employee-1',
      category: 'EMPLOYEE_OFFICIAL_PHOTO',
      ownerEmployeeId: 'employee-1'
    })
  })

  it('maps generated employee official photo bind requests to commands', async () => {
    const activeAsset = buildEmployeePhotoAsset({ id: 'asset-employee-2', status: 'ACTIVE' })
    const result: BindEmployeeOfficialPhotoResult = {
      activeAsset,
      replacedAssetId: 'asset-employee-1'
    }
    const commandBus = {
      execute: jest.fn().mockResolvedValue(result)
    }
    const queryBus = {
      execute: jest.fn()
    }
    const contextStore = { require: jest.fn(() => trustedTenantContext) }
    const controller = new (AssetGrpcController as any)(commandBus, queryBus, contextStore)
    const request: BindEmployeeOfficialPhotoRequest = {
      employeeId: 'employee-1',
      newAssetId: 'asset-employee-2',
      previousAssetId: 'asset-employee-1'
    }

    const response = await controller.bindEmployeeOfficialPhoto(request)

    expect(commandBus.execute).toHaveBeenCalledWith(expect.any(BindEmployeeOfficialPhotoCommand))
    expect(commandBus.execute.mock.calls[0][0]).toMatchObject({
      scopeLevel: 'TENANT',
      tenantId: 'tenant-trusted',
      employeeId: 'employee-1',
      operatorId: 'account-trusted',
      newAssetId: 'asset-employee-2',
      previousAssetId: 'asset-employee-1'
    })
    expect(response).toMatchObject({
      activeAsset: {
        assetId: 'asset-employee-2',
        ownerEmployeeId: 'employee-1'
      },
      replacedAssetId: 'asset-employee-1'
    })
  })

  it('passes trusted scope into URL resolution and fails closed without context', async () => {
    const { controller, queryBus } = controllerFixture()
    queryBus.execute.mockResolvedValue({
      assetId: 'asset-1',
      publicUrl: 'https://assets/1',
      status: 'ACTIVE'
    })

    await controller.resolveAssetPublicUrl({ assetId: 'asset-1' })

    expect(queryBus.execute.mock.calls[0][0]).toBeInstanceOf(ResolveAssetPublicUrlQuery)
    expect(queryBus.execute.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        assetId: 'asset-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-trusted'
      })
    )

    const missing = controllerFixture()
    missing.contextStore.require.mockImplementation(() => {
      throw new Error('Trusted execution context is required')
    })
    await expect(missing.controller.resolveAssetPublicUrl({ assetId: 'asset-1' })).rejects.toThrow(
      'Trusted execution context'
    )
    expect(missing.queryBus.execute).not.toHaveBeenCalled()
  })
})
