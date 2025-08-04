import { Injectable, Logger } from '@nestjs/common'
import {
  IAuditServicePort,
  AuditRequest,
  AuditResponse,
  AuditEvent,
} from '../../application/ports/audit-service.port'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { AUDIT_MESSAGES } from '@oes/common/constants/messages/audit.message'
import { safeRpcCall } from '@oes/common/helpers/rpc.helper'
/**
 * Audit Service 适配器实现
 *
 * 通过 RPC 调用 Audit Service 记录安全事件、操作日志等
 */
@Injectable()
export class AuditServiceAdaptor implements IAuditServicePort {
  private readonly logger = new Logger(AuditServiceAdaptor.name)

  constructor(
    @InjectServiceClient(ServiceKeys.AUDIT_TCP)
    private readonly auditServiceClient: any,
  ) {}

  async recordAuditEvent(request: AuditRequest): Promise<AuditResponse> {
    this.logger.debug(`Recording audit event: ${request.eventType}`)
    const response = await safeRpcCall<AuditResponse>(
      this.auditServiceClient.send(AUDIT_MESSAGES.RECORD_EVENT, request),
    )
    return response
  }

  async recordLoginSuccess(
    userId: string,
    loginMethod: string,
    deviceInfo: Record<string, any>,
    locationInfo?: Record<string, any>,
    sessionId?: string,
  ): Promise<AuditResponse> {
    try {
      this.logger.debug(`Recording login success for user: ${userId}`)
      const request: AuditRequest = {
        userId,
        eventType: 'LOGIN_SUCCESS',
        eventCategory: 'AUTHENTICATION',
        severity: 'LOW',
        description: `User logged in successfully using ${loginMethod}`,
        details: { loginMethod, deviceInfo, locationInfo, sessionId },
        deviceInfo,
        locationInfo,
        sessionId,
      }
      const response = await safeRpcCall<AuditResponse>(
        this.auditServiceClient.send(AUDIT_MESSAGES.RECORD_LOGIN_SUCCESS, request),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to record login success for user: ${userId}`, error)
      throw error
    }
  }

  async recordLoginFailure(
    identifier: string,
    loginMethod: string,
    reason: string,
    deviceInfo: Record<string, any>,
    locationInfo?: Record<string, any>,
  ): Promise<AuditResponse> {
    try {
      this.logger.debug(`Recording login failure for identifier: ${identifier}`)
      const request: AuditRequest = {
        eventType: 'LOGIN_FAILURE',
        eventCategory: 'AUTHENTICATION',
        severity: 'MEDIUM',
        description: `Login failed for ${identifier} using ${loginMethod}`,
        details: { identifier, loginMethod, reason, deviceInfo, locationInfo },
        deviceInfo,
        locationInfo,
      }
      const response = await safeRpcCall<AuditResponse>(
        this.auditServiceClient.send(AUDIT_MESSAGES.RECORD_LOGIN_FAILURE, request),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to record login failure for identifier: ${identifier}`, error)
      throw error
    }
  }

  async recordLogout(userId: string, sessionId: string, reason?: string): Promise<AuditResponse> {
    try {
      this.logger.debug(`Recording logout for user: ${userId}`)
      const request: AuditRequest = {
        userId,
        eventType: 'LOGOUT',
        eventCategory: 'AUTHENTICATION',
        severity: 'LOW',
        description: `User logged out`,
        details: { sessionId, reason },
        sessionId,
      }
      const response = await safeRpcCall<AuditResponse>(
        this.auditServiceClient.send(AUDIT_MESSAGES.RECORD_LOGOUT, request),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to record logout for user: ${userId}`, error)
      throw error
    }
  }

  async recordPasswordReset(
    userId: string,
    resetMethod: string,
    deviceInfo: Record<string, any>,
  ): Promise<AuditResponse> {
    try {
      this.logger.debug(`Recording password reset for user: ${userId}`)
      const request: AuditRequest = {
        userId,
        eventType: 'PASSWORD_RESET',
        eventCategory: 'SECURITY',
        severity: 'HIGH',
        description: `Password reset initiated using ${resetMethod}`,
        details: { resetMethod, deviceInfo },
        deviceInfo,
      }
      const response = await safeRpcCall<AuditResponse>(
        this.auditServiceClient.send(AUDIT_MESSAGES.RECORD_PASSWORD_RESET, request),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to record password reset for user: ${userId}`, error)
      throw error
    }
  }

