import { Controller, Module, UseFilters, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { INestApplication, INestMicroservice } from '@nestjs/common'
import { GrpcMethod, MicroserviceOptions, RpcException, Transport } from '@nestjs/microservices'
import { NestFactory } from '@nestjs/core'
import { APP_GUARD } from '@nestjs/core'
import request from 'supertest'
import { ConfigModule } from '@nestjs/config'
import { CommonJwtModule, CommonJwtService } from '@oes/common/auth'
import { GatewayPermissionGuard } from '@oes/common/authorization'
import { LoggingModule } from '@oes/common/logging'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { AuthBffModule } from '../../../auth-bff.module'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  LoginStatus,
  MfaBindingType
} from '@oes/common/generated/auth_service'
import {
  PermissionCheckServiceController,
  PermissionCheckServiceControllerMethods
} from '@oes/common/generated/permission_service'
import { GatewaySessionAuthGuard } from '../../../../../common/guards/gateway-session-auth.guard'
import { GrpcExceptionFilter } from '../../../../../../../../common/dist/core/filters'
import { GatewayExceptionFilter } from '../../../../../common/filters/gateway-exception.filter'

const AUTH_PORT = 56050
const PERMISSION_PORT = 56051
const IDENTITY_PORT = 56052
const ASSET_PORT = 56053
const TENANT_ORG_PORT = 56054
const PARTY_PORT = 56055

type ObservedCallState = {
  emailPasswordLoginRequest?: {
    email?: string
    password?: string
    deviceName?: string
    userAgent?: string
    ipAddress?: string
  }
  completeMfaRequest?: {
    challengeId?: string
    factor?: string
    factorChallengeId?: string
    code?: string
    loginMethod?: string
  }
  listLoginHistoryUserId?: string
  listAuditEventsOperatorContext?: string
  adminListOnlineUsersOperatorContext?: string
  listSessionsCurrentSessionId?: string
  adminListUserSessionsOperatorContext?: string
  getTenantMfaPolicyTenantId?: string
  getTenantMfaPolicyOperatorContext?: string
  getPlatformMfaPolicyOperatorContext?: string
  updateTenantMfaPolicyRequest?: {
    tenantId?: string
    loginRequired?: boolean
    scenarioRequirements?: Array<{ scenario?: number; required?: boolean }>
    factors?: Array<{ factor?: number; enabled?: boolean; priority?: number }>
  }
  updateTenantMfaPolicyOperatorContext?: string
  updatePlatformMfaPolicyRequest?: {
    loginRequired?: boolean
    scenarioRequirements?: Array<{ scenario?: number; required?: boolean }>
    factors?: Array<{ factor?: number; enabled?: boolean; priority?: number }>
  }
  updatePlatformMfaPolicyOperatorContext?: string
  logoutSession?: {
    currentSessionId?: string
    targetSessionId?: string
    userId?: string
  }
  checkedPermissions: string[]
  revokedSessionIds: Set<string>
}

const observedState: ObservedCallState = {
  checkedPermissions: [],
  revokedSessionIds: new Set<string>()
}

const allowedPermissions = new Set<string>()

// Implements the downstream auth-service gRPC contract used by the auth-bff integration test.
@Controller()
@UseFilters(GrpcExceptionFilter)
@AuthServiceControllerMethods()
class TestAuthGrpcController implements AuthServiceController {
  bootstrapUserLoginMethods(): any {
    return { emailBootstrapped: true, phoneBootstrapped: true, passwordBootstrapped: false }
  }

  completeFirstLoginPasswordSetup(): any {
    return { success: true, passwordSetupRequired: false }
  }

  listAuditEvents(
    _request?: unknown,
    metadata?: { getMap?: () => Record<string, unknown> }
  ): any {
    const map = metadata?.getMap?.() ?? {}
    observedState.listAuditEventsOperatorContext = String(map['x-operator-context'] ?? '')

    return { items: [{ eventId: 'audit-1', eventType: 'SESSION_REVOKED', tenantId: 'tenant-1' }], nextCursor: '' }
  }

  listLoginHistory(request: { userId?: string }): any {
    observedState.listLoginHistoryUserId = request.userId ?? undefined
    return {
      items: [
        {
          occurredAt: '2026-04-12T12:00:00.000Z',
          outcome: 'FAILED',
          loginMethod: 'EMAIL_PASSWORD',
          ipAddress: '127.0.0.1',
          deviceName: 'MacBook Pro',
          platform: 'macOS',
          browser: 'Firefox',
          failureReason: 'INVALID_CREDENTIALS',
          traceId: 'trace-login-1'
        }
      ],
      nextCursor: 'cursor-login-1'
    }
  }

  loginWithEmailPassword(request: {
    email?: string
    password?: string
    deviceName?: string
    userAgent?: string
    ipAddress?: string
  }): any {
    observedState.emailPasswordLoginRequest = {
      email: request.email ?? undefined,
      password: request.password ?? undefined,
      deviceName: request.deviceName ?? undefined,
      userAgent: request.userAgent ?? undefined,
      ipAddress: request.ipAddress ?? undefined
    }
    return {
      status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
      challengeId: 'challenge-1',
      loginMethod: 'EMAIL_PASSWORD'
    }
  }

  requestEmailOtpLoginChallenge(): any {
    return { challengeId: 'email-challenge-1', destination: 'a***@example.com' }
  }

  requestEmailBindingChallenge(): any {
    return {
      challengeId: 'email-binding-challenge-1',
      expiresAt: '2026-04-20T08:30:00.000Z',
      destination: 'a***@example.com'
    }
  }

