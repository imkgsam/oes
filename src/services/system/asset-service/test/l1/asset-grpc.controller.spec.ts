import {
  AssetServiceControllerMethods,
  BindEmployeeOfficialPhotoRequest,
  UploadEmployeeOfficialPhotoRequest
} from '@oes/common/generated/asset_service'
import { AssetGrpcController } from '../../src/interfaces/grpc/asset.grpc.controller'
import {
  BindEmployeeOfficialPhotoCommand,
  BindEmployeeOfficialPhotoResult,
  UploadEmployeeOfficialPhotoCommand
} from '../../src/application/commands/avatar'
import { AssetEntity } from '../../src/domain/entities/asset.entity'

function buildEmployeePhotoAsset(overrides: Partial<ConstructorParameters<typeof AssetEntity>[0]> = {}) {
  return new AssetEntity({
    id: overrides.id ?? 'asset-employee-1',
    scopeLevel: overrides.scopeLevel ?? 'TENANT',
    tenantId: Object.prototype.hasOwnProperty.call(overrides, 'tenantId') ? overrides.tenantId! : 'tenant-1',
    ownerAccountId: Object.prototype.hasOwnProperty.call(overrides, 'ownerAccountId')
      ? overrides.ownerAccountId!
      : null,
    ownerEmployeeId: Object.prototype.hasOwnProperty.call(overrides, 'ownerEmployeeId')
      ? overrides.ownerEmployeeId!
      : 'employee-1',
    category: overrides.category ?? 'EMPLOYEE_OFFICIAL_PHOTO',
    storageKey:
      overrides.storageKey ?? 'avatar/tenant/tenant-1/employee/employee-1/official/asset-employee-1.webp',
    mimeType: overrides.mimeType ?? 'image/webp',
    size: overrides.size ?? BigInt(12),
    checksum: overrides.checksum ?? 'checksum',
    publicUrl:
      overrides.publicUrl ??
      'http://localhost:9000/oes-assets/avatar/tenant/tenant-1/employee/employee-1/official/asset-employee-1.webp',
    status: overrides.status ?? 'PENDING_BIND',
    createdBy: overrides.createdBy ?? 'operator-1',
    updatedBy: Object.prototype.hasOwnProperty.call(overrides, 'updatedBy') ? overrides.updatedBy! : null,
    createdAt: overrides.createdAt ?? new Date('2026-04-22T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-04-22T00:00:00.000Z')
  })
}

describe('AssetGrpcController', () => {
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
    const controller = new AssetGrpcController(commandBus as never, queryBus as never)
    const request: UploadEmployeeOfficialPhotoRequest = {
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      operatorId: 'admin-1',
      file: Buffer.from('avatar'),
      fileName: 'official.webp',
      contentType: 'image/webp'
    }

    const response = await controller.uploadEmployeeOfficialPhoto(request)

    expect(commandBus.execute).toHaveBeenCalledWith(expect.any(UploadEmployeeOfficialPhotoCommand))
    expect(commandBus.execute.mock.calls[0][0]).toMatchObject({
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      operatorId: 'admin-1',
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
    const controller = new AssetGrpcController(commandBus as never, queryBus as never)
    const request: BindEmployeeOfficialPhotoRequest = {
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      operatorId: 'admin-1',
      newAssetId: 'asset-employee-2',
      previousAssetId: 'asset-employee-1'
    }

    const response = await controller.bindEmployeeOfficialPhoto(request)

    expect(commandBus.execute).toHaveBeenCalledWith(expect.any(BindEmployeeOfficialPhotoCommand))
    expect(commandBus.execute.mock.calls[0][0]).toMatchObject({
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      operatorId: 'admin-1',
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
})
