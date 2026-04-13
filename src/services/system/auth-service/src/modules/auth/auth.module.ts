import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { CommonJwtModule } from '@oes/common/auth'
import {
  OPERATOR_PERMISSION_RESOLVER,
  PermissionServicePermissionReadAdaptor,
  RoleBasedOperatorPermissionResolver,
  AuthorizationModule
} from '@oes/common/authorization'
import { REPO } from '../../common/constants'
import { HASHING_SERVICE, NOTIFICATION_DISPATCH_PORT } from '../../common/constants/injection-tokens'
import {
  AdminUserSessionQueryScopeBuilder,
  AuditEventQueryScopeBuilder,
  AUTHORIZATION_QUERY_SCOPE_BUILDERS,
  AuthorizationQueryScopeService,
  CheckResourceService,
  QueryScopeBuilder
} from '../../application/authorization'
import { AuthAuditService } from '../../application/services/auth-audit.service'
import { LoginRiskThrottleService } from '../../application/services/login-risk-throttle.service'
import { EmailOtpMfaChallengeService } from '../../application/services/mfa/email-otp-mfa-challenge.service'
import { MfaBindingManagementService } from '../../application/services/mfa/mfa-binding-management.service'
import { MfaChallengeVerificationService } from '../../application/services/mfa/mfa-challenge-verification.service'
import { PhoneOtpMfaChallengeService } from '../../application/services/mfa/phone-otp-mfa-challenge.service'
import { TotpMfaChallengeService } from '../../application/services/mfa/totp-mfa-challenge.service'
import { EmailOtpLoginService } from '../../application/services/email-otp-login.service'
import { OtpRiskThrottleService } from '../../application/services/otp-risk-throttle.service'
import { PhoneOtpLoginService } from '../../application/services/phone-otp-login.service'
import { AuthCommandHandlers } from '../../application/commands/auth'
import { AuthQueryHandlers } from '../../application/queries'
import { AuthStrategyFactory } from '../../domain/services/strategies/auth-strategies.factory'
import { EmailPasswordStrategy } from '../../domain/services/strategies/email-password.strategy'
import { PhonePasswordStrategy } from '../../domain/services/strategies/phone-password.strategy'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaAuthAuditRepository } from '../../infrastructure/repositories/prisma/prisma.auth-audit.repository'
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma/prisma.loginmethod.repository'
import { PrismaMfaBindingRepository } from '../../infrastructure/repositories/prisma/prisma.mfabinding.repository'
import { PrismaOtpRepository } from '../../infrastructure/repositories/prisma/prisma.otp.repository'
import { RedisLoginRiskRepository } from '../../infrastructure/repositories/redis/risk/redis-login-risk.repository'
import { RedisOtpSendThrottleRepository } from '../../infrastructure/repositories/redis/risk/redis-otp-send-throttle.repository'
import { RedisUserSessionRepository } from '../../infrastructure/repositories/redis/session/redis-user-session.repository'
import { NotificationServiceGrpcAdaptor } from '../../infrastructure/adaptors/notification-service.grpc.adaptor'
import { AuthAuditListener } from '../../infrastructure/listeners/auth-audit.listener'
import { ExternalServicesModule } from '../../infrastructure/modules/external-services.module'
import { LocalNotificationDispatchAdaptor } from '../../infrastructure/adaptors/local-notification-dispatch.adaptor'
import { EmailService } from '../../infrastructure/services/email.service'
import { BcryptHashingService } from '../../infrastructure/services/hashing.service'
import { SmsService } from '../../infrastructure/services/sms.service'
import { AuthGrpcController } from '../../interfaces/grpc/auth.grpc.controller'

@Module({
  imports: [
    CqrsModule,
    EventEmitterModule.forRoot(),
    PrismaModule,
    CommonJwtModule,
    AuthorizationModule,
    ExternalServicesModule
  ],
  providers: [
    { provide: REPO.AUDIT_EVENT, useExisting: PrismaAuthAuditRepository },
    { provide: REPO.LOGIN_METHOD, useClass: PrismaUserRepository },
    { provide: REPO.MFA_BINDING, useClass: PrismaMfaBindingRepository },
    { provide: REPO.OTP, useClass: PrismaOtpRepository },
    { provide: REPO.LOGIN_RISK, useClass: RedisLoginRiskRepository },
    { provide: REPO.OTP_SEND_THROTTLE, useClass: RedisOtpSendThrottleRepository },
    { provide: REPO.SESSION, useClass: RedisUserSessionRepository },
    { provide: HASHING_SERVICE, useClass: BcryptHashingService },
    {
      provide: NOTIFICATION_DISPATCH_PORT,
      useFactory: (
        localAdaptor: LocalNotificationDispatchAdaptor,
        grpcAdaptor: NotificationServiceGrpcAdaptor
      ) => {
        return process.env.AUTH_NOTIFICATION_TRANSPORT === 'grpc' ? grpcAdaptor : localAdaptor
      },
      inject: [LocalNotificationDispatchAdaptor, NotificationServiceGrpcAdaptor]
    },
    PermissionServicePermissionReadAdaptor,
    RoleBasedOperatorPermissionResolver,
    { provide: OPERATOR_PERMISSION_RESOLVER, useExisting: RoleBasedOperatorPermissionResolver },
    ValidatingCommandBus,
    ValidatingQueryBus,
    CheckResourceService,
    AuthorizationQueryScopeService,
    AuditEventQueryScopeBuilder,
    AdminUserSessionQueryScopeBuilder,
    {
      provide: AUTHORIZATION_QUERY_SCOPE_BUILDERS,
      useFactory: (
        auditEventBuilder: AuditEventQueryScopeBuilder,
        adminUserSessionBuilder: AdminUserSessionQueryScopeBuilder
      ): QueryScopeBuilder[] => [auditEventBuilder, adminUserSessionBuilder],
      inject: [AuditEventQueryScopeBuilder, AdminUserSessionQueryScopeBuilder]
    },
    {
      provide: AuthStrategyFactory,
      useFactory: (
        emailPasswordStrategy: EmailPasswordStrategy,
        phonePasswordStrategy: PhonePasswordStrategy
      ) => {
        const factory = new AuthStrategyFactory()
        factory.register(emailPasswordStrategy)
        factory.register(phonePasswordStrategy)
        return factory
      },
      inject: [EmailPasswordStrategy, PhonePasswordStrategy]
    },
    AuthAuditService,
    AuthAuditListener,
    EmailOtpLoginService,
    EmailOtpMfaChallengeService,
    MfaBindingManagementService,
    MfaChallengeVerificationService,
    PhoneOtpMfaChallengeService,
    TotpMfaChallengeService,
    LoginRiskThrottleService,
    OtpRiskThrottleService,
    PhoneOtpLoginService,
    EmailPasswordStrategy,
    PhonePasswordStrategy,
    LocalNotificationDispatchAdaptor,
    NotificationServiceGrpcAdaptor,
    EmailService,
    SmsService,
    PrismaAuthAuditRepository,
    ...AuthCommandHandlers,
    ...AuthQueryHandlers
  ],
  controllers: [AuthGrpcController]
})
export class AuthModule {}