  async recordAccountLocked(
    userId: string,
    reason: string,
    duration?: string,
    deviceInfo?: Record<string, any>,
  ): Promise<AuditResponse> {
    try {
      this.logger.debug(`Recording account locked for user: ${userId}`)
      const request: AuditRequest = {
        userId,
        eventType: 'ACCOUNT_LOCKED',
        eventCategory: 'SECURITY',
        severity: 'HIGH',
        description: `Account locked: ${reason}`,
        details: { reason, duration, deviceInfo },
        deviceInfo,
      }
      const response = await safeRpcCall<AuditResponse>(
        this.auditServiceClient.send(AUDIT_MESSAGES.RECORD_ACCOUNT_LOCKED, request),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to record account locked for user: ${userId}`, error)
      throw error
    }
  }

  async recordPermissionCheck(
    userId: string,
    resource: string,
    action: string,
    granted: boolean,
    reason?: string,
  ): Promise<AuditResponse> {
    try {
      this.logger.debug(`Recording permission check for user: ${userId}`)
      const request: AuditRequest = {
        userId,
        eventType: 'PERMISSION_CHECK',
        eventCategory: 'AUTHORIZATION',
        severity: granted ? 'LOW' : 'MEDIUM',
        description: `Permission check: ${action} on ${resource}`,
        details: { resource, action, granted, reason },
      }
      const response = await safeRpcCall<AuditResponse>(
        this.auditServiceClient.send(AUDIT_MESSAGES.RECORD_PERMISSION_CHECK, request),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to record permission check for user: ${userId}`, error)
      throw error
    }
  }

  async recordSecurityEvent(
    userId: string,
    eventType: string,
    description: string,
    details: Record<string, any>,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  ): Promise<AuditResponse> {
    try {
      this.logger.debug(`Recording security event for user: ${userId}`)
      const request: AuditRequest = {
        userId,
        eventType,
        eventCategory: 'SECURITY',
        severity,
        description,
        details,
      }
      const response = await safeRpcCall<AuditResponse>(
        this.auditServiceClient.send(AUDIT_MESSAGES.RECORD_SECURITY_EVENT, request),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to record security event for user: ${userId}`, error)
      throw error
    }
  }

  async recordMfaEvent(
    userId: string,
    eventType: string,
    mfaType: string,
    success: boolean,
    details: Record<string, any>,
  ): Promise<AuditResponse> {
    try {
      this.logger.debug(`Recording MFA event for user: ${userId}`)
      const request: AuditRequest = {
        userId,
        eventType,
        eventCategory: 'AUTHENTICATION',
        severity: success ? 'LOW' : 'MEDIUM',
        description: `MFA ${eventType} using ${mfaType}`,
        details: { mfaType, success, ...details },
      }
      const response = await safeRpcCall<AuditResponse>(
        this.auditServiceClient.send(AUDIT_MESSAGES.RECORD_MFA_EVENT, request),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to record MFA event for user: ${userId}`, error)
      throw error
    }
  }

  async recordSessionEvent(
    userId: string,
    sessionId: string,
    eventType: string,
    details: Record<string, any>,
  ): Promise<AuditResponse> {
    try {
      this.logger.debug(`Recording session event for user: ${userId}`)
      const request: AuditRequest = {
        userId,
        eventType,
        eventCategory: 'AUTHENTICATION',
        severity: 'LOW',
        description: `Session ${eventType}`,
        details: { sessionId, ...details },
        sessionId,
      }
      const response = await safeRpcCall<AuditResponse>(
        this.auditServiceClient.send(AUDIT_MESSAGES.RECORD_SESSION_EVENT, request),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to record session event for user: ${userId}`, error)
      throw error
    }
  }

  async recordAdminAction(
    adminUserId: string,
    targetUserId: string,
    action: string,
    details: Record<string, any>,
  ): Promise<AuditResponse> {
    try {
      this.logger.debug(`Recording admin action: ${adminUserId} -> ${targetUserId}`)
      const request: AuditRequest = {
        userId: adminUserId,
        eventType: 'ADMIN_ACTION',
        eventCategory: 'ADMIN',
        severity: 'HIGH',
        description: `Admin action: ${action} on user ${targetUserId}`,
        details: { targetUserId, action, ...details },
      }
      const response = await safeRpcCall<AuditResponse>(
        this.auditServiceClient.send(AUDIT_MESSAGES.RECORD_ADMIN_ACTION, request),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to record admin action: ${adminUserId} -> ${targetUserId}`, error)
      throw error
    }
  }

  async batchRecordAuditEvents(requests: AuditRequest[]): Promise<AuditResponse[]> {
    try {
      this.logger.debug(`Batch recording ${requests.length} audit events`)
      const response = await safeRpcCall<AuditResponse[]>(
        this.auditServiceClient.send(AUDIT_MESSAGES.BATCH_RECORD_EVENTS, { requests }),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to batch record audit events`, error)
      throw error
    }
  }

  async getUserAuditEvents(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit?: number,
  ): Promise<AuditEvent[]> {
    try {
      this.logger.debug(`Getting audit events for user: ${userId}`)
      const response = await safeRpcCall<AuditEvent[]>(
        this.auditServiceClient.send(AUDIT_MESSAGES.GET_USER_EVENTS, {
          userId,
          startDate,
          endDate,
          limit,
        }),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get audit events for user: ${userId}`, error)
      throw error
    }
  }

  async getAccountAuditEvents(
    accountId: string,
    startDate: Date,
    endDate: Date,
    limit?: number,
  ): Promise<AuditEvent[]> {
    try {
      this.logger.debug(`Getting audit events for account: ${accountId}`)
      const response = await safeRpcCall<AuditEvent[]>(
        this.auditServiceClient.send(AUDIT_MESSAGES.GET_ACCOUNT_EVENTS, {
          accountId,
          startDate,
          endDate,
          limit,
        }),
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get audit events for account: ${accountId}`, error)
      throw error
    }
  }
}
