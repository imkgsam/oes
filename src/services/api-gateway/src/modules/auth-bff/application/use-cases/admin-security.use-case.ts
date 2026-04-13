import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { AdminAuditEventQueryDto, AdminRevokeSessionDto } from '../../interfaces/http/dtos/admin-security.dto'
import {
  AdminAuditEventListViewModel,
  AdminAuditEventViewModel,
  AdminSessionListViewModel,
  AdminSessionMutationViewModel,
  AdminSessionViewModel
} from '../../interfaces/http/view-models/admin-security.view-model'

@Injectable()
// Executes administrator-facing auth session and audit operations through the auth-service contract.
export class AdminSecurityUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async listUserSessions(
    userId: string,
    source: DownstreamRequestSource
  ): Promise<AdminSessionListViewModel> {
    const result = await this.authAdapter.adminListUserSessions(userId.trim(), source)

    return {
      sessions: (result.sessions ?? []).map(
        (session): AdminSessionViewModel => ({
          sessionId: session.sessionId ?? '',
          userId: session.userId ?? '',
          accountId: session.accountId ?? undefined,
          tenantId: session.tenantId ?? undefined,
          status: session.status ?? '',
          loginMethod: session.loginMethod ?? '',
          deviceId: session.deviceId ?? undefined,
          deviceName: session.deviceName ?? undefined,
          userAgent: session.userAgent ?? undefined,
          ipAddress: session.ipAddress ?? undefined,
          platform: session.platform ?? undefined,
          browser: session.browser ?? undefined,
          createdAt: session.createdAt ?? '',
          lastActiveAt: session.lastActiveAt ?? '',
          expiresAt: session.expiresAt ?? '',
          refreshExpiresAt: session.refreshExpiresAt ?? '',
          accessRemainingSeconds: Number(session.accessRemainingSeconds ?? '0'),
          refreshRemainingSeconds: Number(session.refreshRemainingSeconds ?? '0'),
          sessionAgeSeconds: Number(session.sessionAgeSeconds ?? '0'),
          idleSeconds: Number(session.idleSeconds ?? '0'),
          isAccessExpired: Boolean(session.isAccessExpired),
          isRefreshExpired: Boolean(session.isRefreshExpired),
          isRevoked: Boolean(session.isRevoked),
          isAdminControlled: Boolean(session.isAdminControlled),
          adminRevokeReason: session.adminRevokeReason ?? undefined,
          adminRevokeAt: session.adminRevokeAt ?? undefined,
          adminRevokeBy: session.adminRevokeBy ?? undefined
        })
      )
    }
  }

  async revokeSession(
    sessionId: string,
    dto: AdminRevokeSessionDto,
    source: DownstreamRequestSource
  ): Promise<AdminSessionMutationViewModel> {
    const result = await this.authAdapter.adminRevokeSession(
      sessionId.trim(),
      dto.reason.trim(),
      source
    )

    return {
      success: Boolean(result.success),
      sessionId: result.sessionId ?? sessionId.trim()
    }
  }

  async listAuditEvents(
    query: AdminAuditEventQueryDto,
    source: DownstreamRequestSource
  ): Promise<AdminAuditEventListViewModel> {
    const result = await this.authAdapter.listAuditEvents(
      {
        service: query.service?.trim(),
        module: query.module?.trim(),
        eventType: query.eventType?.trim(),
        result: query.result?.trim(),
        operatorId: query.operatorId?.trim(),
        tenantId: query.tenantId?.trim(),
        orgId: query.orgId?.trim(),
        resourceType: query.resourceType?.trim(),
        resourceId: query.resourceId?.trim(),
        occurredAtFrom: query.occurredAtFrom?.trim(),
        occurredAtTo: query.occurredAtTo?.trim(),
        cursor: query.cursor?.trim(),
        pageSize: query.pageSize
      },
      source
    )

    return {
      items: (result.items ?? []).map(
        (item): AdminAuditEventViewModel => ({
          eventId: item.eventId ?? '',
          service: item.service ?? undefined,
          module: item.module ?? undefined,
          eventType: item.eventType ?? undefined,
          occurredAt: item.occurredAt ?? undefined,
          result: item.result ?? undefined,
          operatorId: item.operatorId ?? undefined,
          operatorType: item.operatorType ?? undefined,
          tenantId: item.tenantId ?? undefined,
          orgId: item.orgId ?? undefined,
          traceId: item.traceId ?? undefined,
          resourceType: item.resourceType ?? undefined,
          resourceId: item.resourceId ?? undefined,
          detailsJson: item.detailsJson ?? undefined
        })
      ),
      nextCursor: result.nextCursor ?? undefined
    }
  }
}
