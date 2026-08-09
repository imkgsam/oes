import { Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { CqrsModule } from '@nestjs/cqrs'
import { EventEmitterModule } from '@nestjs/event-emitter'
import Redis from 'ioredis'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { CommonJwtModule } from '@oes/common/auth'
import {
  createLazyTrustedExecutionRuntime,
  ExecutionTokenVerifier,
  OPERATOR_PERMISSION_RESOLVER,
  PermissionServicePermissionReadAdaptor,
  RoleBasedOperatorPermissionResolver,
  AuthorizationModule,
  TrustedInternalExecutionGuard
} from '@oes/common/authorization'
import { REPO } from '../../common/constants'
import {
  HASHING_SERVICE,
  NOTIFICATION_DISPATCH_PORT,
  TERMINAL_DEVICE_UNAVAILABLE_REDIS_CLIENT
} from '../../common/constants/injection-tokens'
import {
  AdminUserSessionQueryScopeBuilder,
  AuditEventQueryScopeBuilder,
  AUTHORIZATION_QUERY_SCOPE_BUILDERS,
  AuthorizationQueryScopeService,
  CheckResourceService,
  QueryScopeBuilder
} from '../../application/authorization'
import { AuthAuditService } from '../../application/services/auth-audit.service'
import { AccountSessionEstablishmentService } from '../../application/services/account-session-establishment.service'
import { TenantSessionAccessService } from '../../application/services/tenant-session-access.service'
import { LoginRiskThrottleService } from '../../application/services/login-risk-throttle.service'
import { AccountInvitationService } from '../../application/services/account-invitation.service'
import { ContactBindingVerificationService } from '../../application/services/contact-binding-verification.service'
import { EmailOtpMfaChallengeService } from '../../application/services/mfa/email-otp-mfa-challenge.service'
import { LoginMfaOrchestrationService } from '../../application/services/mfa/login-mfa-orchestration.service'
import { MfaBindingManagementService } from '../../application/services/mfa/mfa-binding-management.service'
import { MfaChallengeVerificationService } from '../../application/services/mfa/mfa-challenge-verification.service'
import { PhoneOtpMfaChallengeService } from '../../application/services/mfa/phone-otp-mfa-challenge.service'
import { StepUpMfaGrantService } from '../../application/services/mfa/step-up-mfa-grant.service'
import { TotpMfaChallengeService } from '../../application/services/mfa/totp-mfa-challenge.service'
import { EmailOtpLoginService } from '../../application/services/email-otp-login.service'
import { OtpRiskThrottleService } from '../../application/services/otp-risk-throttle.service'
import { PasswordRecoveryService } from '../../application/services/password-recovery.service'
import { PasswordSetupRequirementService } from '../../application/services/password-setup-requirement.service'
import { PdaAccountResolutionService } from '../../application/services/pda-account-resolution.service'
import { PdaPrimaryLoginCompletionService } from '../../application/services/pda-primary-login-completion.service'
import { PhoneOtpLoginService } from '../../application/services/phone-otp-login.service'
import { TerminalLoginPolicyService } from '../../application/services/terminal-login-policy.service'
import { TerminalMfaPolicyService } from '../../application/services/terminal-mfa-policy.service'
import { TrustedDeviceService } from '../../application/services/trusted-device.service'
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
import { PrismaPasswordRecoveryGrantRepository } from '../../infrastructure/repositories/prisma/prisma.password-recovery-grant.repository'
import { PrismaPasswordSetupRequirementRepository } from '../../infrastructure/repositories/prisma/prisma.password-setup-requirement.repository'
import { PrismaPlatformMfaPolicyRepository } from '../../infrastructure/repositories/prisma/prisma.platform-mfa-policy.repository'
import { PrismaTenantMfaPolicyRepository } from '../../infrastructure/repositories/prisma/prisma.tenant-mfa-policy.repository'
import { PrismaTerminalPinResetRequirementRepository } from '../../infrastructure/repositories/prisma/prisma.terminal-pin-reset-requirement.repository'
import { PrismaTerminalLoginPolicyRepository } from '../../infrastructure/repositories/prisma/prisma.terminal-login-policy.repository'
import { PrismaTerminalMfaPolicyRepository } from '../../infrastructure/repositories/prisma/prisma.terminal-mfa-policy.repository'
import { PrismaTrustedDeviceRepository } from '../../infrastructure/repositories/prisma/prisma.trusted-device.repository'
import { RedisLoginRiskRepository } from '../../infrastructure/repositories/redis/risk/redis-login-risk.repository'
import { RedisOtpSendThrottleRepository } from '../../infrastructure/repositories/redis/risk/redis-otp-send-throttle.repository'
import { RedisUserSessionRepository } from '../../infrastructure/repositories/redis/session/redis-user-session.repository'
import { NotificationServiceGrpcAdaptor } from '../../infrastructure/adaptors/notification-service.grpc.adaptor'
import { AuthAuditListener } from '../../infrastructure/listeners/auth-audit.listener'
import { TerminalDeviceUnavailableSubscriber } from '../../infrastructure/listeners/terminal-device-unavailable.subscriber'
import { ExternalServicesModule } from '../../infrastructure/modules/external-services.module'
import { LocalNotificationDispatchAdaptor } from '../../infrastructure/adaptors/local-notification-dispatch.adaptor'
import { EmailService } from '../../infrastructure/services/email.service'
import { BcryptHashingService } from '../../infrastructure/services/hashing.service'
import { SmsService } from '../../infrastructure/services/sms.service'
import { AuthGrpcController } from '../../interfaces/grpc/auth.grpc.controller'
import { ExternalApiKeyGrpcController } from '../../interfaces/grpc/external-api-key.grpc.controller'
import { ExecutionTokenModule } from '../token/execution-token.module'
import { EXECUTION_TOKEN_SIGNER } from '../token/execution-token.module'
import { UdsSignerClient } from '../../infrastructure/execution-token-signer/uds-signer.client'
import { GatewayExternalAccessTokenIssuer } from '../../application/services/gateway-external-access-token-issuer'
import { EXTERNAL_API_KEY_VERIFIER_PORT } from '../../application/ports/external-api-key-verifier.port'
import { ProtectedExternalApiKeyVerifierAdapter } from '../../infrastructure/services/protected-external-api-key-verifier.adapter'
import { LocalDevelopmentExternalApiKeyVerifier } from '../../infrastructure/services/local-development-external-api-key-verifier'
import { ExternalApiKeyRequestContextAdapter } from '../../interfaces/grpc/external-api-key-context.adapter'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { EXTERNAL_API_KEY_CONTEXT_PORT } from '../../common/constants/injection-tokens'
import { EXTERNAL_API_KEY_AUDIT_PORT } from '../../common/constants/injection-tokens'
import { TENANT_LIFECYCLE_ACCESS_PORT } from '../../common/constants/injection-tokens'
import { ExternalApiKeyAuditAdapter } from '../../infrastructure/adaptors/external-api-key-audit.adapter'
import { ExternalApiKeyCredentialService } from '../../application/services/external-api-key-credential.service'
import { ExternalApiKeyVerifierCompromiseService } from '../../application/services/external-api-key-verifier-compromise.service'
import { PrismaExternalApiKeyCredentialRepository } from '../../infrastructure/repositories/prisma/prisma.external-api-key-credential.repository'
import { PrismaExternalApiKeyVerifierCompromiseRepository } from '../../infrastructure/repositories/prisma/prisma.external-api-key-verifier-compromise.repository'
import { PrismaMachineWorkloadSourceCredentialRepository } from '../../infrastructure/repositories/prisma/prisma.machine-workload-source-credential.repository'
import { MachineWorkloadSourceCredentialService } from '../../application/services/machine-workload-source-credential.service'
import { MachineWorkloadSourceCredentialGrpcController } from '../../interfaces/grpc/machine-workload-source-credential.grpc.controller'
import { IIdentityServicePort } from '../../application/ports/identity-service.port'
import { ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'
import {
  EXTERNAL_API_KEY_IDENTITY_OWNER_PORT,
  EXTERNAL_API_KEY_PERMISSION_SNAPSHOT_PORT
} from '../../common/constants/injection-tokens'
import { IDENTITY_SERVICE, PERMISSION_SERVICE } from '@oes/common/constants'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'

const AUTH_SERVICE_AUDIENCE = 'urn:oes:service:auth-service'

@Module({
  imports: [
    CqrsModule,
    EventEmitterModule.forRoot(),
    PrismaModule,
    CommonJwtModule,
    AuthorizationModule,
    ExternalServicesModule,
    ExecutionTokenModule
  ],
  providers: [
    { provide: REPO.AUDIT_EVENT, useExisting: PrismaAuthAuditRepository },
    { provide: REPO.LOGIN_METHOD, useClass: PrismaUserRepository },
    { provide: REPO.MFA_BINDING, useClass: PrismaMfaBindingRepository },
    { provide: REPO.OTP, useClass: PrismaOtpRepository },
    { provide: REPO.PASSWORD_RECOVERY_GRANT, useClass: PrismaPasswordRecoveryGrantRepository },
    { provide: REPO.PLATFORM_MFA_POLICY, useClass: PrismaPlatformMfaPolicyRepository },
    { provide: REPO.TENANT_MFA_POLICY, useClass: PrismaTenantMfaPolicyRepository },
    { provide: REPO.TERMINAL_LOGIN_POLICY, useClass: PrismaTerminalLoginPolicyRepository },
    { provide: REPO.TERMINAL_MFA_POLICY, useClass: PrismaTerminalMfaPolicyRepository },
    { provide: REPO.TRUSTED_DEVICE, useClass: PrismaTrustedDeviceRepository },
    {
      provide: REPO.PASSWORD_SETUP_REQUIREMENT,
      useClass: PrismaPasswordSetupRequirementRepository
    },
    {
      provide: REPO.TERMINAL_PIN_RESET_REQUIREMENT,
      useClass: PrismaTerminalPinResetRequirementRepository
    },
    { provide: REPO.LOGIN_RISK, useClass: RedisLoginRiskRepository },
    { provide: REPO.OTP_SEND_THROTTLE, useClass: RedisOtpSendThrottleRepository },
    { provide: REPO.SESSION, useClass: RedisUserSessionRepository },
    {
      provide: TERMINAL_DEVICE_UNAVAILABLE_REDIS_CLIENT,
      useFactory: () =>
        new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0', 10)
        })
    },
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
    AccountSessionEstablishmentService,
    TenantSessionAccessService,
    AuthAuditListener,
    TerminalDeviceUnavailableSubscriber,
    AccountInvitationService,
    ContactBindingVerificationService,
    EmailOtpLoginService,
    EmailOtpMfaChallengeService,
    LoginMfaOrchestrationService,
    MfaBindingManagementService,
    MfaChallengeVerificationService,
    PhoneOtpMfaChallengeService,
    StepUpMfaGrantService,
    TotpMfaChallengeService,
    LoginRiskThrottleService,
    OtpRiskThrottleService,
    PasswordRecoveryService,
    PasswordSetupRequirementService,
    PdaAccountResolutionService,
    PdaPrimaryLoginCompletionService,
    PhoneOtpLoginService,
    TerminalLoginPolicyService,
    TerminalMfaPolicyService,
    TrustedDeviceService,
    EmailPasswordStrategy,
    PhonePasswordStrategy,
    LocalNotificationDispatchAdaptor,
    NotificationServiceGrpcAdaptor,
    EmailService,
    SmsService,
    PrismaAuthAuditRepository,
    PrismaPasswordRecoveryGrantRepository,
    PrismaPasswordSetupRequirementRepository,
    PrismaPlatformMfaPolicyRepository,
    PrismaTenantMfaPolicyRepository,
    PrismaTerminalLoginPolicyRepository,
    PrismaTerminalMfaPolicyRepository,
    PrismaTrustedDeviceRepository,
    PrismaExternalApiKeyCredentialRepository,
    PrismaMachineWorkloadSourceCredentialRepository,
    PrismaExternalApiKeyVerifierCompromiseRepository,
    {
      provide: ExecutionTokenVerifier,
      useFactory: () => createLazyTrustedExecutionRuntime(AUTH_SERVICE_AUDIENCE).verifier
    },
    {
      provide: GrpcWorkloadIdentityProvider,
      useFactory: () =>
        createLazyTrustedExecutionRuntime(AUTH_SERVICE_AUDIENCE).workloadIdentityProvider
    },
    {
      provide: TrustedInternalExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        workloadIdentityProvider: GrpcWorkloadIdentityProvider
      ) =>
        new TrustedInternalExecutionGuard(
          reflector,
          verifier,
          workloadIdentityProvider,
          AUTH_SERVICE_AUDIENCE
        ),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider]
    },
    GrpcRequestContextStore,
    ExternalApiKeyRequestContextAdapter,
    { provide: EXTERNAL_API_KEY_CONTEXT_PORT, useExisting: ExternalApiKeyRequestContextAdapter },
    {
      provide: ExternalApiKeyAuditAdapter,
      useFactory: (repository: PrismaAuthAuditRepository) =>
        new ExternalApiKeyAuditAdapter(async (event) => repository.append(event as any)),
      inject: [PrismaAuthAuditRepository]
    },
    { provide: EXTERNAL_API_KEY_AUDIT_PORT, useExisting: ExternalApiKeyAuditAdapter },
    { provide: EXTERNAL_API_KEY_IDENTITY_OWNER_PORT, useExisting: IDENTITY_SERVICE },
    { provide: EXTERNAL_API_KEY_PERMISSION_SNAPSHOT_PORT, useExisting: PERMISSION_SERVICE },
    {
      provide: EXTERNAL_API_KEY_VERIFIER_PORT,
      useFactory: () => createExternalApiKeyVerifierProvider()
    },
    {
      provide: ExternalApiKeyVerifierCompromiseService,
      useFactory: (verifier: any, store: PrismaExternalApiKeyVerifierCompromiseRepository) =>
        new ExternalApiKeyVerifierCompromiseService(verifier, store),
      inject: [EXTERNAL_API_KEY_VERIFIER_PORT, PrismaExternalApiKeyVerifierCompromiseRepository]
    },
    {
      provide: GatewayExternalAccessTokenIssuer,
      useFactory: (signer: any) =>
        new GatewayExternalAccessTokenIssuer(process.env.AUTH_EXECUTION_ISSUER ?? '', signer),
      inject: [EXECUTION_TOKEN_SIGNER]
    },
    {
      provide: MachineWorkloadSourceCredentialService,
      useFactory: (
        identity: IIdentityServicePort,
        repository: PrismaMachineWorkloadSourceCredentialRepository,
        signer: ExecutionTokenSigningPort
      ) => new MachineWorkloadSourceCredentialService(identity, repository, signer, requireMachineIssuer()),
      inject: [IDENTITY_SERVICE, PrismaMachineWorkloadSourceCredentialRepository, EXECUTION_TOKEN_SIGNER]
    },
    {
      provide: ExternalApiKeyCredentialService,
      useFactory: (
        repository: PrismaExternalApiKeyCredentialRepository,
        verifier: any,
        identity: any,
        tenantLifecycle: any,
        permission: any,
        context: any,
        audit: ExternalApiKeyAuditAdapter,
        issuer: GatewayExternalAccessTokenIssuer
      ) =>
        new ExternalApiKeyCredentialService(
          {
            create: async (credentialId, credential) =>
              repository.create({
                id: credentialId,
                integrationMachineId: credential.integrationMachineId,
                tenantId: credential.tenantId,
                keyIdentifier: credential.keyIdentifier,
                verifier: credential.verifier,
                verifierKeyVersion: credential.verifierKeyVersion,
                expiresAt: credential.expiresAt
              }),
            findById: async (credentialId) => repository.findById(credentialId),
            findByIdentifier: async (keyIdentifier) => repository.findByIdentifier(keyIdentifier),
            listByMachine: async (integrationMachineId, tenantId) =>
              repository.listByMachine(integrationMachineId, tenantId),
            listUsableVerifierKeyVersions: async (now) =>
              repository.listUsableVerifierKeyVersions(now),
            revoke: async (credentialId) => repository.revoke(credentialId),
            rotate: async (input) => repository.rotate(input)
          } as any,
          verifier,
          { resolve: (id: string) => identity.resolveIntegrationMachineForAuth(id) },
          tenantLifecycle,
          {
            snapshot: (id: string, tenantId: string) =>
              permission.resolveExternalMachineAuthorizationSnapshot(id, tenantId)
          },
          context,
          audit,
          issuer
        ),
      inject: [
        PrismaExternalApiKeyCredentialRepository,
        EXTERNAL_API_KEY_VERIFIER_PORT,
        EXTERNAL_API_KEY_IDENTITY_OWNER_PORT,
        TENANT_LIFECYCLE_ACCESS_PORT,
        EXTERNAL_API_KEY_PERMISSION_SNAPSHOT_PORT,
        EXTERNAL_API_KEY_CONTEXT_PORT,
        EXTERNAL_API_KEY_AUDIT_PORT,
        GatewayExternalAccessTokenIssuer
      ]
    },
    ...AuthCommandHandlers,
    ...AuthQueryHandlers
  ],
  controllers: [AuthGrpcController, ExternalApiKeyGrpcController, MachineWorkloadSourceCredentialGrpcController],
  exports: [ExternalApiKeyCredentialService]
})
export class AuthModule {}

