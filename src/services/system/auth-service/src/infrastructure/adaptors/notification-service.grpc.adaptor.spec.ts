import { of } from 'rxjs'
import { ClientGrpc } from '@nestjs/microservices'
import { Metadata } from '@grpc/grpc-js'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import {
  DispatchStatus,
  SendEmailResponse,
  SendSmsResponse
} from '@oes/common/generated/notification_service'
import { NotificationServiceGrpcAdaptor } from './notification-service.grpc.adaptor'
import { AuthNotificationTrustedGrpcExecutionProducer } from './auth-notification-trusted-grpc-execution.producer'

describe('NotificationServiceGrpcAdaptor', () => {
  it('uses the target-bound trusted metadata producer and never restores body source authority', async () => {
    const emailResponse: SendEmailResponse = {
      accepted: true,
      dispatchId: 'dispatch-1',
      status: DispatchStatus.DISPATCH_STATUS_ACCEPTED
    }
    const sendEmail = jest.fn().mockReturnValue(
      of(emailResponse)
    )
    const client = {
      getService: jest.fn(() => ({
        sendEmail
      }))
    } as unknown as ClientGrpc

    const metadata = new Metadata()
    const store = new GrpcRequestContextStore()
    const trustedExecution = { createMetadata: jest.fn(async () => metadata) }
    const adaptor = new NotificationServiceGrpcAdaptor(store, trustedExecution as unknown as AuthNotificationTrustedGrpcExecutionProducer)
    ;(adaptor as any).notificationService = client.getService('NotificationService')
    adaptor.onModuleInit()

    await store.run(
      {
        internalServiceName: 'api-gateway',
        requestId: 'req-notification',
          traceId: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'
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

    expect(trustedExecution.createMetadata).toHaveBeenCalledWith(
      'req-notification',
      '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'
    )
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        category: expect.any(Number),
        templateKey: 'AUTH_OTP_EMAIL'
      }),
      metadata
    )
  })

  it('should map sms rejection responses without changing dispatch result shape', async () => {
    const smsResponse: SendSmsResponse = {
      accepted: false,
      dispatchId: '',
      status: DispatchStatus.DISPATCH_STATUS_REJECTED,
      rejectionReason: 'INVALID_RECIPIENT'
    }
    const sendSms = jest.fn().mockReturnValue(of(smsResponse))
    const client = {
      getService: jest.fn(() => ({
        sendSms
      }))
    } as unknown as ClientGrpc

    const metadata = new Metadata()
    const store = new GrpcRequestContextStore()
    const trustedExecution = { createMetadata: jest.fn(async () => metadata) }
    const adaptor = new NotificationServiceGrpcAdaptor(store, trustedExecution as unknown as AuthNotificationTrustedGrpcExecutionProducer)
    ;(adaptor as any).notificationService = client.getService('NotificationService')
    adaptor.onModuleInit()

    const result = await adaptor.sendAuthOtpSms({
      recipient: '+15555550123',
      code: '123456',
      challengeId: 'challenge-sms',
      ttlMinutes: 5
    })

    expect(result).toEqual({
      accepted: false,
      dispatchId: undefined,
      rejectionReason: 'INVALID_RECIPIENT'
    })
    expect(sendSms).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: 'AUTH_OTP_SMS',
        recipient: {
          address: '+15555550123'
        },
        idempotencyKey: 'auth:otp:sms:challenge-sms'
      }),
      metadata
    )
  })
})
