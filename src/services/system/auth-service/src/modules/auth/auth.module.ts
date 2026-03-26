import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { CommonJwtModule } from '@oes/common/auth'
import { OPERATOR_PERMISSION_RESOLVER, SecurityModule } from '@oes/common/security'
import { REPO } from 'src/common/constants'
import { HASHING_SERVICE } from 'src/common/constants/injection-tokens'
import { AuthAuditService } from 'src/application/services/auth-audit.service'
import { LoginRiskThrottleService } from 'src/application/services/login-risk-throttle.service'
import { EmailOtpMfaChallengeService } from 'src/application/services/mfa/email-otp-mfa-challenge.service'
import { MfaChallengeVerificationService } from 'src/application/services/mfa/mfa-challenge-verification.service'
import { PhoneOtpMfaChallengeService } from 'src/application/services/mfa/phone-otp-mfa-challenge.service'
import { EmailOtpLoginService } from 'src/application/services/email-otp-login.service'
import { OtpRiskThrottleService } from 'src/application/services/otp-risk-throttle.service'
import { PhoneOtpLoginService } from 'src/application/services/phone-otp-login.service'
import { AuthCommandHandlers } from 'src/application/commands/auth'
import { AuthQueryHandlers } from 'src/application/queries'
import { AuthStrategyFactory } from 'src/domain/services/strategies/auth-strategies.factory'
import { EmailPasswordStrategy } from 'src/domain/services/strategies/email-password.strategy'
import { PhonePasswordStrategy } from 'src/domain/services/strategies/phone-password.strategy'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { PrismaUserRepository } from 'src/infrastructure/repositories/prisma/prisma.loginmethod.repository'
import { PrismaMfaBindingRepository } from 'src/infrastructure/repositories/prisma/prisma.mfabinding.repository'
import { PrismaOtpRepository } from 'src/infrastructure/repositories/prisma/prisma.otp.repository'
import { RedisLoginRiskRepository } from 'src/infrastructure/repositories/redis/risk/redis-login-risk.repository'
import { RedisOtpSendThrottleRepository } from 'src/infrastructure/repositories/redis/risk/redis-otp-send-throttle.repository'
import { RedisUserSessionRepository } from 'src/infrastructure/repositories/redis/session/redis-user-session.repository'
import { AuthAuditListener } from 'src/infrastructure/listeners/auth-audit.listener'
import { ExternalServicesModule } from 'src/infrastructure/modules/external-services.module'
import { AuthOperatorPermissionResolver } from 'src/infrastructure/security/auth-operator-permission.resolver'
import { EmailService } from 'src/infrastructure/services/email.service'
import { BcryptHashingService } from 'src/infrastructure/services/hashing.service'
import { SmsService } from 'src/infrastructure/services/sms.service'
import { AuthGrpcController } from 'src/interfaces/grpc/auth.grpc.controller'

@Module({
  imports: [
    CqrsModule,
    EventEmitterModule.forRoot(),
    PrismaModule,
    CommonJwtModule,
    SecurityModule,
    ExternalServicesModule
  ],
  providers: [
    { provide: REPO.LOGIN_METHOD, useClass: PrismaUserRepository },
    { provide: REPO.MFA_BINDING, useClass: PrismaMfaBindingRepository },
    { provide: REPO.OTP, useClass: PrismaOtpRepository },
    { provide: REPO.LOGIN_RISK, useClass: RedisLoginRiskRepository },
    { provide: REPO.OTP_SEND_THROTTLE, useClass: RedisOtpSendThrottleRepository },
    { provide: REPO.SESSION, useClass: RedisUserSessionRepository },
    { provide: HASHING_SERVICE, useClass: BcryptHashingService },
    { provide: OPERATOR_PERMISSION_RESOLVER, useClass: AuthOperatorPermissionResolver },
    ValidatingCommandBus,
    ValidatingQueryBus,
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
    AuthOperatorPermissionResolver,
    EmailOtpLoginService,
    EmailOtpMfaChallengeService,
    MfaChallengeVerificationService,
    PhoneOtpMfaChallengeService,
    LoginRiskThrottleService,
    OtpRiskThrottleService,
    PhoneOtpLoginService,
    EmailPasswordStrategy,
    PhonePasswordStrategy,
    EmailService,
    SmsService,
    ...AuthCommandHandlers,
    ...AuthQueryHandlers
  ],
  controllers: [AuthGrpcController]
})
export class AuthModule {}