/** Reads the same deployment-bound issuer source used by the execution-token signer configuration. */
function requireMachineIssuer(): string {
  const issuer = process.env.AUTH_EXECUTION_ISSUER?.trim()
  if (!issuer) throw new Error('AUTH_EXECUTION_ISSUER is required')
  return issuer
}

/** Chooses the protected provider by default and allows the explicit local-development profile only when requested. */
export function createExternalApiKeyVerifierProvider() {
  if (process.env.AUTH_EXTERNAL_API_KEY_VERIFIER_PROVIDER?.trim() === 'local-development') {
    return new LocalDevelopmentExternalApiKeyVerifier(
      process.env.NODE_ENV,
      process.env.AUTH_EXTERNAL_API_KEY_VERIFIER_SECURITY_PROFILE,
      process.env.AUTH_EXTERNAL_API_KEY_LOCAL_VERIFIER_KEY_PATH,
      process.env.AUTH_EXTERNAL_API_KEY_LOCAL_VERIFIER_KEY_VERSION
    )
  }
  const socketPath = optionalAbsoluteUnixSocketPath('AUTH_EXECUTION_SIGNER_SOCKET_PATH')
  return new ProtectedExternalApiKeyVerifierAdapter(
    socketPath ? new UdsSignerClient(socketPath) : undefined
  )
}

/** Admits only the sole permitted pod-local signer endpoint while leaving a missing/malformed binding capability-scoped and fail closed. */
function optionalAbsoluteUnixSocketPath(name: string): string | undefined {
  const value = process.env[name]?.trim()
  if (!value || !value.startsWith('/')) {
    return undefined
  }
  return value
}
