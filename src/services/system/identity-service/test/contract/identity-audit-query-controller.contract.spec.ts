import { QueryBus } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { IdentityQueryGrpcController } from '../../src/interfaces/grpc/identity-query.grpc.controller'

describe('identity audit query controller', () => {
  it('listAuditEvents / 应返回 envelope 风格响应并将 details 序列化为 json 字符串', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        items: [
          {
            eventId: '11111111-1111-4111-8111-111111111111',
            service: 'identity-service',
            module: 'machine',
            eventType: 'API_KEY_CREATED',
            occurredAt: new Date('2026-04-06T12:00:00.000Z'),
            result: 'SUCCEEDED',
            operatorId: '22222222-2222-4222-8222-222222222222',
            operatorType: 'HUMAN',
            tenantId: '33333333-3333-4333-8333-333333333333',
            orgId: null,
            traceId: 'trace-1',
            resourceType: 'api_key',
            resourceId: '44444444-4444-4444-8444-444444444444',
            details: {
              serviceAccountId: 'sa-1',
              expiresAt: null
            }
          }
        ],
        nextCursor: 'cursor-1'
      })
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.listAuditEvents({
        tenantId: '33333333-3333-4333-8333-333333333333',
        pageSize: 20
      })
    ).resolves.toEqual({
      items: [
        {
          eventId: '11111111-1111-4111-8111-111111111111',
          service: 'identity-service',
          module: 'machine',
          eventType: 'API_KEY_CREATED',
          occurredAt: '2026-04-06T12:00:00.000Z',
          result: 'SUCCEEDED',
          operatorId: '22222222-2222-4222-8222-222222222222',
          operatorType: 'HUMAN',
          tenantId: '33333333-3333-4333-8333-333333333333',
          orgId: '',
          traceId: 'trace-1',
          resourceType: 'api_key',
          resourceId: '44444444-4444-4444-8444-444444444444',
          detailsJson: JSON.stringify({
            serviceAccountId: 'sa-1',
            expiresAt: null
          })
        }
      ],
      nextCursor: 'cursor-1'
    })
  })
})
