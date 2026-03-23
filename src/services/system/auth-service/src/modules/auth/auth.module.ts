import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { CommonJwtModule } from '@oes/common/auth'
import {
  LOGIN_RISK_REPOSITORY,
  LOGIN_METHOD_REPOSITORY,
  MFA_BINDING_REPOSITORY,
  OTP_REPOSITORY,
  OTP_SEND_THROTTLE_REPOSITORY,
  SESSION_REPOSITORY,
  HASHING_SERVICE
} from 'src/common/constants/injection-tokens'
import { AuthAuditService } from 'src/application/services/auth-audit.service'
import { LoginRiskThrottleService } from 'src/application/services/login-risk-throttle.service'
import { EmailOtpMfaChallengeService } from 'src/application/services/mfa/email-otp-mfa-challenge.service'
import { MfaChallengeVerificationService } from 'src/application/services/mfa/mfa-challenge-verification.service'
import { OtpRiskThrottleService } from 'src/application/services/otp-risk-throttle.service'
import { SessionService } from 'src/application/services/session.service'
import { MfaService } from 'src/application/services/mfa.service'
import { AuthCommandHandlers } from 'src/application/commands/auth'
import { AuthStrategyFactory } from 'src/domain/services/strategies/auth-strategies.factory'
import { EmailPasswordStrategy } from 'src/domain/services/strategies/email-password.strategy'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { PrismaUserRepository } from 'src/infrastructure/repositories/prisma/prisma.loginmethod.repository'
import { PrismaMfaBindingRepository } from 'src/infrastructure/repositories/prisma/prisma.mfabinding.repository'
import { PrismaOtpRepository } from 'src/infrastructure/repositories/prisma/prisma.otp.repository'
import { RedisLoginRiskRepository } from 'src/infrastructure/repositories/redis/risk/redis-login-risk.repository'
import { RedisOtpSendThrottleRepository } from 'src/infrastructure/repositories/redis/risk/redis-otp-send-throttle.repository'
import { RedisUserSessionRepository } from 'src/infrastructure/repositories/redis/session/redis-user-session.repository'
import { AuthAuditListener } from 'src/infrastructure/listeners/auth-audit.listener'
import { ExternalServicesModule } from 'src/infrastructure/modules/external-services.module'
import { EmailService } from 'src/infrastructure/services/email.service'
import { SmsService } from 'src/infrastructure/services/sms.service'
import { BcryptHashingService } from 'src/infrastructure/services/hashing.service'
import { AuthGrpcController } from 'src/interfaces/grpc/auth.grpc.controller'

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot(), PrismaModule, CommonJwtModule, ExternalServicesModule],
  providers: [
    { provide: LOGIN_METHOD_REPOSITORY, useClass: PrismaUserRepository },
    { provide: MFA_BINDING_REPOSITORY, useClass: PrismaMfaBindingRepository },
    { provide: OTP_REPOSITORY, useClass: PrismaOtpRepository },
    { provide: LOGIN_RISK_REPOSITORY, useClass: RedisLoginRiskRepository },
    { provide: OTP_SEND_THROTTLE_REPOSITORY, useClass: RedisOtpSendThrottleRepository },
    { provide: SESSION_REPOSITORY, useClass: RedisUserSessionRepository },
    { provide: HASHING_SERVICE, useClass: BcryptHashingService },
    ValidatingCommandBus,
    ValidatingQueryBus,
    {
      provide: AuthStrategyFactory,
      useFactory: (emailPasswordStrategy: EmailPasswordStrategy) => {
        const factory = new AuthStrategyFactory()
        factory.register(emailPasswordStrategy)
        return factory
      },
      inject: [EmailPasswordStrategy]
    },
    AuthAuditService,
    AuthAuditListener,
    EmailOtpMfaChallengeService,
    MfaChallengeVerificationService,
    LoginRiskThrottleService,
    OtpRiskThrottleService,
    SessionService,
    MfaService,
    EmailPasswordStrategy,
    EmailService,
    SmsService,
    ...AuthCommandHandlers
  ],
  controllers: [AuthGrpcController]
})
export class AuthModule {}
