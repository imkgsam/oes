import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommonJwtService, ITokenConfig, TokenConfigName } from '@oes/common/auth'
import { LoginMethodEnum, PERMISSION_SERVICE } from '@oes/common/constants'
import { REPO } from '../../common/constants'
import {
  DeviceInfo,
  Session,
  SessionConfig
} from '../../domain/aggregates/usersession.aggregate'
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository'
import { IdentityAccountSummary } from '../ports/identity-service.port'
import { IPermissionServicePort } from '../ports'
import { ExceptionFactory } from '@oes/common/exceptions'
import { AUTH_TERMINAL_ACCESS_DENIED } from '../../common/constants/exception-enums'
import { AuthAuditService } from './auth-audit.service'
import { normalizeAuthDeviceContext } from './auth-device-context'
import { PasswordSetupRequirementService } from './password-setup-requirement.service'
import { TenantSessionAccessService } from './tenant-session-access.service'
import { TrustedDeviceService } from './trusted-device.service'

export interface EstablishAccountSessionInput {
  account: IdentityAccountSummary
  currentSessionId?: string
  deviceId?: string
  deviceName?: string
  ipAddress?: string
  loginMethod: LoginMethodEnum
  loginFlow?: string
  terminal?: string
  terminalDeviceId?: string
  deviceBoundTenantId?: string
  trustCurrentDevice?: boolean
  userAgent?: string
  userId: string
}

export interface EstablishedAccountSession {
  status: 'SUCCESS'
  userId: string
  accountId: string
  tenantId: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  sessionId: string
  terminal: string
  allowedTerminals: string[]
  accessToken: string
  refreshToken: string
  expiresIn: number
  displayName?: string
  passwordSetupRequired: boolean
  loginMethod?: LoginMethodEnum
  loginFlow?: string
  terminalDeviceId?: string
  deviceBoundTenantId?: string
}

// Establishes one authenticated session for a selected account after login or MFA completion.
@Injectable()
export class AccountSessionEstablishmentService {
  constructor(
    @Inject(PERMISSION_SERVICE)
    private readonly permissionService: IPermissionServicePort,
    private readonly passwordSetupRequirementService: PasswordSetupRequirementService,
    private readonly jwtService: CommonJwtService,
    private readonly configService: ConfigService,
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService,
    private readonly trustedDeviceService: TrustedDeviceService,
    private readonly tenantSessionAccessService: TenantSessionAccessService
  ) {}

  async establish(input: EstablishAccountSessionInput): Promise<EstablishedAccountSession> {
    const terminal = input.terminal || 'WEB'
    if (input.account.scopeLevel === 'TENANT') {
      await this.tenantSessionAccessService.assertAccountCanEstablishSession({
        accountId: input.account.accountId,
        tenantId: input.account.tenantId,
        scopeLevel: input.account.scopeLevel
      })
    }

    const terminalAccess = await this.permissionService.resolveAccountTerminalAccess({
      accountId: input.account.accountId,
      tenantId: input.account.tenantId,
      scopeLevel: input.account.scopeLevel,
      terminal
    })
    if (!terminalAccess.allowed) {
      this.authAuditService.emitTerminalAccessDenied({
        accountId: input.account.accountId,
        userId: input.userId,
        tenantId: input.account.tenantId,
        scopeLevel: input.account.scopeLevel,
        terminal,
        reasonCode: terminalAccess.reasonCode,
        phase: 'LOGIN'
      })
      throw ExceptionFactory.domain(AUTH_TERMINAL_ACCESS_DENIED, {
        accountId: input.account.accountId,
        tenantId: input.account.tenantId,
        scopeLevel: input.account.scopeLevel,
        terminal,
        reasonCode: terminalAccess.reasonCode
      })
    }

    const previousSession =
      input.currentSessionId && input.loginMethod === LoginMethodEnum.ContextSwitch
        ? await this.sessionRepository.findById(input.currentSessionId)
        : null
    const tokenConfig = this.getTokenConfig()
    const sessionConfig: SessionConfig = {
      accessTokenExpiry: tokenConfig.accessTokenValidity,
      refreshTokenExpiry: tokenConfig.refreshTokenValidity,
      maxSessionsPerUser: 0,
      enableAutoRenewal: true,
      enableDeviceTracking: true
    }

    const sessionLoginMethod =
      input.loginMethod === LoginMethodEnum.ContextSwitch
        ? (previousSession?.getLoginMethod() as LoginMethodEnum | undefined) ?? input.loginMethod
        : input.loginMethod
    const sessionLoginFlow =
      input.loginFlow ??
      (input.loginMethod === LoginMethodEnum.ContextSwitch
        ? previousSession?.getLoginFlow()
        : undefined) ??
      this.deriveLoginFlow(sessionLoginMethod)

    const session = Session.createSession({
      userId: input.userId,
      accountId: input.account.accountId,
      scopeLevel: input.account.scopeLevel,
      tenantId: input.account.tenantId,
      terminal,
      loginFlow: sessionLoginFlow,
      terminalDeviceId: input.terminalDeviceId,
      deviceBoundTenantId: input.deviceBoundTenantId,
      deviceInfo: this.buildDeviceInfo(input),
      config: sessionConfig,
      metadata: {
        loginMethod: sessionLoginMethod,
        loginFlow: sessionLoginFlow,
        scopeLevel: input.account.scopeLevel,
        terminal,
        terminalDeviceId: input.terminalDeviceId,
        deviceBoundTenantId: input.deviceBoundTenantId
      }
    })

    const signOptions = {
      ...(tokenConfig.issuer ? { issuer: tokenConfig.issuer } : {}),
      ...(tokenConfig.audience ? { audience: tokenConfig.audience } : {})
    }
    const roleIds = await this.resolveRoleIds(input.account)
    const passwordSetupRequired = await this.passwordSetupRequirementService.userRequiresPasswordSetup(
      input.userId
    )

    const accessToken = this.jwtService.signAccessToken(
      this.buildTokenClaims(
        input.userId,
        session.getId(),
        input.account,
        terminal,
        terminalAccess.effectiveAllowedTerminals,
        roleIds,
        'access',
        passwordSetupRequired,
        session.getTerminalDeviceId(),
        session.getDeviceBoundTenantId()
      ),
      signOptions
    )

    const refreshToken = this.jwtService.signRefreshToken(
      this.buildTokenClaims(
        input.userId,
        session.getId(),
        input.account,
        terminal,
        terminalAccess.effectiveAllowedTerminals,
        roleIds,
        'refresh',
        passwordSetupRequired,
        session.getTerminalDeviceId(),
        session.getDeviceBoundTenantId()
      ),
      signOptions
    )

    session.activateTokenWindow(
      refreshToken,
      tokenConfig.accessTokenValidity,
      tokenConfig.refreshTokenValidity
    )
    await this.sessionRepository.save(session)
    if (previousSession && previousSession.getId() !== session.getId()) {
      await this.sessionRepository.delete(previousSession.getId())
    }
    if (input.trustCurrentDevice) {
      await this.trustedDeviceService.rememberTrustedDevice({
        userId: input.userId,
        scopeLevel: input.account.scopeLevel,
        tenantId: input.account.tenantId ?? undefined,
        deviceId: session.getDeviceInfo().deviceId,
        deviceName: session.getDeviceInfo().deviceName,
        browser: session.getDeviceInfo().browser,
        platform: session.getDeviceInfo().platform,
        userAgent: session.getDeviceInfo().userAgent,
        ipAddress: session.getDeviceInfo().ipAddress
      })
    }

    this.authAuditService.emitLoginSucceeded(session, input.loginMethod)

    return {
      status: 'SUCCESS',
      userId: input.userId,
      accountId: input.account.accountId,
      tenantId: input.account.tenantId,
      scopeLevel: input.account.scopeLevel,
      sessionId: session.getId(),
      terminal,
      allowedTerminals: terminalAccess.effectiveAllowedTerminals,
      accessToken,
      refreshToken,
      expiresIn: tokenConfig.accessTokenValidity,
      displayName: input.account.displayName,
      passwordSetupRequired,
      loginMethod: sessionLoginMethod,
      loginFlow: session.getLoginFlow(),
      terminalDeviceId: session.getTerminalDeviceId(),
      deviceBoundTenantId: session.getDeviceBoundTenantId()
    }
  }