  loginWithEmailOtp(): any {
    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresIn: '3600',
      loginMethod: 'EMAIL_OTP'
    }
  }

  loginWithPhonePassword(): any {
    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresIn: '3600',
      loginMethod: 'PHONE_PASSWORD'
    }
  }

  requestPhoneOtpLoginChallenge(): any {
    return { challengeId: 'phone-challenge-1', destination: '+86******0000' }
  }

  requestPhoneBindingChallenge(): any {
    return {
      challengeId: 'phone-binding-challenge-1',
      expiresAt: '2026-04-20T08:30:00.000Z',
      destination: '+86******0000'
    }
  }

  loginWithPhoneOtp(): any {
    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresIn: '3600',
      loginMethod: 'PHONE_OTP'
    }
  }

  listLoginMethods(): any {
    return {
      loginMethods: [],
      passwordSetupRequired: false
    }
  }

  setOwnLoginMethodEnabled(): any {
    return {
      success: true,
      loginMethod: {
        methodId: 'method-1',
        userId: 'user-1',
        type: 'EMAIL',
        identifier: 'alice@example.com',
        maskedIdentifier: 'a***@example.com',
        verified: true,
        enabled: true,
        source: 'USER'
      }
    }
  }

  changeOwnPassword(): any {
    return { success: true, passwordSetupRequired: false }
  }

  verifyEmailBinding(request: { email?: string }): any {
    return {
      success: true,
      type: 'EMAIL',
      identifier: request.email ?? ''
    }
  }

  verifyPhoneBinding(request: { phone?: string }): any {
    return {
      success: true,
      type: 'PHONE',
      identifier: request.phone ?? ''
    }
  }

  requirePasswordSetup(): any {
    return { success: true, passwordSetupRequired: true }
  }

  setLoginMethodEnabled(): any {
    return {
      success: true,
      loginMethod: {
        methodId: 'method-1',
        userId: 'user-1',
        type: 'EMAIL',
        identifier: 'alice@example.com',
        maskedIdentifier: 'a***@example.com',
        verified: true,
        enabled: true,
        hasPassword: true
      }
    }
  }

  listMfaBindings(): any {
    return { bindings: [] }
  }

  enableMfaBinding(): any {
    return { success: true, binding: { bindingId: 'binding-1', type: 1, enabled: true, available: true } }
  }

  disableMfaBinding(): any {
    return { success: true, binding: { bindingId: 'binding-1', type: 1, enabled: false, available: true } }
  }

  initializeTotpBinding(): any {
    return {
      binding: { bindingId: 'binding-1', type: 3, enabled: false, available: true },
      secret: 'secret-1',
      qrCodeUrl: 'otpauth://totp/test'
    }
  }

  activateTotpBinding(): any {
    return { success: true, binding: { bindingId: 'binding-1', type: 3, enabled: true, available: true } }
  }

  initializeRecoveryCodes(): any {
    return {
      binding: { bindingId: 'binding-1', type: 4, enabled: true, available: true },
      recoveryCodes: ['code-1']
    }
  }

  regenerateRecoveryCodes(): any {
    return {
      binding: { bindingId: 'binding-1', type: 4, enabled: true, available: true },
      recoveryCodes: ['code-2']
    }
  }

  submitMfaChallenge(request: any): any {
    observedState.completeMfaRequest = {
      challengeId: request.challengeId ?? undefined,
      factor: request.factor ?? undefined,
      factorChallengeId: request.factorChallengeId ?? undefined,
      code: request.code ?? undefined,
      loginMethod: request.loginMethod ?? undefined
    }
    return {
      status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
      userId: 'user-1',
      accounts: [{ accountId: 'account-1', tenantId: 'tenant-1', displayName: 'Primary account' }],
      loginMethod: 'EMAIL_PASSWORD'
    }
  }

  refreshSession(): any {
    return {
      sessionId: 'session-1',
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      expiresIn: '3600'
    }
  }

  inspectPasswordRecoveryChannels(): any {
    return {
      channels: [
        { channel: 1, maskedDestination: 'u***@example.com' },
        { channel: 2, maskedDestination: '+15****0100' }
      ]
    }
  }

  requestLoginMfaFactorChallenge(): any {
    return {
      challengeId: 'factor-challenge-1',
      destination: 'a***@example.com',
      expiresAt: '2026-04-21T08:00:00.000Z'
    }
  }

  getTenantMfaPolicy(
    request: { tenantId?: string },
    metadata?: { getMap?: () => Record<string, unknown> }
  ): any {
    const map = metadata?.getMap?.() ?? {}
    observedState.getTenantMfaPolicyTenantId = request.tenantId ?? undefined
    observedState.getTenantMfaPolicyOperatorContext = String(map['x-operator-context'] ?? '')

    return {
      tenantId: request.tenantId ?? 'tenant-1',
      loginRequired: true,
      scenarioRequirements: [
        { scenario: 1, required: true },
        { scenario: 3, required: false }
      ],
      factors: [
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_TOTP,
          enabled: true,
          priority: 2
        },
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP,
          enabled: true,
          priority: 1
        }
      ]
    }
  }

  getPlatformMfaPolicy(
    _request?: unknown,
    metadata?: { getMap?: () => Record<string, unknown> }
  ): any {
    const map = metadata?.getMap?.() ?? {}
    observedState.getPlatformMfaPolicyOperatorContext = String(map['x-operator-context'] ?? '')

    return {
      loginRequired: false,
      scenarioRequirements: [
        { scenario: 1, required: false },
        { scenario: 4, required: true }
      ],
      factors: [
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_BACKUP_CODE,
          enabled: true,
          priority: 2
        },
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_SMS_OTP,
          enabled: true,
          priority: 1
        }
      ]
    }
  }

  updateTenantMfaPolicy(
    request: {
      tenantId?: string
      loginRequired?: boolean
      scenarioRequirements?: Array<{ scenario?: number; required?: boolean }>
      factors?: Array<{ factor?: number; enabled?: boolean; priority?: number }>
    },
    metadata?: { getMap?: () => Record<string, unknown> }
  ): any {
    const map = metadata?.getMap?.() ?? {}
    observedState.updateTenantMfaPolicyRequest = {
      tenantId: request.tenantId ?? undefined,
      loginRequired: request.loginRequired ?? undefined,
      scenarioRequirements: request.scenarioRequirements ?? [],
      factors: request.factors ?? []
    }
    observedState.updateTenantMfaPolicyOperatorContext = String(map['x-operator-context'] ?? '')

    return {
      tenantId: request.tenantId ?? 'tenant-1',
      loginRequired: Boolean(request.loginRequired),
      scenarioRequirements: request.scenarioRequirements ?? [],
      factors: request.factors ?? []
    }
  }

  updatePlatformMfaPolicy(
    request: {
      loginRequired?: boolean
      scenarioRequirements?: Array<{ scenario?: number; required?: boolean }>
      factors?: Array<{ factor?: number; enabled?: boolean; priority?: number }>
    },
    metadata?: { getMap?: () => Record<string, unknown> }
  ): any {
    const map = metadata?.getMap?.() ?? {}
    observedState.updatePlatformMfaPolicyRequest = {
      loginRequired: request.loginRequired ?? undefined,
      scenarioRequirements: request.scenarioRequirements ?? [],
      factors: request.factors ?? []
    }
    observedState.updatePlatformMfaPolicyOperatorContext = String(map['x-operator-context'] ?? '')

    return {
      loginRequired: Boolean(request.loginRequired),
      scenarioRequirements: request.scenarioRequirements ?? [],
      factors: request.factors ?? []
    }
  }

  requestPasswordRecoveryChallenge(): any {
    return {
      accepted: true,
      challengeId: 'challenge-recovery-1',
      expiresAt: '2026-04-20T08:30:00.000Z',
      maskedDestination: 'u***@example.com'
    }
  }

  verifyPasswordRecoveryChallenge(): any {
    return {
      verified: true,
      resetToken: 'reset-token-1'
    }
  }

  completePasswordRecovery(): any {
    return {
      success: true,
      sessionsRevoked: true
    }
  }

  validateAccessToken(request: { accessToken?: string }): any {
    const token = request.accessToken ?? ''
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'))
    const sessionId = payload.sid ?? ''

    if (!sessionId || observedState.revokedSessionIds.has(sessionId)) {
      throw new RpcException({
        grpcStatus: 16,
        code: 'AUTH_ACCESS_TOKEN_INVALID',
        message: 'Access token is invalid or expired'
      })
    }

    return {
      userId: payload.sub ?? payload.userId ?? '',
      accountId: payload.aid ?? payload.holderId ?? '',
      tenantId: payload.tid ?? payload.tenantId ?? '',
      sessionId,
      scopeLevel: payload.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT',
      roleIds: Array.isArray(payload.roles) ? payload.roles : []
    }
  }

  selectAccount(): any {
    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      displayName: 'Primary account',
      sessionId: 'session-1',
      accessToken: 'access-3',
      refreshToken: 'refresh-3',
      expiresIn: '3600'
    }
  }

  listSessions(request: { currentSessionId?: string }): any {
    observedState.listSessionsCurrentSessionId = request.currentSessionId ?? undefined
    return {
      sessions: [
        {
          sessionId: 'session-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          status: 'ACTIVE',
          loginMethod: 'EMAIL_PASSWORD',
          createdAt: '2026-04-09T10:00:00.000Z',
          lastActiveAt: '2026-04-09T10:10:00.000Z',
          expiresAt: '2026-04-09T11:00:00.000Z',
          refreshExpiresAt: '2026-04-10T10:00:00.000Z',
          accessRemainingSeconds: '300',
          refreshRemainingSeconds: '86400',
          sessionAgeSeconds: '600',
          idleSeconds: '30',
          isAccessExpired: false,
          isRefreshExpired: false,
          isRevoked: false,
          isCurrent: true,
          isAdminControlled: false
        }
      ]
    }
  }

  startStepUpMfaChallenge(): any {
    return { challengeId: 'step-up-challenge-1', expiresAt: '2026-04-22T12:00:00.000Z' }
  }

  completeStepUpMfaChallenge(): any {
    return { grantToken: 'step-up-grant-1', expiresAt: '2026-04-22T12:05:00.000Z' }
  }

  listTrustedDevices(): any {
    return { devices: [] }
  }

  revokeTrustedDevice(): any {
    return { success: true, revokedCount: 1 }
  }

  revokeOtherTrustedDevices(): any {
    return { success: true, revokedCount: 1 }
  }

  adminListUserSessions(
    request: { userId?: string },
    metadata?: { getMap?: () => Record<string, unknown> }
  ): any {
    const map = metadata?.getMap?.() ?? {}
    observedState.adminListUserSessionsOperatorContext = String(map['x-operator-context'] ?? '')

    return {
      sessions: [
        {
          sessionId: 'session-admin-1',
          userId: request.userId ?? '',
          accountId: 'account-1',
          tenantId: 'tenant-1',
          status: 'ACTIVE',
          loginMethod: 'EMAIL_PASSWORD',
          createdAt: '2026-04-09T10:00:00.000Z',
          lastActiveAt: '2026-04-09T10:10:00.000Z',
          expiresAt: '2026-04-09T11:00:00.000Z',
          refreshExpiresAt: '2026-04-10T10:00:00.000Z',
          accessRemainingSeconds: '300',
          refreshRemainingSeconds: '86400',
          sessionAgeSeconds: '600',
          idleSeconds: '30',
          isAccessExpired: false,
          isRefreshExpired: false,
          isRevoked: false,
          isAdminControlled: true
        }
      ]
    }
  }

  adminListOnlineUsers(
    _request?: unknown,
    metadata?: { getMap?: () => Record<string, unknown> }
  ): any {
    const map = metadata?.getMap?.() ?? {}
    observedState.adminListOnlineUsersOperatorContext = String(map['x-operator-context'] ?? '')

    return {
      items: [
        {
          userId: 'user-1',
          tenantId: 'tenant-1',
          activeSessionCount: '2',
          lastActiveAt: '2026-04-09T10:10:00.000Z'
        }
      ],
      nextCursor: ''
    }
  }

  adminRevokeSession(request: { sessionId?: string }): any {
    return { success: true, sessionId: request.sessionId ?? '' }
  }

  adminDeleteAccountSessions(): any {
    return { success: true, deletedSessionCount: '1' }
  }

  logout(): any {
    return { success: true }
  }

  logoutSession(request: {
    currentSessionId?: string
    targetSessionId?: string
    userId?: string
  }): any {
    observedState.logoutSession = {
      currentSessionId: request.currentSessionId ?? undefined,
      targetSessionId: request.targetSessionId ?? undefined,
      userId: request.userId ?? undefined
    }
    return { success: true }
  }

  logoutOtherDevices(): any {
    return { success: true, sessionCount: '2' }
  }

  logoutAll(): any {
    return { success: true, sessionCount: '3' }
  }
}

