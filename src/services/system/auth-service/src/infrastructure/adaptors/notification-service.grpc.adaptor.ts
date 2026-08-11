import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { ExceptionFactory, InfrastructureException } from '@oes/common/exceptions'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import {
  DispatchPriority,
  NotificationCategory,
  NotificationServiceClient,
  NOTIFICATION_SERVICE_NAME,
  SendEmailRequest,
  SendEmailResponse,
  SendSmsResponse,
  SendSmsRequest
} from '@oes/common/generated/notification_service'
import { createGrpcClientCredentials, safeGrpcCall } from '@oes/common/transport'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { AUTH_NOTIFICATION_UPSTREAM_UNAVAILABLE } from '../../common/constants/exception-enums'
import { NotificationDispatchPort, NotificationDispatchResult } from '../../domain/services/notification-dispatch.port'
import { AuthNotificationTrustedGrpcExecutionProducer } from './auth-notification-trusted-grpc-execution.producer'

type NotificationDispatchResponse = SendEmailResponse | SendSmsResponse

@Injectable()
export class NotificationServiceGrpcAdaptor implements NotificationDispatchPort, OnModuleInit {
  private readonly logger = new Logger(NotificationServiceGrpcAdaptor.name)
  private notificationClient?: ClientGrpc
  private notificationService?: NotificationServiceClient

  constructor(
    private readonly requestContextStore: GrpcRequestContextStore,
    private readonly trustedExecution: AuthNotificationTrustedGrpcExecutionProducer
  ) {}

  onModuleInit() {
    this.service()
  }

  async sendAuthOtpEmail(input: {
    recipient: string
    code: string
    challengeId: string
    maskedDestination?: string
    ttlMinutes: number
  }): Promise<NotificationDispatchResult> {
    try {
      const response = await safeGrpcCall<SendEmailResponse>(
        this.service().sendEmail(this.buildEmailRequest(input), await this.metadata()),
        {
          caller: 'auth-service',
          method: 'NotificationService.sendEmail'
        }
      )

      return this.mapResponse(response)
    } catch (error) {
      this.rethrowIfInfrastructureError(error, 'sendAuthOtpEmail', {
        channel: 'email',
        challengeId: input.challengeId
      })
      throw error
    }
  }

  async sendAuthOtpSms(input: {
    recipient: string
    code: string
    challengeId: string
    maskedDestination?: string
    ttlMinutes: number
  }): Promise<NotificationDispatchResult> {
    try {
      const response = await safeGrpcCall<SendSmsResponse>(
        this.service().sendSms(this.buildSmsRequest(input), await this.metadata()),
        {
          caller: 'auth-service',
          method: 'NotificationService.sendSms'
        }
      )

      return this.mapResponse(response)
    } catch (error) {
      this.rethrowIfInfrastructureError(error, 'sendAuthOtpSms', {
        channel: 'sms',
        challengeId: input.challengeId
      })
      throw error
    }
  }

  async sendAccountInvitationEmail(input: {
    accountId: string
    displayName?: string
    email?: string
    recipient: string
  }): Promise<NotificationDispatchResult> {
    try {
      const response = await safeGrpcCall<SendEmailResponse>(
        this.service().sendEmail(
          {
            category: NotificationCategory.NOTIFICATION_CATEGORY_AUTH_SECURITY_ALERT,
            templateKey: 'ACCOUNT_INVITATION_EMAIL',
            recipient: {
              address: input.recipient,
              displayName: input.displayName ?? ''
            },
            variables: [
              { key: 'displayName', value: input.displayName ?? '' },
              { key: 'recipient', value: input.recipient },
              { key: 'loginMode', value: 'OTP_FIRST' }
            ],
            idempotencyKey: `account:invite:email:${input.accountId}`,
            priority: DispatchPriority.DISPATCH_PRIORITY_HIGH
          },
          await this.metadata()
        ),
        {
          caller: 'auth-service',
          method: 'NotificationService.sendEmail'
        }
      )

      return this.mapResponse(response)
    } catch (error) {
      this.rethrowIfInfrastructureError(error, 'sendAccountInvitationEmail', {
        channel: 'email',
        accountId: input.accountId
      })
      throw error
    }
  }

