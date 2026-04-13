import { QueryBus } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { PermissionManagementGrpcController } from '../../src/interfaces/grpc/permission-management.grpc.controller'

describe('permission audit query controller', () => {
  it('listAuditEvents / 应返回 envelope 风格响应并将 details 序列化为 json 字符串', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        items: [
          {
            eventId: '11111111-1111-4111-8111-111111111111',
            service: 'permission-service',
            module: 'role',
            eventType: 'ROLE_UPDATED',
            occurredAt: new Date('2026-04-08T12:00:00.000Z'),
            result: 'SUCCEEDED',
            operatorId: '22222222-2222-4222-8222-222222222222',
            operatorType: 'HUMAN',
            tenantId: '33333333-3333-4333-8333-333333333333',
            orgId: undefined,
            traceId: 'trace-permission-audit',
            resourceType: 'role',
            resourceId: '44444444-4444-4444-8444-444444444444',
            details: {
              targetCode: 'role.admin',
              afterData: { name: 'Admin' }
            }
          }
        ],
        nextCursor: 'cursor-1'
      })
    } as unknown as QueryBus

    const controller = new PermissionManagementGrpcController(
      {} as any,
      new ValidatingQueryBus(queryBus),
      {} as any
    )

    await expect(
      controller.listAuditEvents({
        tenantId: '33333333-3333-4333-8333-333333333333',
        pageSize: 20
      })
    ).resolves.toEqual({
      items: [
        {
          eventId: '11111111-1111-4111-8111-111111111111',
          service: 'permission-service',
          module: 'role',
          eventType: 'ROLE_UPDATED',
          occurredAt: '2026-04-08T12:00:00.000Z',
          result: 'SUCCEEDED',
          operatorId: '22222222-2222-4222-8222-222222222222',
          operatorType: 'HUMAN',
          tenantId: '33333333-3333-4333-8333-333333333333',
          orgId: '',
          traceId: 'trace-permission-audit',
          resourceType: 'role',
          resourceId: '44444444-4444-4444-8444-444444444444',
          detailsJson: JSON.stringify({
            targetCode: 'role.admin',
            afterData: { name: 'Admin' }
          })
        }
      ],
      nextCursor: 'cursor-1'
    })
  })
})