// Implements the downstream permission-service gRPC contract used by gateway permission checks in the integration test.
@Controller()
@PermissionCheckServiceControllerMethods()
class TestPermissionGrpcController implements PermissionCheckServiceController {
  checkPermission(request: { permissionCode?: string }) {
    const code = request.permissionCode ?? ''
    observedState.checkedPermissions.push(code)
    return { allowed: allowedPermissions.has(code) }
  }

  batchCheckPermission() {
    return { decisions: [] }
  }

  checkPermissionWithContext() {
    return { allowed: false }
  }

  @GrpcMethod('PermissionAccessSummaryService', 'GetAccountAccessSummary')
  getAccountAccessSummary(request: { accountId?: string; tenantId?: string }) {
    return {
      roles: [
        {
          roleId: 'role-1',
          code: 'tenant.admin',
          name: 'Tenant Admin',
          tenantId: request.tenantId ?? '',
          scope: 'TENANT'
        }
      ],
      actionCodes: ['permission.list', 'role.create']
    }
  }

  @GrpcMethod('PermissionAccessSummaryService', 'ResolveAccountNavigation')
  resolveAccountNavigation() {
    return {
      defaultEntry: 'workbench.home',
      visibleEntries: ['workbench.home'],
      resolvedByRoleId: 'role-1'
    }
  }
}

