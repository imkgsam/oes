import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { LoginMethodEnum } from '@oes/common/constants'
import { captureEventTraceContext } from '@oes/common/tracing'
import { Session } from '../../domain/aggregates/usersession.aggregate'
import {
  AuthAuditEvent,
  AuthAuditEventType,
  AuthAuditModule,
  AuthAuditOperator,
  AuthAuditResource,
  AuthAuditResult,
  AuthAuditScope
} from '../events/auth-audit.event'

type SessionAuditContext = {
  sessionId: string
  userId: string
  accountId: string
  tenantId: string
  terminal: string
  loginMethod: string
  loginFlow: string
  terminalDeviceId?: string
  deviceBoundTenantId?: string
  deviceId: string
  deviceName: string
  userAgent: string
  ipAddress: string
  platform: string
  browser: string
}

type FailedLoginAuditContext = {
  method?: string
  userId?: string
  terminal?: string
  loginFlow?: string
  deviceName?: string
  userAgent?: string
  ipAddress?: string
  platform?: string
  browser?: string
}

/**
 * AuthAuditService emits auth-domain audit events while preserving the current trace correlation identifiers.
 */
@Injectable()
export class AuthAuditService {
  private static readonly EVENT_NAME = 'auth.audit'

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * emitLoginFailed records a failed login attempt as an auth-domain audit event with trace correlation.
   */
  emitLoginFailed(identifier: string, reason: string, context?: FailedLoginAuditContext): void {
    const operator = context?.userId ? this.userOperator(context.userId) : this.systemOperator()

    this.emit('LOGIN_FAILED', 'auth', {
      result: 'REJECTED',
      operator,
      scope: this.emptyScope(),
      resource: {
        resourceType: 'login_attempt',
        resourceId: null
      },
      details: {
        identifier,
        reason,
        method: context?.method ?? '',
        userId: context?.userId ?? '',
        terminal: context?.terminal ?? '',
        loginFlow: context?.loginFlow ?? '',
        deviceName: context?.deviceName ?? '',
        userAgent: context?.userAgent ?? '',
        ipAddress: context?.ipAddress ?? '',
        platform: context?.platform ?? '',
        browser: context?.browser ?? ''
      }
    })
  }

