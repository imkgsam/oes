import { Module } from '@nestjs/common'
import { PrismaUserRepository } from 'src/infrastructure/repositories/prisma/prisma.loginmethod.repository'
import { TcpAuthController } from 'src/interfaces/tcp/controllers/auth.controller'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { TcpTestController } from 'src/interfaces/tcp/controllers/test.controller'
import { USER_REPOSITORY } from 'src/common/constants/injection-tokens'
import { AuthService } from 'src/application/services/auth-service'
import { AuthStrategyFactory } from 'src/domain/services/strategies/auth-strategies.factory'
import { SessionService } from 'src/application/services/session.service'
import { MfaService } from 'src/application/services/mfa.service'
import { EmailPasswordStrategy } from 'src/domain/services/strategies/email-password.strategy'
import { CommonJwtModule } from '@oes/common/modules/jwt/jwt.module'
import { ExternalServicesModule } from 'src/infrastructure/modules/external-services.module'
import { EmailService } from 'src/infrastructure/services/email.service'
import { SmsService } from 'src/infrastructure/services/sms.service'
import { PrismaMfaBindingRepository } from 'src/infrastructure/repositories/prisma/prisma.mfabinding.repository'
import { PrismaOtpRepository } from 'src/infrastructure/repositories/prisma/prisma.otp.repository'
import {
  MFA_BINDING_REPOSITORY,
  OTP_REPOSITORY,
  SESSION_REPOSITORY,
  HASHING_SERVICE
} from 'src/common/constants/injection-tokens'
import { BcryptHashingService } from 'src/infrastructure/services/hashing.service'
import { RedisUserSessionRepository } from 'src/infrastructure/repositories/redis/session/redis-user-session.repository'

@Module({
  imports: [
    PrismaModule,
    CommonJwtModule,
    ExternalServicesModule,
    ClientModule.register([ServiceKeys.PERMISSION_TCP])
  ],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: MFA_BINDING_REPOSITORY, useClass: PrismaMfaBindingRepository },
    { provide: OTP_REPOSITORY, useClass: PrismaOtpRepository },
    { provide: SESSION_REPOSITORY, useClass: RedisUserSessionRepository },
    { provide: HASHING_SERVICE, useClass: BcryptHashingService },
    AuthService,
    AuthStrategyFactory,
    SessionService,
    MfaService,
    EmailPasswordStrategy,
    EmailService,
    SmsService
  ],
  controllers: [TcpAuthController, TcpTestController]
})
export class AuthModule {}