// Implements the downstream identity-service gRPC contract used by the auth-bff integration test.
@Controller()
class TestIdentityGrpcController {
  // Returns a minimal identity user projection for auth-bff session-management integration tests.
  @GrpcMethod('IdentityQueryService', 'GetUserById')
  getUserById(request: { userId?: string }) {
    return {
      user: {
        id: request.userId ?? '',
        username: 'Vic Chen',
        personalEmail: 'vic@example.com',
        personalPhone: '',
        isActive: true
      }
    }
  }

  @GrpcMethod('IdentityQueryService', 'GetAccountById')
  getAccountById(request: { accountId?: string }) {
    return {
      account: {
        id: request.accountId ?? '',
        userId: 'user-1',
        tenantId: 'tenant-1',
        displayName: 'Vic Chen @ Meilong Ceramics',
        isEnabled: true
      }
    }
  }
}

// Implements the downstream asset-service gRPC contract used by auth-bff module wiring in the integration test.
@Controller()
class TestAssetGrpcController {
  @GrpcMethod('AssetService', 'UploadAccountAvatar')
  uploadAccountAvatar() {
    return {
      asset: {
        assetId: 'asset-1',
        tenantId: 'tenant-1',
        ownerAccountId: 'account-1',
        category: 'ACCOUNT_AVATAR',
        storageKey: 'avatars/account-1/asset-1',
        mimeType: 'image/png',
        size: '123',
        checksum: 'checksum-1',
        publicUrl: 'https://example.test/assets/asset-1.png',
        status: 'PENDING',
        createdAt: '2026-04-09T10:00:00.000Z',
        updatedAt: '2026-04-09T10:00:00.000Z'
      }
    }
  }

  @GrpcMethod('AssetService', 'BindAccountAvatar')
  bindAccountAvatar() {
    return {
      activeAsset: {
        assetId: 'asset-1',
        tenantId: 'tenant-1',
        ownerAccountId: 'account-1',
        category: 'ACCOUNT_AVATAR',
        storageKey: 'avatars/account-1/asset-1',
        mimeType: 'image/png',
        size: '123',
        checksum: 'checksum-1',
        publicUrl: 'https://example.test/assets/asset-1.png',
        status: 'ACTIVE',
        createdAt: '2026-04-09T10:00:00.000Z',
        updatedAt: '2026-04-09T10:00:00.000Z'
      },
      replacedAssetId: ''
    }
  }

  @GrpcMethod('AssetService', 'ResolveAssetPublicUrl')
  resolveAssetPublicUrl(request: { assetId?: string }) {
    return {
      assetId: request.assetId ?? '',
      publicUrl: `https://example.test/assets/${request.assetId ?? 'asset-1'}.png`,
      status: 'ACTIVE'
    }
  }
}

// Implements the downstream party-service gRPC contract used by auth-bff display-name hydration in the integration test.
@Controller()
class TestPartyGrpcController {
  @GrpcMethod('PartyQueryService', 'GetPartyById')
  getPartyById(request: { partyId?: string }) {
    return {
      party: {
        id: request.partyId ?? '',
        type: 'PERSON',
        status: 'ACTIVE',
        canonicalName: 'Vic Chen',
        displayName: 'Vic Chen'
      }
    }
  }
}

// Implements the downstream tenant-org-service gRPC contract used by the session-context integration test.
@Controller()
class TestTenantOrgGrpcController {
  @GrpcMethod('TenantOrgQueryService', 'GetTenantById')
  getTenantById(request: { tenantId?: string }) {
    return {
      tenant: {
        id: request.tenantId ?? '',
        code: 'meilong',
        name: 'Meilong Ceramics',
        status: 'ACTIVE',
        rootOrgId: 'org-root-1'
      }
    }
  }
}

