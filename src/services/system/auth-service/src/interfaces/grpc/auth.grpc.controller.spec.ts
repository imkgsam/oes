import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { AuthGrpcController } from './auth.grpc.controller'

describe('AuthGrpcController', () => {
  it('should map listAuditEvents filters and response records', async () => {
    const commandBus = {} as ValidatingCommandBus
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        items: [
          {
            eventId: 'event-auth-1',
            service: 'auth-service',
            module: 'session',
            eventType: 'SESSION_REVOKED',
            occurredAt: new Date('2026-04-08T18:00:00.000Z'),
            result: 'SUCCEEDED',
            operatorId: 'a5da9d3b-f755-44b0-b080-2ff6b42cf2c8',
            operatorType: 'HUMAN',
            tenantId: '8fbdfbfd-a221-4494-a760-8d9d033ce61f',
            orgId: undefined,
            traceId: 'trace-auth-query',
            resourceType: 'session',
            resourceId: '0f71e092-4d96-4c36-ac8a-2a3f73a330c5',
            details: {
              reason: 'ADMIN_REVOKED'
            }
          }
        ],
        nextCursor: 'cursor-auth-1'
      })
    } as unknown as ValidatingQueryBus

    const controller = new AuthGrpcController(commandBus, queryBus)
    const getRequiredOperatorIdSpy = jest
      .spyOn(controller as any, 'getRequiredOperatorId')
      .mockReturnValue('operator-auth-1')

    const response = await controller.listAuditEvents({
      service: 'auth-service',
      module: 'session',
      eventType: 'SESSION_REVOKED',
      result: 'SUCCEEDED',
      operatorId: 'a5da9d3b-f755-44b0-b080-2ff6b42cf2c8',
      tenantId: '8fbdfbfd-a221-4494-a760-8d9d033ce61f',
      orgId: '',
      resourceType: 'session',
      resourceId: '0f71e092-4d96-4c36-ac8a-2a3f73a330c5',
      occurredAtFrom: '2026-04-08T00:00:00.000Z',
      occurredAtTo: '2026-04-08T23:59:59.000Z',
      cursor: 'cursor-prev',
      pageSize: 10
    })

    expect(getRequiredOperatorIdSpy).toHaveBeenCalled()
    expect((queryBus.execute as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        service: 'auth-service',
        module: 'session',
        eventType: 'SESSION_REVOKED',
        result: 'SUCCEEDED',
        operatorId: 'a5da9d3b-f755-44b0-b080-2ff6b42cf2c8',
        tenantId: '8fbdfbfd-a221-4494-a760-8d9d033ce61f',
        resourceType: 'session',
        resourceId: '0f71e092-4d96-4c36-ac8a-2a3f73a330c5',
        occurredAtFrom: '2026-04-08T00:00:00.000Z',
        occurredAtTo: '2026-04-08T23:59:59.000Z',
        cursor: 'cursor-prev',
        pageSize: 10
      })
    )
    expect(response).toEqual({
      items: [
        {
          eventId: 'event-auth-1',
          service: 'auth-service',
          module: 'session',
          eventType: 'SESSION_REVOKED',
          occurredAt: '2026-04-08T18:00:00.000Z',
          result: 'SUCCEEDED',
          operatorId: 'a5da9d3b-f755-44b0-b080-2ff6b42cf2c8',
          operatorType: 'HUMAN',
          tenantId: '8fbdfbfd-a221-4494-a760-8d9d033ce61f',
          orgId: '',
          traceId: 'trace-auth-query',
          resourceType: 'session',
          resourceId: '0f71e092-4d96-4c36-ac8a-2a3f73a330c5',
          detailsJson: '{"reason":"ADMIN_REVOKED"}'
        }
      ],
      nextCursor: 'cursor-auth-1'
    })
  })
})
