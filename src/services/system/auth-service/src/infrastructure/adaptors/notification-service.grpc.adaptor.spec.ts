import { of } from 'rxjs'
import { ClientGrpc } from '@nestjs/microservices'
import { Metadata } from '@grpc/grpc-js'
import { GrpcMetadataPropagationFactory, GrpcRequestContextStore } from '@oes/common/authorization'
import { NotificationServiceGrpcAdaptor } from './notification-service.grpc.adaptor'

describe('NotificationServiceGrpcAdaptor', () => {
  it('should propagate metadata and write trace/request ids into notification source context', async () => {
    const sendEmail = jest.fn().mockReturnValue(
      of({
        accepted: true,
        dispatchId: 'dispatch-1'
      })
    )
    const client = {
      getService: jest.fn(() => ({
        sendEmail
      }))
    } as unknown as ClientGrpc

    const metadata = new Metadata()
    const metadataFactory: GrpcMetadataPropagationFactory = {
      createInternalCallMetadata: jest.fn(() => metadata),
      createOperatorScopedMetadata: jest.fn()
    }
    const store = new GrpcRequestContextStore()
    const adaptor = new NotificationServiceGrpcAdaptor(client, metadataFactory, store)
    adaptor.onModuleInit()

    await store.run(
      {
        internalServiceName: 'api-gateway',
        requestId: 'req-notification',
        traceId: 'trace-notification'
      },
      async () => {
        const result = await adaptor.sendAuthOtpEmail({
          recipient: 'user@example.com',
          code: '123456',
          challengeId: 'challenge-1',
          ttlMinutes: 5
        })

        expect(result).toEqual({
          accepted: true,
          dispatchId: 'dispatch-1',
          rejectionReason: undefined
        })
      }
    )

    expect(metadataFactory.createInternalCallMetadata).toHaveBeenCalledWith({
      callerServiceName: 'auth-service',
      requestId: 'req-notification',
      traceId: 'trace-notification'
    })
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({
          sourceService: 'auth-service',
          tenantId: 'system',
          traceId: 'trace-notification',
          requestId: 'req-notification'
        })
      }),
      metadata
    )
  })
})