// Hosts the test auth-service gRPC controller used by the gateway integration harness.
@Module({
  imports: [LoggingModule.forRoot({ serviceName: 'auth-service-test' })],
  controllers: [TestAuthGrpcController]
})
class TestAuthGrpcModule {}

// Hosts the test permission-service gRPC controller used by the gateway integration harness.
@Module({
  controllers: [TestPermissionGrpcController]
})
class TestPermissionGrpcModule {}

// Hosts the test identity-service gRPC controller used by the gateway integration harness.
@Module({
  controllers: [TestIdentityGrpcController]
})
class TestIdentityGrpcModule {}

// Hosts the test asset-service gRPC controller used by the gateway integration harness.
@Module({
  controllers: [TestAssetGrpcController]
})
class TestAssetGrpcModule {}

// Hosts the test party-service gRPC controller used by the gateway integration harness.
@Module({
  controllers: [TestPartyGrpcController]
})
class TestPartyGrpcModule {}

// Hosts the test tenant-org-service gRPC controller used by the gateway integration harness.
@Module({
  controllers: [TestTenantOrgGrpcController]
})
class TestTenantOrgGrpcModule {}

// Hosts the minimal gateway application wiring needed to run auth-bff HTTP to gRPC integration tests.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggingModule.forRoot({ serviceName: 'api-gateway-test' }),
    CommonJwtModule,
    GrpcTransportModule.forRoot({
      services: {
        [SERVICE_NAMES.AUTH]: {
          serviceName: SERVICE_NAMES.AUTH,
          protoPath: resolveCommonProtoPath('auth_service/auth.proto'),
          packageName: 'auth_service',
          url: `127.0.0.1:${AUTH_PORT}`
        },
        [SERVICE_NAMES.PERMISSION]: {
          serviceName: SERVICE_NAMES.PERMISSION,
          protoPath: [
            resolveCommonProtoPath('permission_service/policy_management.proto'),
            resolveCommonProtoPath('permission_service/permission_management.proto'),
            resolveCommonProtoPath('permission_service/permission_check.proto'),
            resolveCommonProtoPath('permission_service/permission_access_summary.proto')
          ],
          packageName: 'permission_service',
          url: `127.0.0.1:${PERMISSION_PORT}`
        },
        [SERVICE_NAMES.IDENTITY]: {
          serviceName: SERVICE_NAMES.IDENTITY,
          protoPath: resolveCommonProtoPath('identity_service/identity_query.proto'),
          packageName: 'identity_service',
          url: `127.0.0.1:${IDENTITY_PORT}`
        },
        [SERVICE_NAMES.ASSET]: {
          serviceName: SERVICE_NAMES.ASSET,
          protoPath: resolveCommonProtoPath('asset_service/asset.proto'),
          packageName: 'asset_service',
          url: `127.0.0.1:${ASSET_PORT}`
        },
        [SERVICE_NAMES.PARTY]: {
          serviceName: SERVICE_NAMES.PARTY,
          protoPath: resolveCommonProtoPath('party_service/party.proto'),
          packageName: 'party_service',
          url: `127.0.0.1:${PARTY_PORT}`
        },
        [SERVICE_NAMES.TENANT_ORG]: {
          serviceName: SERVICE_NAMES.TENANT_ORG,
          protoPath: resolveCommonProtoPath('tenant_org_service/tenant_org.proto'),
          packageName: 'tenant_org_service',
          url: `127.0.0.1:${TENANT_ORG_PORT}`
        }
      }
    }),
    GrpcTransportModule.forFeature([SERVICE_NAMES.PERMISSION, SERVICE_NAMES.TENANT_ORG]),
    AuthBffModule
  ],
  providers: [
    GatewayExceptionFilter,
    GatewayPermissionGuard,
    { provide: APP_GUARD, useClass: GatewaySessionAuthGuard },
    { provide: APP_GUARD, useExisting: GatewayPermissionGuard }
  ]
})
class TestGatewayAppModule {}

