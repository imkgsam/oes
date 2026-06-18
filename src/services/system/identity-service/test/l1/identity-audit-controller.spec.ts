import { CommandBus } from '@nestjs/cqrs'
import { status } from '@grpc/grpc-js'
import {
  IDENTITY_ACCOUNT_PERMISSION_CODES,
  REQUIRE_PERMISSIONS_METADATA_KEY
} from '@oes/common/authorization'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { IdentityAuditService } from '../../src/application/services/identity-audit.service'
import { IdentityMachineAuthGrpcController } from '../../src/interfaces/grpc/identity-machine-auth.grpc.controller'
import { IdentityManagementGrpcController } from '../../src/interfaces/grpc/identity-management.grpc.controller'
import { IDENTITY_INVALID_WORK_EMAIL } from '../../src/common/constants/exceptions/contact-asset.exceptions'
import { createApiKeyFixture, createServiceAccountFixture } from '../helpers/machine-fixtures'
import { createContactAssetFixture } from '../helpers/identity-fixtures'

describe('identity audit controller integration', () => {
  it('management controller / assignAccountWorkEmailAsset 成功后 / 应发出审计事件', async () => {
    const asset = createContactAssetFixture({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      accountId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    })
    const commandBus = {
      execute: jest.fn().mockResolvedValue(asset)
    } as unknown as CommandBus
    const auditService = {
      emitContactAssetEvent: jest.fn(),
      emitEnvelope: jest.fn()
    } as unknown as IdentityAuditService
    const controller = new IdentityManagementGrpcController(
      new ValidatingCommandBus(commandBus),
      new ValidatingQueryBus({ execute: jest.fn() } as any),
      auditService,
      { resolvePermissionCodes: jest.fn().mockResolvedValue([]) } as any
    )

    const request: Record<string, unknown> = {
      accountId: asset.accountId,
      email: asset.value,
      isPrimary: asset.isPrimary,
      __oesOperatorContext: {
        operatorContext: {
          operator_id: '11111111-1111-4111-8111-111111111111'
        }
      }
    }

    await controller.assignAccountWorkEmailAsset(request as any)

    expect((auditService as any).emitContactAssetEvent).toHaveBeenCalledWith(
      'ACCOUNT_WORK_EMAIL_ASSIGNED',
      asset,
      '11111111-1111-4111-8111-111111111111'
    )
  })

  it('machine auth controller / authenticateApiKey 成功后 / 应发出审计事件', async () => {
    const apiKey = createApiKeyFixture()
    const account = createServiceAccountFixture({ id: apiKey.serviceAccountId })
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        apiKey,
        serviceAccount: account
      })
    } as unknown as CommandBus
    const auditService = {
      emitApiKeyAuthenticated: jest.fn()
    } as unknown as IdentityAuditService
    const controller = new IdentityMachineAuthGrpcController(commandBus as any, auditService)

    await controller.authenticateApiKey({ secret: 'sk_test' })

    expect((auditService as any).emitApiKeyAuthenticated).toHaveBeenCalledWith(apiKey, account)
  })

  it('management controller / assignAccountWorkEmailAsset 失败后 / 应发出 rejected 审计 envelope', async () => {
    const commandBus = {
      execute: jest.fn().mockRejectedValue(ExceptionFactory.domain(IDENTITY_INVALID_WORK_EMAIL))
    } as unknown as CommandBus
    const auditService = {
      emitContactAssetEvent: jest.fn(),
      emitEnvelope: jest.fn()
    } as unknown as IdentityAuditService
    const controller = new IdentityManagementGrpcController(
      new ValidatingCommandBus(commandBus),
      new ValidatingQueryBus({ execute: jest.fn() } as any),
      auditService,
      { resolvePermissionCodes: jest.fn().mockResolvedValue([]) } as any
    )

    const request: Record<string, unknown> = {
      accountId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      email: 'bad-email',
      isPrimary: false,
      __oesOperatorContext: {
        operatorContext: {
          operator_id: '11111111-1111-4111-8111-111111111111'
        }
      }
    }

    await expect(controller.assignAccountWorkEmailAsset(request as any)).rejects.toMatchObject({
      definition: expect.objectContaining({
        rpcStatus: status.INVALID_ARGUMENT
      })
    })

    expect((auditService as any).emitEnvelope).toHaveBeenCalledWith(
      'ACCOUNT_WORK_EMAIL_ASSIGNED',
      'contact',
      expect.objectContaining({
        result: 'REJECTED',
        operator: {
          operatorId: '11111111-1111-4111-8111-111111111111',
          operatorType: 'HUMAN'
        },
        details: expect.objectContaining({
          accountId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          assetType: 'WORK_EMAIL',
          errorCode: 'IDENTITY_INVALID_WORK_EMAIL'
        })
      })
    )
  })

  it('machine auth controller / authenticateApiKey 失败后 / 应发出 failed-or-rejected 审计 envelope', async () => {
    const commandBus = {
      execute: jest.fn().mockRejectedValue(ExceptionFactory.domain(IDENTITY_INVALID_WORK_EMAIL))
    } as unknown as CommandBus
    const auditService = {
      emitApiKeyAuthenticated: jest.fn(),
      emitEnvelope: jest.fn()
    } as unknown as IdentityAuditService
    const controller = new IdentityMachineAuthGrpcController(commandBus as any, auditService)

    await expect(controller.authenticateApiKey({ secret: 'sk_test' })).rejects.toMatchObject({
      definition: expect.objectContaining({
        rpcStatus: status.INVALID_ARGUMENT
      })
    })

    expect((auditService as any).emitEnvelope).toHaveBeenCalledWith(
      'API_KEY_AUTHENTICATED',
      'machine',
      expect.objectContaining({
        result: 'REJECTED',
        operator: {
          operatorId: null,
          operatorType: 'SYSTEM'
        },
        details: expect.objectContaining({
          authenticationMethod: 'API_KEY',
          errorCode: 'IDENTITY_INVALID_WORK_EMAIL'
        })
      })
    )
  })

  it('management controller / deleteAccount 成功后 / 应发出包含跨服务清理统计的审计事件', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        accountId: 'acc-1',
        deletedContactAssetCount: 2,
        userRetained: true
      })
    } as unknown as CommandBus
    const auditService = {
      emitEnvelope: jest.fn()
    } as unknown as IdentityAuditService
    const controller = new IdentityManagementGrpcController(
      new ValidatingCommandBus(commandBus),
      new ValidatingQueryBus({ execute: jest.fn() } as any),
      auditService,
      { resolvePermissionCodes: jest.fn().mockResolvedValue([]) } as any
    )

    const request: Record<string, unknown> = {
      accountId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      deletedSessionCount: 3,
      clearedRoleCount: 2,
      deletedPolicyCount: 4,
      __oesOperatorContext: {
        operatorContext: {
          operator_id: '11111111-1111-4111-8111-111111111111'
        }
      }
    }

    await expect(controller.deleteAccount(request as any)).resolves.toEqual({
      accountId: 'acc-1',
      deletedContactAssetCount: 2,
      userRetained: true
    })

    expect((auditService as any).emitEnvelope).toHaveBeenCalledWith(
      'ACCOUNT_DELETED',
      'account',
      expect.objectContaining({
        result: 'SUCCEEDED',
        operator: {
          operatorId: '11111111-1111-4111-8111-111111111111',
          operatorType: 'HUMAN'
        },
        resource: {
          resourceType: 'account',
          resourceId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
        },
        details: expect.objectContaining({
          accountId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          deletedSessionCount: 3,
          clearedRoleCount: 2,
          deletedPolicyCount: 4,
          deletedContactAssetCount: 2,
          userRetained: true
        })
      })
    )
  })

  it('management controller / updateOwnAccountProfile 自助更新当前账号资料时 / 不应要求管理员资料权限', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        id: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
        displayName: 'Vic Chen',
        bio: 'self profile update',
        isEnabled: true,
        scopeLevel: 'TENANT'
      })
    } as unknown as CommandBus
    const auditService = {
      emitEnvelope: jest.fn()
    } as unknown as IdentityAuditService
    const permissionResolver = {
      resolvePermissions: jest.fn().mockResolvedValue([])
    }
    const controller = new IdentityManagementGrpcController(
      new ValidatingCommandBus(commandBus),
      new ValidatingQueryBus({ execute: jest.fn() } as any),
      auditService,
      permissionResolver as any
    )

    const request: Record<string, unknown> = {
      accountId: 'account-1',
      displayName: 'Vic Chen',
      bio: 'self profile update',
      __oesOperatorContext: {
        operatorContext: {
          operator_id: 'account-1'
        }
      }
    }

    await expect((controller as any).updateOwnAccountProfile(request)).resolves.toEqual({
      account: {
        id: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
        avatarAssetId: '',
        displayName: 'Vic Chen',
        bio: 'self profile update',
        isEnabled: true,
        scopeLevel: 'TENANT'
      }
    })

    expect(permissionResolver.resolvePermissions).not.toHaveBeenCalled()
    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        accountId: 'account-1',
        displayName: 'Vic Chen',
        bio: 'self profile update',
        operatorId: 'account-1'
      })
    )
  })

  it('management controller / updateOwnUserBasicInfo 自助更新当前用户联系方式时 / 不应要求管理员资料权限', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        id: 'user-1',
        username: 'vic',
        personalEmail: 'vic@example.com',
        personalPhone: '',
        isActive: true
      })
    } as unknown as CommandBus
    const auditService = {
      emitEnvelope: jest.fn()
    } as unknown as IdentityAuditService
    const permissionResolver = {
      resolvePermissions: jest.fn().mockResolvedValue([])
    }
    const controller = new IdentityManagementGrpcController(
      new ValidatingCommandBus(commandBus),
      new ValidatingQueryBus({ execute: jest.fn() } as any),
      auditService,
      permissionResolver as any
    )

    const request: Record<string, unknown> = {
      accountId: 'account-1',
      userId: 'user-1',
      email: 'vic@example.com',
      __oesOperatorContext: {
        operatorContext: {
          operator_id: 'account-1'
        }
      }
    }

    await expect((controller as any).updateOwnUserBasicInfo(request)).resolves.toEqual({
      user: {
        id: 'user-1',
        username: 'vic',
        personalEmail: 'vic@example.com',
        personalPhone: '',
        isActive: true
      }
    })

    expect(permissionResolver.resolvePermissions).not.toHaveBeenCalled()
    expect((commandBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        accountId: 'account-1',
        userId: 'user-1',
        email: 'vic@example.com',
        operatorId: 'account-1'
      })
    )
  })

  it('management controller / updateUserBasicInfo 应保留管理员资料权限元数据', () => {
    expect(
      Reflect.getMetadata(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        IdentityManagementGrpcController.prototype.updateUserBasicInfo
      )
    ).toEqual({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_PROFILE] })
  })

  it('management controller / contact asset mutations 应使用统一 Contact Asset 权限码', () => {
    expect(
      Reflect.getMetadata(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        IdentityManagementGrpcController.prototype.assignAccountWorkEmailAsset
      )
    ).toEqual({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.ASSIGN_CONTACT_ASSET] })
    expect(
      Reflect.getMetadata(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        IdentityManagementGrpcController.prototype.assignAccountWorkPhoneAsset
      )
    ).toEqual({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.ASSIGN_CONTACT_ASSET] })
    expect(
      Reflect.getMetadata(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        IdentityManagementGrpcController.prototype.revokeAccountWorkEmailAsset
      )
    ).toEqual({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.RELEASE_CONTACT_ASSET] })
    expect(
      Reflect.getMetadata(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        IdentityManagementGrpcController.prototype.revokeAccountWorkPhoneAsset
      )
    ).toEqual({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.RELEASE_CONTACT_ASSET] })
    expect(
      Reflect.getMetadata(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        IdentityManagementGrpcController.prototype.setAccountPrimaryWorkEmailAsset
      )
    ).toEqual({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.SET_PRIMARY_CONTACT_ASSET] })
    expect(
      Reflect.getMetadata(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        IdentityManagementGrpcController.prototype.setAccountPrimaryWorkPhoneAsset
      )
    ).toEqual({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.SET_PRIMARY_CONTACT_ASSET] })
    expect(
      Reflect.getMetadata(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        IdentityManagementGrpcController.prototype.setAccountWorkEmailAssetStatus
      )
    ).toEqual({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.SET_CONTACT_ASSET_STATUS] })
    expect(
      Reflect.getMetadata(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        IdentityManagementGrpcController.prototype.setAccountWorkPhoneAssetStatus
      )
    ).toEqual({ all: [IDENTITY_ACCOUNT_PERMISSION_CODES.SET_CONTACT_ASSET_STATUS] })
  })
})