  async sendAccountInvitationSms(input: {
    accountId: string
    displayName?: string
    phone?: string
    recipient: string
  }): Promise<NotificationDispatchResult> {
    try {
      const response = await safeGrpcCall<SendSmsResponse>(
        this.service().sendSms(
          {
            category: NotificationCategory.NOTIFICATION_CATEGORY_AUTH_SECURITY_ALERT,
            templateKey: 'ACCOUNT_INVITATION_SMS',
            recipient: {
              address: input.recipient,
              displayName: input.displayName ?? ''
            },
            variables: [
              { key: 'displayName', value: input.displayName ?? '' },
              { key: 'recipient', value: input.recipient },
              { key: 'loginMode', value: 'OTP_FIRST' }
            ],
            idempotencyKey: `account:invite:sms:${input.accountId}`,
            priority: DispatchPriority.DISPATCH_PRIORITY_HIGH
          },
          await this.metadata()
        ),
        {
          caller: 'auth-service',
          method: 'NotificationService.sendSms'
        }
      )

      return this.mapResponse(response)
    } catch (error) {
      this.rethrowIfInfrastructureError(error, 'sendAccountInvitationSms', {
        channel: 'sms',
        accountId: input.accountId
      })
      throw error
    }
  }

  private buildEmailRequest(input: {
    recipient: string
    code: string
    challengeId: string
    maskedDestination?: string
    ttlMinutes: number
  }): SendEmailRequest {
    return {
      category: NotificationCategory.NOTIFICATION_CATEGORY_AUTH_OTP,
      templateKey: 'AUTH_OTP_EMAIL',
      recipient: {
        address: input.recipient
      },
      variables: [
        { key: 'code', value: input.code },
        { key: 'ttlMinutes', value: String(input.ttlMinutes) },
        { key: 'maskedDestination', value: input.maskedDestination ?? input.recipient }
      ],
      idempotencyKey: `auth:otp:email:${input.challengeId}`,
      priority: DispatchPriority.DISPATCH_PRIORITY_HIGH
    }
  }

  private buildSmsRequest(input: {
    recipient: string
    code: string
    challengeId: string
    maskedDestination?: string
    ttlMinutes: number
  }): SendSmsRequest {
    return {
      category: NotificationCategory.NOTIFICATION_CATEGORY_AUTH_OTP,
      templateKey: 'AUTH_OTP_SMS',
      recipient: {
        address: input.recipient
      },
      variables: [
        { key: 'code', value: input.code },
        { key: 'ttlMinutes', value: String(input.ttlMinutes) },
        { key: 'maskedDestination', value: input.maskedDestination ?? input.recipient }
      ],
      idempotencyKey: `auth:otp:sms:${input.challengeId}`,
      priority: DispatchPriority.DISPATCH_PRIORITY_HIGH
    }
  }

  private mapResponse(response: NotificationDispatchResponse): NotificationDispatchResult {
    return {
      accepted: response.accepted ?? false,
      dispatchId: response.dispatchId || undefined,
      rejectionReason: response.rejectionReason || undefined
    }
  }

  private rethrowIfInfrastructureError(
    error: unknown,
    operation: string,
    context: Record<string, string>
  ): void {
    if (!(error instanceof InfrastructureException)) {
      return
    }

    this.logger.error(`Notification upstream unavailable in ${operation}`, error)
    throw ExceptionFactory.infrastructure(AUTH_NOTIFICATION_UPSTREAM_UNAVAILABLE, {
      upstream: 'notification-service',
      operation,
      ...context
    })
  }

  private metadata() {
    const current = this.requestContextStore.getContext()
    return this.trustedExecution.createMetadata(current?.requestId, current?.traceId)
  }

  /** Builds the dedicated mTLS Notification client instead of reusing legacy discovery metadata. */
  private service(): NotificationServiceClient {
    if (this.notificationService) return this.notificationService
    this.notificationClient ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'notification_service',
        protoPath: resolveCommonProtoPath('notification_service/notification.proto'),
        url: notificationUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    this.notificationService = this.notificationClient.getService<NotificationServiceClient>(NOTIFICATION_SERVICE_NAME)
    return this.notificationService
  }
}

/** Resolves the dedicated Notification endpoint and rejects an implicit production fallback. */
function notificationUrl(): string {
  const host = process.env.NOTIFICATION_SERVICE_HOST?.trim()
  const port = process.env.NOTIFICATION_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50066'
  throw new Error('trusted notification-service gRPC url is unavailable')
}