// Verifies the auth-bff HTTP routes can traverse the real gateway HTTP and gRPC stack into downstream services.
describe('AuthBff gateway integration', () => {
  let app: INestApplication
  let authMicroservice: INestMicroservice
  let permissionMicroservice: INestMicroservice
  let identityMicroservice: INestMicroservice
  let assetMicroservice: INestMicroservice
  let partyMicroservice: INestMicroservice
  let tenantOrgMicroservice: INestMicroservice
  let jwtService: CommonJwtService

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.ACCESS_TOKEN_VALIDITY_SEC = '3600'
    process.env.REFRESH_TOKEN_VALIDITY_SEC = '86400'
    authMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(TestAuthGrpcModule, {
      transport: Transport.GRPC,
      options: {
        package: 'auth_service',
        protoPath: resolveCommonProtoPath('auth_service/auth.proto'),
        url: `127.0.0.1:${AUTH_PORT}`
      }
    })

    permissionMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(
      TestPermissionGrpcModule,
      {
        transport: Transport.GRPC,
        options: {
          package: 'permission_service',
          protoPath: [
            resolveCommonProtoPath('permission_service/permission_check.proto'),
            resolveCommonProtoPath('permission_service/permission_access_summary.proto')
          ],
          url: `127.0.0.1:${PERMISSION_PORT}`
        }
      }
    )

    await authMicroservice.listen()
    await permissionMicroservice.listen()
    identityMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(
      TestIdentityGrpcModule,
      {
        transport: Transport.GRPC,
        options: {
          package: 'identity_service',
          protoPath: resolveCommonProtoPath('identity_service/identity_query.proto'),
          url: `127.0.0.1:${IDENTITY_PORT}`
        }
      }
    )

    await identityMicroservice.listen()
    assetMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(
      TestAssetGrpcModule,
      {
        transport: Transport.GRPC,
        options: {
          package: 'asset_service',
          protoPath: resolveCommonProtoPath('asset_service/asset.proto'),
          url: `127.0.0.1:${ASSET_PORT}`
        }
      }
    )

    await assetMicroservice.listen()
    partyMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(
      TestPartyGrpcModule,
      {
        transport: Transport.GRPC,
        options: {
          package: 'party_service',
          protoPath: resolveCommonProtoPath('party_service/party.proto'),
          url: `127.0.0.1:${PARTY_PORT}`
        }
      }
    )

    await partyMicroservice.listen()
    tenantOrgMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(
      TestTenantOrgGrpcModule,
      {
        transport: Transport.GRPC,
        options: {
          package: 'tenant_org_service',
          protoPath: resolveCommonProtoPath('tenant_org_service/tenant_org.proto'),
          url: `127.0.0.1:${TENANT_ORG_PORT}`
        }
      }
    )

    await tenantOrgMicroservice.listen()

    const moduleRef = await Test.createTestingModule({
      imports: [TestGatewayAppModule]
    }).compile()

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api/v1', {
      exclude: ['health', 'health/ready', 'docs', 'docs-json']
    })
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true
      })
    )
    app.useGlobalFilters(app.get(GatewayExceptionFilter))
    await app.init()

    jwtService = app.get(CommonJwtService)
  })

  afterAll(async () => {
    await app?.close()
    await authMicroservice?.close()
    await permissionMicroservice?.close()
    await identityMicroservice?.close()
    await assetMicroservice?.close()
    await partyMicroservice?.close()
    await tenantOrgMicroservice?.close()
  })

  beforeEach(() => {
    observedState.emailPasswordLoginRequest = undefined
    observedState.completeMfaRequest = undefined
    observedState.listLoginHistoryUserId = undefined
    observedState.listAuditEventsOperatorContext = undefined
    observedState.adminListOnlineUsersOperatorContext = undefined
    observedState.listSessionsCurrentSessionId = undefined
    observedState.adminListUserSessionsOperatorContext = undefined
    observedState.getTenantMfaPolicyTenantId = undefined
    observedState.getTenantMfaPolicyOperatorContext = undefined
    observedState.getPlatformMfaPolicyOperatorContext = undefined
    observedState.updateTenantMfaPolicyRequest = undefined
    observedState.updateTenantMfaPolicyOperatorContext = undefined
    observedState.updatePlatformMfaPolicyRequest = undefined
    observedState.updatePlatformMfaPolicyOperatorContext = undefined
    observedState.checkedPermissions = []
    observedState.revokedSessionIds.clear()
    allowedPermissions.clear()
  })

  it('routes the public login endpoint through the real gRPC auth downstream', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('User-Agent', 'Mozilla/5.0 Firefox/149.0')
      .send({
        method: 'EMAIL_PASSWORD',
        identifier: 'alice@example.com',
        credential: 'secret-1',
        device: {
          deviceName: 'Alice MacBook Pro'
        }
      })
      .expect(201)

    expect(observedState.emailPasswordLoginRequest).toEqual(
      expect.objectContaining({
        email: 'alice@example.com',
        password: 'secret-1',
        deviceName: 'Alice MacBook Pro',
        userAgent: 'Mozilla/5.0 Firefox/149.0',
        ipAddress: expect.stringContaining('127.0.0.1')
      })
    )
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'MFA_REQUIRED',
        nextStep: 'COMPLETE_MFA',
        loginMethod: 'EMAIL_PASSWORD',
        challenge: expect.objectContaining({ challengeId: 'challenge-1' })
      })
    )
  })

  it('accepts JWT-sized login MFA challenge ids on the public complete-mfa endpoint', async () => {
    const longChallengeId = 'x'.repeat(512)

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/complete')
      .send({
        challengeId: longChallengeId,
        factor: 'TOTP',
        code: '123456',
        loginMethod: 'EMAIL_PASSWORD'
      })
      .expect(201)

    expect(observedState.completeMfaRequest).toEqual({
      challengeId: longChallengeId,
      factor: 3,
      factorChallengeId: undefined,
      code: '123456',
      loginMethod: 'email-password'
    })
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ACCOUNT_SELECTION_REQUIRED',
        nextStep: 'SELECT_ACCOUNT'
      })
    )
  })

  it('routes the public password recovery endpoints through the real gRPC auth downstream', async () => {
    const optionsResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/password-recovery/options')
      .send({
        identifier: 'user@example.com'
      })
      .expect(200)

    expect(optionsResponse.body).toEqual({
      channels: [
        { channel: 'EMAIL', maskedDestination: 'u***@example.com' },
        { channel: 'PHONE', maskedDestination: '+15****0100' }
      ]
    })

    const challengeResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/password-recovery/challenges')
      .send({
        channel: 'EMAIL',
        identifier: 'user@example.com'
      })
      .expect(200)

    expect(challengeResponse.body).toEqual({
      accepted: true,
      challengeId: 'challenge-recovery-1',
      expiresAt: '2026-04-20T08:30:00.000Z',
      maskedDestination: 'u***@example.com'
    })

    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/password-recovery/challenges/challenge-recovery-1/verify')
      .send({
        otp: '123456'
      })
      .expect(200)

    expect(verifyResponse.body).toEqual({
      verified: true,
      resetToken: 'reset-token-1'
    })

    const completeResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/password-recovery/complete')
      .send({
        resetToken: 'reset-token-1',
        newPassword: 'NewSecret123!',
        confirmPassword: 'NewSecret123!'
      })
      .expect(200)

    expect(completeResponse.body).toEqual({
      success: true,
      sessionsRevoked: true
    })
  })

  it('routes self-service session queries through the real gRPC auth downstream using JWT context', async () => {
    const token = jwtService.signAccessToken({
      sub: 'user-1',
      userId: 'user-1',
      holderId: 'account-1',
      tenantId: 'tenant-1',
      sid: 'session-1'
    })

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.sessions[0]).toEqual(
      expect.objectContaining({
        sessionId: 'session-1',
        tenantId: 'tenant-1',
        isCurrent: true
      })
    )
    expect(observedState.listSessionsCurrentSessionId).toBe('session-1')
  })

  it('routes self-service login-history queries through the real gRPC auth downstream using JWT context', async () => {
    const token = jwtService.signAccessToken({
      sub: 'user-1',
      userId: 'user-1',
      holderId: 'account-1',
      tenantId: 'tenant-1',
      sid: 'session-1'
    })

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/login-history')
      .query({ result: 'FAILED', pageSize: 10 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(observedState.listLoginHistoryUserId).toBe('user-1')
    expect(response.body).toEqual({
      items: [
        {
          occurredAt: '2026-04-12T12:00:00.000Z',
          outcome: 'FAILED',
          loginMethod: 'EMAIL_PASSWORD',
          ipAddress: '127.0.0.1',
          deviceName: 'MacBook Pro',
          platform: 'macOS',
          browser: 'Firefox',
          failureReason: 'INVALID_CREDENTIALS',
          traceId: 'trace-login-1'
        }
      ],
      nextCursor: 'cursor-login-1'
    })
  })

  it('rejects protected requests when the presented session has already been revoked', async () => {
    const token = jwtService.signAccessToken({
      sub: 'user-1',
      userId: 'user-1',
      holderId: 'account-1',
      tenantId: 'tenant-1',
      sid: 'session-revoked'
    })
    observedState.revokedSessionIds.add('session-revoked')

    await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
  })

  it('routes single-session self-service logout through the real gRPC auth downstream using JWT context', async () => {
    const token = jwtService.signAccessToken({
      sub: 'user-1',
      userId: 'user-1',
      holderId: 'account-1',
      tenantId: 'tenant-1',
      sid: 'session-1'
    })

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/sessions/session-target-1/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body).toEqual({ success: true })
    expect(observedState.logoutSession).toEqual({
      currentSessionId: 'session-1',
      targetSessionId: 'session-target-1',
      userId: 'user-1'
    })
  })

  it('routes authenticated shell context queries through auth-bff into identity-service summaries', async () => {
    const token = jwtService.signAccessToken({
      sub: 'user-1',
      userId: 'user-1',
      holderId: 'account-1',
      tenantId: 'tenant-1',
      aid: 'account-1',
      tid: 'tenant-1',
      sid: 'session-1'
    })

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/session/context')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body).toEqual({
      operator: {
        userId: 'user-1',
        displayName: 'Vic Chen @ Meilong Ceramics',
        scopeLevel: 'TENANT'
      },
      account: {
        accountId: 'account-1',
        name: 'Vic Chen @ Meilong Ceramics',
        scopeLevel: 'TENANT'
      },
      tenant: {
        tenantId: 'tenant-1',
        name: 'Meilong Ceramics'
      },
      org: null,
      navigation: {
        defaultEntry: 'workbench.home',
        visibleEntries: expect.arrayContaining(['workbench.home']),
        defaultHomePath: '/workbench/home',
        menus: []
      },
      access: {
        actionCodes: []
      },
      scopeLevel: 'TENANT'
    })
  })

  it('routes access-summary queries through auth-bff into permission-service summaries', async () => {
    const token = jwtService.signAccessToken({
      sub: 'user-1',
      userId: 'user-1',
      holderId: 'account-1',
      tenantId: 'tenant-1',
      aid: 'account-1',
      tid: 'tenant-1',
      sid: 'session-1'
    })

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/session/access-summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body).toEqual({
      roles: [
        {
          roleId: 'role-1',
          code: 'tenant.admin',
          name: 'Tenant Admin',
          tenantId: 'tenant-1',
          scope: 'TENANT'
        }
      ],
      actionCodes: ['permission.list', 'role.create']
    })
  })

  it('routes admin session queries through gateway permission checks and operator-scoped downstream metadata', async () => {
    allowedPermissions.add('auth.session.admin.view')

    const token = jwtService.signAccessToken({
      sub: 'operator-user-1',
      holderId: 'account-admin-1',
      userId: 'operator-user-1',
      tenantId: 'tenant-1',
      sid: 'session-admin-1',
      roles: ['tenant-admin'],
      typ: 'USER'
    })

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/admin/users/user-1/sessions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(observedState.checkedPermissions).toContain('auth.session.admin.view')
    expect(observedState.adminListUserSessionsOperatorContext).toContain('operator_id')
    expect(response.body.sessions[0]).toEqual(
      expect.objectContaining({
        sessionId: 'session-admin-1',
        userId: 'user-1',
        isAdminControlled: true
      })
    )
  })

  it('routes admin online-user overview queries through gateway permission checks and operator-scoped downstream metadata', async () => {
    allowedPermissions.add('auth.session.admin.view')

    const token = jwtService.signAccessToken({
      sub: 'operator-user-1',
      holderId: 'account-admin-1',
      userId: 'operator-user-1',
      tenantId: 'tenant-1',
      sid: 'session-admin-1',
      roles: ['tenant-admin'],
      typ: 'USER'
    })

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/admin/online-users')
      .query({ tenantId: 'tenant-1' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(observedState.checkedPermissions).toContain('auth.session.admin.view')
    expect(observedState.adminListOnlineUsersOperatorContext).toContain('operator_id')
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        tenantId: 'tenant-1',
        visibleTenantCount: 1,
        activeAccountCount: 1,
        activeSessionCount: 2
      })
    )
  })

  it('routes admin audit-event queries through gateway permission checks and operator-scoped downstream metadata', async () => {
    allowedPermissions.add('auth.audit.list')

    const token = jwtService.signAccessToken({
      sub: 'operator-user-1',
      holderId: 'account-admin-1',
      userId: 'operator-user-1',
      tenantId: 'tenant-1',
      sid: 'session-admin-1',
      roles: ['tenant-admin'],
      typ: 'USER'
    })

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/admin/audit-events')
      .query({ tenantId: 'tenant-1', pageSize: 20 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(observedState.checkedPermissions).toContain('auth.audit.list')
    expect(observedState.listAuditEventsOperatorContext).toContain('operator_id')
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        eventId: 'audit-1',
        eventType: 'SESSION_REVOKED',
        tenantId: 'tenant-1'
      })
    )
  })

  it('routes tenant MFA policy admin queries and mutations through permission checks and tenant-scoped downstream metadata', async () => {
    allowedPermissions.add('auth.mfa_policy.manage')

    const token = jwtService.signAccessToken({
      sub: 'operator-user-1',
      holderId: 'account-admin-1',
      userId: 'operator-user-1',
      tenantId: 'tenant-1',
      tid: 'tenant-1',
      sid: 'session-admin-1',
      roles: ['tenant-admin'],
      typ: 'USER'
    })

    const getResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/admin/tenant-mfa-policy')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(observedState.checkedPermissions).toContain('auth.mfa_policy.manage')
    expect(observedState.getTenantMfaPolicyTenantId).toBe('tenant-1')
    expect(observedState.getTenantMfaPolicyOperatorContext).toContain('operator_id')
    expect(getResponse.body).toEqual({
      tenantId: 'tenant-1',
      loginRequired: true,
      scenarioRequirements: [
        { scenario: 'LOGIN', required: true },
        { scenario: 'CHANGE_PASSWORD', required: false }
      ],
      factors: [
        { factor: 'EMAIL_OTP', enabled: true, priority: 1 },
        { factor: 'TOTP', enabled: true, priority: 2 }
      ]
    })

    const updateResponse = await request(app.getHttpServer())
      .put('/api/v1/auth/admin/tenant-mfa-policy')
      .set('Authorization', `Bearer ${token}`)
      .send({
        loginRequired: false,
        scenarioRequirements: [
          { scenario: 'LOGIN', required: false },
          { scenario: 'NEW_DEVICE_LOGIN', required: true }
        ],
        factors: [
          { factor: 'BACKUP_CODE', enabled: true, priority: 2 },
          { factor: 'SMS_OTP', enabled: true, priority: 1 }
        ]
      })
      .expect(200)

    expect(observedState.updateTenantMfaPolicyOperatorContext).toContain('operator_id')
    expect(observedState.updateTenantMfaPolicyRequest).toEqual({
      tenantId: 'tenant-1',
      loginRequired: false,
      scenarioRequirements: [
        { scenario: 1, required: false },
        { scenario: 2, required: true }
      ],
      factors: [
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_BACKUP_CODE,
          enabled: true,
          priority: 2
        },
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_SMS_OTP,
          enabled: true,
          priority: 1
        }
      ]
    })
    expect(updateResponse.body).toEqual({
      tenantId: 'tenant-1',
      loginRequired: false,
      scenarioRequirements: [
        { scenario: 'LOGIN', required: false },
        { scenario: 'NEW_DEVICE_LOGIN', required: true }
      ],
      factors: [
        { factor: 'SMS_OTP', enabled: true, priority: 1 },
        { factor: 'BACKUP_CODE', enabled: true, priority: 2 }
      ]
    })
  })

  it('routes platform MFA policy admin queries and mutations through permission checks and operator-scoped downstream metadata', async () => {
    allowedPermissions.add('auth.platform_mfa_policy.manage')

    const token = jwtService.signAccessToken({
      sub: 'operator-user-1',
      holderId: 'account-system-admin-1',
      userId: 'operator-user-1',
      sid: 'session-admin-1',
      scopeLevel: 'SYSTEM',
      roles: ['system-admin'],
      typ: 'USER'
    })

    const getResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/admin/platform-mfa-policy')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(observedState.checkedPermissions).toContain('auth.platform_mfa_policy.manage')
    expect(observedState.getPlatformMfaPolicyOperatorContext).toContain('operator_id')
    expect(getResponse.body).toEqual({
      loginRequired: false,
      scenarioRequirements: [
        { scenario: 'LOGIN', required: false },
        { scenario: 'CHANGE_CONTACT', required: true }
      ],
      factors: [
        { factor: 'SMS_OTP', enabled: true, priority: 1 },
        { factor: 'BACKUP_CODE', enabled: true, priority: 2 }
      ]
    })

    const updateResponse = await request(app.getHttpServer())
      .put('/api/v1/auth/admin/platform-mfa-policy')
      .set('Authorization', `Bearer ${token}`)
      .send({
        loginRequired: true,
        scenarioRequirements: [
          { scenario: 'CHANGE_PASSWORD', required: true },
          { scenario: 'CHANGE_CONTACT', required: false }
        ],
        factors: [
          { factor: 'TOTP', enabled: true, priority: 2 },
          { factor: 'EMAIL_OTP', enabled: true, priority: 1 }
        ]
      })
      .expect(200)

    expect(observedState.updatePlatformMfaPolicyOperatorContext).toContain('operator_id')
    expect(observedState.updatePlatformMfaPolicyRequest).toEqual({
      loginRequired: true,
      scenarioRequirements: [
        { scenario: 3, required: true },
        { scenario: 4, required: false }
      ],
      factors: [
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_TOTP,
          enabled: true,
          priority: 2
        },
        {
          factor: MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP,
          enabled: true,
          priority: 1
        }
      ]
    })
    expect(updateResponse.body).toEqual({
      loginRequired: true,
      scenarioRequirements: [
        { scenario: 'CHANGE_PASSWORD', required: true },
        { scenario: 'CHANGE_CONTACT', required: false }
      ],
      factors: [
        { factor: 'EMAIL_OTP', enabled: true, priority: 1 },
        { factor: 'TOTP', enabled: true, priority: 2 }
      ]
    })
  })
})
