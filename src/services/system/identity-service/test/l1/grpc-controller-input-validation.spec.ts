import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { attachOperatorContext } from '@oes/common/authorization'
import { IdentityManagementGrpcController } from '../../src/interfaces/grpc/identity-management.grpc.controller'
import { IdentityQueryGrpcController } from '../../src/interfaces/grpc/identity-query.grpc.controller'

describe('grpc controller 输入校验', () => {
  it('identity query / 当 accountId 缺失时 / 应返回 VALIDATION_FAILED', async () => {
    const queryBus = {
      execute: jest.fn()
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.listAccountWorkEmailAssets({})
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: VALIDATION_FAILED.code })
    })
    expect(queryBus.execute).not.toHaveBeenCalled()
  })

  it('identity query / 当 pageSize 超过上限时 / listAuditEvents 应返回 VALIDATION_FAILED', async () => {
    const queryBus = {
      execute: jest.fn()
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.listAuditEvents({
        pageSize: 101
      })
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: VALIDATION_FAILED.code })
    })
    expect(queryBus.execute).not.toHaveBeenCalled()
  })

  it('identity management / 当 assetId 缺失时 / 应返回 VALIDATION_FAILED', async () => {
    const commandBus = {
      execute: jest.fn()
    } as unknown as CommandBus
    const auditService = {
      emitEnvelope: jest.fn()
    } as any
    const controller = new IdentityManagementGrpcController(
      new ValidatingCommandBus(commandBus),
      auditService
    )
    const request: Record<string, unknown> = {}

    attachOperatorContext(request, {
      operator_id: '11111111-1111-4111-8111-111111111111',
      tenant_id: 'tenant-1',
      roles: []
    })

    await expect(
      controller.revokeAccountWorkEmailAsset(request as any)
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: VALIDATION_FAILED.code })
    })
    expect(commandBus.execute).not.toHaveBeenCalled()
  })
})
