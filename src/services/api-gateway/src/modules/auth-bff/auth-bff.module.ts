import { Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { AuthorizationModule } from '@oes/common/authorization'
import { PermissionServiceProxyModule } from '../permission-service/permission-service.module'
import { AuthController } from './interfaces/http/controllers/auth.controller'
import {
  ExtensionAuthController,
  KioskAuthController,
  PdaAuthController
} from './interfaces/http/controllers/terminal-auth.controller'
import { AuthGrpcAdapter } from './infrastructure/downstream/auth-service/auth-grpc.adapter'
import { AssetGrpcAdapter } from './infrastructure/downstream/asset-service/asset-grpc.adapter'
import { IdentityQueryGrpcAdapter } from './infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { PartyQueryGrpcAdapter } from './infrastructure/downstream/party-service/party-query-grpc.adapter'
import { PermissionAccessSummaryGrpcAdapter } from './infrastructure/downstream/permission-service/permission-access-summary-grpc.adapter'
import { PermissionTerminalAccessGrpcAdapter } from './infrastructure/downstream/permission-service/permission-terminal-access-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from './infrastructure/downstream/tenant-org-service/tenant-org-query-grpc.adapter'
import { TerminalDeviceAccessAdapter } from './infrastructure/downstream/terminal-device-service/terminal-device-access.adapter'
import { LoginUseCase } from './application/use-cases/login.use-case'
import { RequestEmailOtpChallengeUseCase } from './application/use-cases/request-email-otp-challenge.use-case'
import { RequestPhoneOtpChallengeUseCase } from './application/use-cases/request-phone-otp-challenge.use-case'
import { RequestMfaFactorChallengeUseCase } from './application/use-cases/request-mfa-factor-challenge.use-case'
import { CompleteMfaUseCase } from './application/use-cases/complete-mfa.use-case'
import { PasswordRecoveryUseCase } from './application/use-cases/password-recovery.use-case'
import { SelectAccountUseCase } from './application/use-cases/select-account.use-case'
import { CompleteFirstLoginPasswordSetupUseCase } from './application/use-cases/complete-first-login-password-setup.use-case'
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case'
import { SessionSelfServiceUseCase } from './application/use-cases/session-self-service.use-case'
import { MfaSelfServiceUseCase } from './application/use-cases/mfa-self-service.use-case'
import { AdminSecurityUseCase } from './application/use-cases/admin-security.use-case'
import { SessionAccessSummaryUseCase } from './application/use-cases/session-access-summary.use-case'
import { SessionContextUseCase } from './application/use-cases/session-context.use-case'
import { SessionContextsUseCase } from './application/use-cases/session-contexts.use-case'
import { SwitchContextUseCase } from './application/use-cases/switch-context.use-case'
import { PersonalCenterUseCase } from './application/use-cases/personal-center.use-case'
import { AccountProfileUseCase } from './application/use-cases/account-profile.use-case'
import { AccountAvatarUploadUseCase } from './application/use-cases/account-avatar-upload.use-case'
import { SelfContactBindingUseCase } from './application/use-cases/self-contact-binding.use-case'
import { StepUpMfaUseCase } from './application/use-cases/step-up-mfa.use-case'
import { PERSONAL_CENTER_SUMMARY_PORT } from './application/ports/personal-center-summary.port'
import { PersonalCenterSummaryAdapter } from './infrastructure/downstream/personal-center/personal-center-summary.adapter'

@Module({
  imports: [
    AuthorizationModule,
    PermissionServiceProxyModule,
    GrpcTransportModule.forFeature([
      SERVICE_NAMES.ASSET,
      SERVICE_NAMES.TERMINAL_DEVICE
    ])
  ],
  controllers: [AuthController, PdaAuthController, KioskAuthController, ExtensionAuthController],
  providers: [
    AuthGrpcAdapter,
    AssetGrpcAdapter,
    IdentityQueryGrpcAdapter,
    PartyQueryGrpcAdapter,
    PermissionAccessSummaryGrpcAdapter,
    PermissionTerminalAccessGrpcAdapter,
    TenantOrgQueryGrpcAdapter,
    TerminalDeviceAccessAdapter,
    PersonalCenterSummaryAdapter,
    {
      provide: PERSONAL_CENTER_SUMMARY_PORT,
      useExisting: PersonalCenterSummaryAdapter
    },
    LoginUseCase,
    RequestEmailOtpChallengeUseCase,
    RequestPhoneOtpChallengeUseCase,
    RequestMfaFactorChallengeUseCase,
    CompleteMfaUseCase,
    PasswordRecoveryUseCase,
    SelectAccountUseCase,
    CompleteFirstLoginPasswordSetupUseCase,
    RefreshSessionUseCase,
    SessionSelfServiceUseCase,
    MfaSelfServiceUseCase,
    AdminSecurityUseCase,
    SessionAccessSummaryUseCase,
    SessionContextUseCase,
    SessionContextsUseCase,
    SwitchContextUseCase,
    PersonalCenterUseCase,
    AccountProfileUseCase,
    AccountAvatarUploadUseCase,
    SelfContactBindingUseCase,
    StepUpMfaUseCase
  ],
  exports: [AuthGrpcAdapter, SessionContextUseCase]
})
export class AuthBffModule {}