  private getTokenConfig(): ITokenConfig {
    const config = this.configService.get<ITokenConfig>(TokenConfigName)
    const issuer = typeof config?.issuer === 'string' ? config.issuer : ''
    const audience = typeof config?.audience === 'string' ? config.audience : ''

    return {
      accessTokenValidity: config?.accessTokenValidity || 900,
      refreshTokenValidity: config?.refreshTokenValidity || 604800,
      issuer,
      audience
    }
  }

  private async resolveRoleIds(account: IdentityAccountSummary): Promise<string[]> {
    const summary = await this.permissionService.getAccountAuthorizationSummary({
      accountId: account.accountId,
      tenantId: account.tenantId,
      scopeLevel: account.scopeLevel
    })

    return summary.roleIds
  }

  private buildTokenClaims(
    userId: string,
    sessionId: string,
    account: IdentityAccountSummary,
    terminal: string,
    allowedTerminals: string[],
    roleIds: string[],
    tokenType: 'access' | 'refresh',
    passwordSetupRequired: boolean,
    terminalDeviceId?: string,
    deviceBoundTenantId?: string
  ): Record<string, unknown> {
    return {
      sub: userId,
      sid: sessionId,
      aid: account.accountId,
      ...(account.tenantId ? { tid: account.tenantId } : {}),
      scopeLevel: account.scopeLevel,
      terminal,
      ...(terminalDeviceId ? { terminalDeviceId } : {}),
      ...(deviceBoundTenantId ? { deviceBoundTenantId } : {}),
      allowedTerminals,
      passwordSetupRequired,
      roles: roleIds,
      tokenType
    }
  }

  private buildDeviceInfo(input: EstablishAccountSessionInput): DeviceInfo {
    return normalizeAuthDeviceContext({
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress
    })
  }

  // deriveLoginFlow provides a stable bridge until Task 7 passes terminal-specific PDA login flows explicitly.
  private deriveLoginFlow(loginMethod: LoginMethodEnum): string {
    switch (loginMethod) {
      case LoginMethodEnum.EmailPassword:
        return 'EMAIL_PASSWORD'
      case LoginMethodEnum.EmailOtp:
        return 'EMAIL_OTP'
      case LoginMethodEnum.PhonePassword:
        return 'PHONE_PASSWORD'
      case LoginMethodEnum.PhoneOtp:
        return 'PHONE_OTP'
      case LoginMethodEnum.Google:
        return 'SSO'
      case LoginMethodEnum.Wechat:
        return 'SSO'
      case LoginMethodEnum.ContextSwitch:
      default:
        return String(loginMethod)
    }
  }
}
