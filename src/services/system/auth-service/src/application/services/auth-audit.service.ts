import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { LoginMethodEnum } from '@oes/common/constants'
import { AuthAuditEvent } from '../events/auth-audit.event'

@Injectable()
export class AuthAuditService {
  private static readonly EVENT_NAME = 'auth.audit'

  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitLoginFailed(identifier: string, reason: string): void {
    this.emit(
      new AuthAuditEvent('LOGIN_FAILED', {
        identifier,
        reason
      })
    )
  }

  emitMfaChallengeCreated(
    userId: string,
    challengeId: string,
    channel: 'EMAIL_OTP' | 'SMS_OTP'
  ): void {
    this.emit(
      new AuthAuditEvent('MFA_CHALLENGE_CREATED', {
        userId,
        challengeId,
        channel
      })
    )
  }

  emitAdminSessionRevoked(adminId: string, sessionId: string, reason: string): void {
    this.emit(
      new AuthAuditEvent('ADMIN_SESSION_REVOKED', {
        adminId,
        sessionId,
        reason
      })
    )
  }

  emitLoginSucceeded(
    userId: string,
    accountId: string,
    tenantId: string,
    sessionId: string,
    method: LoginMethodEnum
  ): void {
    this.emit(
      new AuthAuditEvent('LOGIN_SUCCEEDED', {
        userId,
        accountId,
        tenantId,
        sessionId,
        method
      })
    )
  }

  emitSessionRefreshed(sessionId: string): void {
    this.emit(
      new AuthAuditEvent('SESSION_REFRESHED', {
        sessionId
      })
    )
  }

  emitSessionDeviceRenamed(userId: string, sessionId: string, deviceName: string): void {
    this.emit(
      new AuthAuditEvent('SESSION_DEVICE_RENAMED', {
        userId,
        sessionId,
        deviceName
      })
    )
  }

  emitLogoutSucceeded(sessionId: string): void {
    this.emit(
      new AuthAuditEvent('LOGOUT_SUCCEEDED', {
        sessionId
      })
    )
  }

  emitLogoutOtherDevicesSucceeded(
    userId: string,
    currentSessionId: string,
    sessionCount: number
  ): void {
    this.emit(
      new AuthAuditEvent('LOGOUT_OTHER_DEVICES_SUCCEEDED', {
        userId,
        currentSessionId,
        sessionCount
      })
    )
  }

  emitLogoutAllSucceeded(userId: string, sessionCount: number): void {
    this.emit(
      new AuthAuditEvent('LOGOUT_ALL_SUCCEEDED', {
        userId,
        sessionCount
      })
    )
  }

  private emit(event: AuthAuditEvent): void {
    this.eventEmitter.emit(AuthAuditService.EVENT_NAME, event)
  }
}
