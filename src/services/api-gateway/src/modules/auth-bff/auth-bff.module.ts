import { Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { AuthorizationModule } from '@oes/common/authorization'
import { AuthController } from './interfaces/http/controllers/auth.controller'
import { AuthGrpcAdapter } from './infrastructure/downstream/auth-service/auth-grpc.adapter'
import { IdentityQueryGrpcAdapter } from './infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { PermissionAccessSummaryGrpcAdapter } from './infrastructure/downstream/permission-service/permission-access-summary-grpc.adapter'
import { LoginUseCase } from './application/use-cases/login.use-case'
import { RequestEmailOtpChallengeUseCase } from './application/use-cases/request-email-otp-challenge.use-case'
import { RequestPhoneOtpChallengeUseCase } from './application/use-cases/request-phone-otp-challenge.use-case'
import { CompleteMfaUseCase } from './application/use-cases/complete-mfa.use-case'
import { SelectAccountUseCase } from './application/use-cases/select-account.use-case'
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case'
import { SessionSelfServiceUseCase } from './application/use-cases/session-self-service.use-case'
import { MfaSelfServiceUseCase } from './application/use-cases/mfa-self-service.use-case'
import { AdminSecurityUseCase } from './application/use-cases/admin-security.use-case'
import { SessionAccessSummaryUseCase } from './application/use-cases/session-access-summary.use-case'
import { SessionContextUseCase } from './application/use-cases/session-context.use-case'

@Module({
  imports: [
    AuthorizationModule,
    GrpcTransportModule.forFeature([
      SERVICE_NAMES.AUTH,
      SERVICE_NAMES.IDENTITY,
      SERVICE_NAMES.PERMISSION
    ])
  ],
  controllers: [AuthController],
  providers: [
    AuthGrpcAdapter,
    IdentityQueryGrpcAdapter,
    PermissionAccessSummaryGrpcAdapter,
    LoginUseCase,
    RequestEmailOtpChallengeUseCase,
    RequestPhoneOtpChallengeUseCase,
    CompleteMfaUseCase,
    SelectAccountUseCase,
    RefreshSessionUseCase,
    SessionSelfServiceUseCase,
    MfaSelfServiceUseCase,
    AdminSecurityUseCase,
    SessionAccessSummaryUseCase,
    SessionContextUseCase
  ]
})
export class AuthBffModule {}
