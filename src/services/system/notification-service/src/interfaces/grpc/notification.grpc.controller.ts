import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthorizeInternalCall,
  getAuthenticatedGrpcRequestContext,
  GrpcRequestContextInterceptor,
  GrpcRequestContextStore,
  TrustedInternalExecutionGuard,
  NOTIFICATION_INTERNAL_PERMISSION_CODES
} from '@oes/common/authorization'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'
import {
  NotificationServiceController,
  NotificationServiceControllerMethods,
  SendEmailRequest,
  SendEmailResponse,
  SendSmsResponse,
  SendSmsRequest
} from '@oes/common/generated/notification_service'
import { SendEmailCommand, SendSmsCommand, TrustedNotificationDispatchAuthority } from '../../application/commands'

const AUTH_NOTIFICATION_WORKLOAD = 'AUTH_NOTIFICATION_AUTH_SPIFFE_ID'

/** Exposes only the two Auth-owned INTERNAL dispatch methods after mTLS and ExecutionToken proof. */
@UseFilters(GrpcExceptionFilter)
@UseInterceptors(GrpcRequestContextInterceptor)
@UseGuards(TrustedInternalExecutionGuard)
@Controller()
@NotificationServiceControllerMethods()
export class NotificationGrpcController implements NotificationServiceController {
  constructor(private readonly commandBus: ValidatingCommandBus, private readonly requestContext: GrpcRequestContextStore) {}

  @AuthorizeInternalCall({ all: [NOTIFICATION_INTERNAL_PERMISSION_CODES.AUTH_DISPATCH] })
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    return this.commandBus.execute(new SendEmailCommand(request, this.authorityFrom(request)))
  }

  @AuthorizeInternalCall({ all: [NOTIFICATION_INTERNAL_PERMISSION_CODES.AUTH_DISPATCH] })
  async sendSms(request: SendSmsRequest): Promise<SendSmsResponse> {
    return this.commandBus.execute(new SendSmsCommand(request, this.authorityFrom(request)))
  }

  /** Narrows Common's generic INTERNAL proof to the frozen Auth SYSTEM MACHINE source before handlers run. */
  private authorityFrom(request: object): TrustedNotificationDispatchAuthority {
    const verified = getAuthenticatedGrpcRequestContext(request)?.verifiedExecutionToken
    const transport = getAuthenticatedGrpcRequestContext(request)?.verifiedWorkloadIdentity
    const current = this.requestContext.getContext()
    const requiredWorkload = process.env[AUTH_NOTIFICATION_WORKLOAD]
    if (
      !verified || !transport || !requiredWorkload || requiredWorkload.trim() !== requiredWorkload ||
      verified.principalType !== 'MACHINE' || verified.tenantId !== undefined || verified.orgId !== undefined ||
      verified.actor !== undefined || verified.delegationId !== undefined || verified.clientId !== requiredWorkload ||
      transport.spiffeId !== requiredWorkload || verified.subject.trim().length === 0
    ) {
      throw new Error('NOTIFICATION_AUTH_DISPATCH_TRUST_REJECTED')
    }
    return Object.freeze({
      sourceService: requiredWorkload,
      machinePrincipal: verified.subject,
      ...(current?.traceId ? { traceId: current.traceId } : {}),
      ...(current?.requestId ? { requestId: current.requestId } : {})
    })
  }
}
