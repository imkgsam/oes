import { CommandBus } from '@nestjs/cqrs'
import { status } from '@grpc/grpc-js'
import { ExceptionFactory } from '@oes/common/exceptions'
import { IdentityAuditService } from '../../src/application/services/identity-audit.service'
import { IdentityMachineAuthGrpcController } from '../../src/interfaces/grpc/identity-machine-auth.grpc.controller'
import { IdentityManagementGrpcController } from '../../src/interfaces/grpc/identity-management.grpc.controller'
import { IDENTITY_INVALID_WORK_EMAIL } from '../../src/common/constants/exceptions/contact-asset.exceptions'
import {
  createApiKeyFixture,
  createServiceAccountFixture
} from '../helpers/machine-fixtures'
import { createContactAssetFixture } from '../helpers/identity-fixtures'

describe('identity audit controller integration', () => {
  it('management controller / assignAccountWorkEmailAsset 成功后 / 应发出审计事件', async () => {
    const asset = createContactAssetFixture()
    const commandBus = {
      execute: jest.fn().mockResolvedValue(asset)
    } as unknown as CommandBus
    const auditService = {
      emitContactAssetEvent: jest.fn()
    } as unknown as IdentityAuditService
    const controller = new IdentityManagementGrpcController(
      commandBus as any,
      auditService
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
    const controller = new IdentityMachineAuthGrpcController(
      commandBus as any,
      auditService
    )

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
      commandBus as any,
      auditService
    )

    const request: Record<string, unknown> = {
      accountId: 'acc-1',
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
          accountId: 'acc-1',
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
    const controller = new IdentityMachineAuthGrpcController(
      commandBus as any,
      auditService
    )

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
})
