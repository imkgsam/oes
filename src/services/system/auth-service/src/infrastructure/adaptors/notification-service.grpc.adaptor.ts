import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { ExceptionFactory, InfrastructureException } from '@oes/common/exceptions'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
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
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { AUTH_NOTIFICATION_UPSTREAM_UNAVAILABLE } from '../../common/constants/exception-enums'
import { NotificationDispatchPort, NotificationDispatchResult } from '../../domain/services/notification-dispatch.port'

const AUTH_PRELOGIN_TENANT_ID = 'system'

type NotificationDispatchResponse = SendEmailResponse | SendSmsResponse

@Injectable()
export class NotificationServiceGrpcAdaptor implements NotificationDispatchPort, OnModuleInit {
  private readonly logger = new Logger(NotificationServiceGrpcAdaptor.name)
  private notificationService!: NotificationServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.NOTIFICATION)
    private readonly notificationClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.notificationService = this.notificationClient.getService<NotificationServiceClient>(
      NOTIFICATION_SERVICE_NAME
    )
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
        this.notificationService.sendEmail(this.buildEmailRequest(input), this.metadata()),
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
        this.notificationService.sendSms(this.buildSmsRequest(input), this.metadata()),
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
        this.notificationService.sendEmail(
          {
            source: {
              sourceService: 'auth-service',
              tenantId: AUTH_PRELOGIN_TENANT_ID,
              traceId: this.requestContextStore.getContext()?.traceId ?? '',
              requestId: this.requestContextStore.getContext()?.requestId ?? ''
            },
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
          this.metadata()
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
        this.notificationService.sendSms(
          {
            source: {
              sourceService: 'auth-service',
              tenantId: AUTH_PRELOGIN_TENANT_ID,
              traceId: this.requestContextStore.getContext()?.traceId ?? '',
              requestId: this.requestContextStore.getContext()?.requestId ?? ''
            },
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
          this.metadata()
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
    const current = this.requestContextStore.getContext()

    return {
      source: {
        sourceService: 'auth-service',
        tenantId: AUTH_PRELOGIN_TENANT_ID,
        traceId: current?.traceId ?? '',
        requestId: current?.requestId ?? ''
      },
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
    const current = this.requestContextStore.getContext()

    return {
      source: {
        sourceService: 'auth-service',
        tenantId: AUTH_PRELOGIN_TENANT_ID,
        traceId: current?.traceId ?? '',
        requestId: current?.requestId ?? ''
      },
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
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: 'auth-service',
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }
}