  /**
   * emitLoginBlocked records a blocked login attempt so operators can trace throttling or lock decisions.
   */
  emitLoginBlocked(identifier: string, reason: string, lockedUntil?: string): void {
    this.emit('LOGIN_BLOCKED', 'auth', {
      result: 'REJECTED',
      operator: this.systemOperator(),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'login_attempt',
        resourceId: null
      },
      details: {
        identifier,
        reason,
        lockedUntil: lockedUntil ?? ''
      }
    })
  }

  /**
   * emitMfaChallengeCreated records a newly issued MFA challenge for later security review.
   */
  emitMfaChallengeCreated(
    userId: string,
    challengeId: string,
    channel: 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'
  ): void {
    this.emit('MFA_CHALLENGE_CREATED', 'mfa', {
      operator: this.systemOperator(),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'mfa_challenge',
        resourceId: challengeId
      },
      details: {
        userId,
        challengeId,
        channel
      }
    })
  }

  /**
   * emitMfaBindingEnabled records a successful MFA binding enablement action.
   */
  emitMfaBindingEnabled(
    userId: string,
    type: 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP' | 'BACKUP_CODE'
  ): void {
    this.emit('MFA_BINDING_ENABLED', 'mfa', {
      operator: this.userOperator(userId),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'mfa_binding',
        resourceId: `${userId}:${type}`
      },
      details: {
        userId,
        type
      }
    })
  }

  /**
   * emitMfaBindingDisabled records a successful MFA binding disablement action.
   */
  emitMfaBindingDisabled(
    userId: string,
    type: 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP' | 'BACKUP_CODE'
  ): void {
    this.emit('MFA_BINDING_DISABLED', 'mfa', {
      operator: this.userOperator(userId),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'mfa_binding',
        resourceId: `${userId}:${type}`
      },
      details: {
        userId,
        type
      }
    })
  }

  /**
   * emitMfaBindingInitialized records an MFA binding initialization before activation completes.
   */
  emitMfaBindingInitialized(userId: string, type: 'TOTP' | 'BACKUP_CODE'): void {
    this.emit('MFA_BINDING_INITIALIZED', 'mfa', {
      operator: this.userOperator(userId),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'mfa_binding',
        resourceId: `${userId}:${type}`
      },
      details: {
        userId,
        type
      }
    })
  }

  /**
   * emitMfaBindingRotated records a rotation of recovery credentials or backup factors.
   */
  emitMfaBindingRotated(userId: string, type: 'BACKUP_CODE'): void {
    this.emit('MFA_BINDING_ROTATED', 'mfa', {
      operator: this.userOperator(userId),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'mfa_binding',
        resourceId: `${userId}:${type}`
      },
      details: {
        userId,
        type
      }
    })
  }

  /**
   * emitPasswordChanged records a successful self-service password change without credential material.
   */
  emitPasswordChanged(userId: string): void {
    this.emit('PASSWORD_CHANGED', 'auth', {
      operator: this.userOperator(userId),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'user_password',
        resourceId: userId
      },
      details: {
        userId
      }
    })
  }

  /**
   * emitPasswordRecoveryChallengeCreated records a newly issued forgot-password challenge.
   */
  emitPasswordRecoveryChallengeCreated(
    userId: string,
    challengeId: string,
    channel: 'EMAIL' | 'PHONE'
  ): void {
    this.emit('PASSWORD_RECOVERY_CHALLENGE_CREATED', 'auth', {
      operator: this.systemOperator(),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'password_recovery_challenge',
        resourceId: challengeId
      },
      details: {
        userId,
        challengeId,
        channel
      }
    })
  }

  /**
   * emitPasswordRecoveryChallengeVerified records a successfully verified forgot-password challenge.
   */
  emitPasswordRecoveryChallengeVerified(
    userId: string,
    challengeId: string,
    resetToken: string
  ): void {
    this.emit('PASSWORD_RECOVERY_CHALLENGE_VERIFIED', 'auth', {
      operator: this.systemOperator(),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'password_recovery_challenge',
        resourceId: challengeId
      },
      details: {
        userId,
        challengeId,
        resetToken
      }
    })
  }

  /**
   * emitPasswordRecoveryCompleted records a completed forgot-password reset and the session blast radius.
   */
  emitPasswordRecoveryCompleted(userId: string, resetToken: string, sessionCount: number): void {
    this.emit('PASSWORD_RECOVERY_COMPLETED', 'auth', {
      operator: this.systemOperator(),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'user_password',
        resourceId: userId
      },
      details: {
        userId,
        resetToken,
        sessionCount
      }
    })
  }

  /**
   * emitPasswordSetupRequired records an administrator-triggered password setup gate.
   */
  emitPasswordSetupRequired(requiredBy: string, userId: string, reason: string): void {
    this.emit('PASSWORD_SETUP_REQUIRED', 'auth', {
      operator: this.userOperator(requiredBy),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'user_password',
        resourceId: userId
      },
      details: {
        requiredBy,
        userId,
        reason
      }
    })
  }

  /**
   * emitTerminalPinChanged records a self-service terminal PIN credential change without credential material.
   */
  emitTerminalPinChanged(userId: string, action: 'SET' | 'RESET' | 'CHANGE'): void {
    this.emit('TERMINAL_PIN_CHANGED', 'auth', {
      operator: this.userOperator(userId),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'terminal_pin',
        resourceId: userId
      },
      details: {
        userId,
        action
      }
    })
  }

  /**
   * emitTerminalPinResetRequired records an administrator reset requirement without credential material.
   */
  emitTerminalPinResetRequired(requiredBy: string, userId: string): void {
    this.emit('TERMINAL_PIN_RESET_REQUIRED', 'auth', {
      operator: this.userOperator(requiredBy),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'terminal_pin',
        resourceId: userId
      },
      details: {
        requiredBy,
        userId
      }
    })
  }

  /**
   * emitTerminalPinEnabledChanged records a terminal PIN login method enablement-state change.
   */
  emitTerminalPinEnabledChanged(operatorId: string, userId: string, enabled: boolean): void {
    this.emit('TERMINAL_PIN_ENABLED_CHANGED', 'auth', {
      operator: this.userOperator(operatorId),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'terminal_pin',
        resourceId: userId
      },
      details: {
        operatorId,
        userId,
        enabled
      }
    })
  }

  /**
   * emitLoginMethodEnabledChanged records an enablement-state change for one login method.
   */
  emitLoginMethodEnabledChanged(
    operatorId: string,
    userId: string,
    methodId: string,
    enabled: boolean,
    reason?: string
  ): void {
    this.emit('LOGIN_METHOD_ENABLED_CHANGED', 'auth', {
      operator: this.userOperator(operatorId),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'login_method',
        resourceId: methodId
      },
      details: {
        operatorId,
        userId,
        methodId,
        enabled,
        reason: reason ?? ''
      }
    })
  }

  /**
   * emitAdminSessionRevoked records an administrative session revocation with target session context.
   */
  emitAdminSessionRevoked(adminId: string, session: Session, reason: string): void {
    this.emit('ADMIN_SESSION_REVOKED', 'session', {
      operator: this.userOperator(adminId),
      scope: this.sessionScope(session),
      resource: this.sessionResource(session),
      details: {
        adminId,
        reason,
        ...this.buildSessionContext(session)
      }
    })
  }

  /**
   * emitLoginSucceeded records a successful login together with the resulting session context.
   */
  emitLoginSucceeded(session: Session, method: LoginMethodEnum): void {
    this.emit('LOGIN_SUCCEEDED', 'auth', {
      operator: this.userOperator(session.getUserId()),
      scope: this.sessionScope(session),
      resource: this.sessionResource(session),
      details: {
        method,
        ...this.buildSessionContext(session)
      }
    })
  }

  /**
   * emitSessionRefreshed records a successful session refresh.
   */
  emitSessionRefreshed(session: Session): void {
    this.emit('SESSION_REFRESHED', 'session', {
      operator: this.userOperator(session.getAccountId()),
      scope: this.sessionScope(session),
      resource: this.sessionResource(session),
      details: {
        ...this.buildSessionContext(session)
      }
    })
  }

  /**
   * emitTerminalAccessDenied records a blocked login or refresh caused by terminal access policy.
   */
  emitTerminalAccessDenied(input: {
    accountId: string
    userId?: string
    tenantId?: string | null
    scopeLevel?: string
    terminal: string
    reasonCode: string
    phase: 'LOGIN' | 'REFRESH'
    sessionId?: string
  }): void {
    this.emit(input.phase === 'REFRESH' ? 'SESSION_REFRESH_DENIED_TERMINAL_ACCESS' : 'TERMINAL_ACCESS_DENIED', 'auth', {
      result: 'REJECTED',
      operator: input.userId ? this.userOperator(input.userId) : this.systemOperator(),
      scope: {
        tenantId: input.tenantId ?? null,
        orgId: null
      },
      resource: {
        resourceType: 'account_terminal_access',
        resourceId: input.accountId
      },
      details: {
        accountId: input.accountId,
        userId: input.userId ?? '',
        tenantId: input.tenantId ?? '',
        scopeLevel: input.scopeLevel ?? '',
        terminal: input.terminal,
        reasonCode: input.reasonCode,
        sessionId: input.sessionId ?? ''
      }
    })
  }

  /**
   * emitRefreshTokenReplayDetected records a detected refresh-token replay security event.
   */
  emitRefreshTokenReplayDetected(session: Session): void {
    this.emit('REFRESH_TOKEN_REPLAY_DETECTED', 'session', {
      operator: this.userOperator(session.getAccountId()),
      scope: this.sessionScope(session),
      resource: this.sessionResource(session),
      details: {
        ...this.buildSessionContext(session)
      }
    })
  }

  /**
   * emitSessionDeviceRenamed records a session device rename action for later review.
   */
  emitSessionDeviceRenamed(session: Session): void {
    this.emit('SESSION_DEVICE_RENAMED', 'session', {
      operator: this.userOperator(session.getAccountId()),
      scope: this.sessionScope(session),
      resource: this.sessionResource(session),
      details: {
        ...this.buildSessionContext(session)
      }
    })
  }

  /**
   * emitLogoutSucceeded records a successful single-session logout action.
   */
  emitLogoutSucceeded(session: Session): void {
    this.emit('LOGOUT_SUCCEEDED', 'session', {
      operator: this.userOperator(session.getAccountId()),
      scope: this.sessionScope(session),
      resource: this.sessionResource(session),
      details: {
        ...this.buildSessionContext(session)
      }
    })
  }

  /**
   * emitLogoutOtherDevicesSucceeded records a successful logout of all sessions except the current one.
   */
  emitLogoutOtherDevicesSucceeded(
    userId: string,
    currentSession: Session | null,
    sessionCount: number,
    revokedSessionIds: string[]
  ): void {
    this.emit('LOGOUT_OTHER_DEVICES_SUCCEEDED', 'session', {
      operator: this.userOperator(currentSession?.getAccountId() ?? userId),
      scope: currentSession ? this.sessionScope(currentSession) : this.emptyScope(),
      resource: currentSession
        ? this.sessionResource(currentSession)
        : {
            resourceType: 'user_session_batch',
            resourceId: userId
          },
      details: {
        userId,
        sessionCount,
        revokedSessionIds,
        ...(currentSession ? this.buildSessionContext(currentSession) : { sessionId: '' })
      }
    })
  }

  /**
   * emitLogoutAllSucceeded records a successful logout of all sessions for a user.
   */
  emitLogoutAllSucceeded(userId: string, sessionCount: number, sessionIds: string[]): void {
    this.emit('LOGOUT_ALL_SUCCEEDED', 'session', {
      operator: this.userOperator(userId),
      scope: this.emptyScope(),
      resource: {
        resourceType: 'user_session_batch',
        resourceId: userId
      },
      details: {
        userId,
        sessionCount,
        sessionIds
      }
    })
  }

  /**
   * emitTerminalDeviceSessionsRevoked records auth session cleanup after a managed terminal device becomes unavailable.
   */
  emitTerminalDeviceSessionsRevoked(input: {
    terminalDeviceId: string
    tenantId?: string | null
    previousStatus?: string
    newStatus: string
    sessionIds: string[]
    reason?: string | null
    traceId?: string | null
  }): void {
    this.emit('TERMINAL_DEVICE_SESSIONS_REVOKED', 'session', {
      operator: this.systemOperator(),
      scope: {
        tenantId: input.tenantId ?? null,
        orgId: null
      },
      resource: {
        resourceType: 'terminal_device_session_batch',
        resourceId: input.terminalDeviceId
      },
      details: {
        terminalDeviceId: input.terminalDeviceId,
        tenantId: input.tenantId ?? '',
        previousStatus: input.previousStatus ?? '',
        newStatus: input.newStatus,
        reason: input.reason ?? '',
        sessionCount: input.sessionIds.length,
        sessionIds: input.sessionIds
      },
      trace: {
        traceId: input.traceId ?? undefined
      }
    })
  }

  /**
   * buildSessionContext extracts stable session details that are shared across auth audit events.
   */
  private buildSessionContext(session: Session): SessionAuditContext {
    const deviceInfo = session.getDeviceInfo()

    return {
      sessionId: session.getId(),
      userId: session.getUserId(),
      accountId: session.getAccountId(),
      tenantId: session.getTenantId() ?? '',
      terminal: session.getTerminal(),
      loginMethod: session.getLoginMethod(),
      loginFlow: session.getLoginFlow(),
      terminalDeviceId: session.getTerminalDeviceId(),
      deviceBoundTenantId: session.getDeviceBoundTenantId(),
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress,
      platform: deviceInfo.platform ?? '',
      browser: deviceInfo.browser ?? ''
    }
  }

  /**
   * emit publishes a local auth audit event together with the currently active trace correlation identifiers.
   */
  private emit(
    type: AuthAuditEventType,
    module: AuthAuditModule,
    payload: {
      operator: AuthAuditOperator
      scope: AuthAuditScope
      resource: AuthAuditResource
      details: Record<string, unknown>
      result?: AuthAuditResult
      trace?: {
        traceId?: string
        spanId?: string
      }
    }
  ): void {
    const traceContext = captureEventTraceContext()
    this.eventEmitter.emit(
      AuthAuditService.EVENT_NAME,
      new AuthAuditEvent(
        randomUUID(),
        module,
        type,
        new Date(),
        payload.result ?? 'SUCCEEDED',
        payload.operator,
        payload.scope,
        {
          traceId: payload.trace?.traceId ?? traceContext.traceId,
          spanId: payload.trace?.spanId ?? traceContext.spanId
        },
        payload.resource,
        payload.details
      )
    )
  }

  /**
   * userOperator builds the standard auth audit operator payload for user-driven actions.
   */
  private userOperator(operatorId: string): AuthAuditOperator {
    return {
      operatorId,
      operatorType: 'HUMAN'
    }
  }

  /**
   * systemOperator builds the standard auth audit operator payload for unauthenticated or system-driven actions.
   */
  private systemOperator(): AuthAuditOperator {
    return {
      operatorId: null,
      operatorType: 'SYSTEM'
    }
  }

  /**
   * sessionScope extracts tenant and organization scope from session metadata when available.
   */
  private sessionScope(session: Session): AuthAuditScope {
    return {
      tenantId: session.getTenantId() ?? null,
      orgId: session.getOrgId() ?? null
    }
  }

  /**
   * sessionResource builds the canonical audit resource reference for session-bound auth actions.
   */
  private sessionResource(session: Session): AuthAuditResource {
    return {
      resourceType: 'user_session',
      resourceId: session.getId()
    }
  }

  /**
   * emptyScope returns a neutral scope for auth events that do not yet carry tenant or org context.
   */
  private emptyScope(): AuthAuditScope {
    return {
      tenantId: null,
      orgId: null
    }
  }
}
