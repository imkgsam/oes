import { Injectable, UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../../auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter'
import { InMemoryPdaDeviceDiagnosticLogStore } from '../../../pda-bff/infrastructure/in-memory-pda-device-diagnostic-log.store'
import {
  AdminDeviceDetail,
  AdminTerminalDeviceStatus,
  AdminTerminalDeviceType,
  TerminalDeviceAdminAdapter
} from '../../infrastructure/downstream/terminal-device-admin.adapter'

@Injectable()
// Orchestrates Admin Terminal Device BFF reads and commands without owning device or session truth.
export class TerminalDeviceAdminUseCase {
  constructor(
    private readonly terminalDeviceAdapter: TerminalDeviceAdminAdapter,
    private readonly authAdapter: AuthGrpcAdapter,
    private readonly diagnosticLogStore: InMemoryPdaDeviceDiagnosticLogStore
  ) {}

  // Creates a tenant-scoped one-time enrollment through terminal-device-service.
  createEnrollment(dto: {
    terminalDeviceType: AdminTerminalDeviceType
    displayName: string
    expectedManufacturerSerial?: string | null
    expiresAt: string
    notes?: string | null
  }, source: DownstreamRequestSource) {
    return this.terminalDeviceAdapter.createEnrollment({
      tenantId: requireTenantId(source),
      terminalDeviceType: dto.terminalDeviceType,
      displayName: dto.displayName,
      expectedManufacturerSerial: dto.expectedManufacturerSerial,
      expiresAt: dto.expiresAt,
      notes: dto.notes,
      source
    })
  }

  // Lists tenant-scoped enrollment records without exposing one-time secrets.
  listEnrollments(query: {
    terminalDeviceType?: AdminTerminalDeviceType
    status?: 'EXPIRED' | 'ISSUED' | 'REVOKED' | 'USED'
    page?: number
    pageSize?: number
  }, source: DownstreamRequestSource) {
    return this.terminalDeviceAdapter.listEnrollments({
      tenantId: requireTenantId(source),
      ...query,
      source
    })
  }

  // Revokes one unused enrollment through terminal-device-service.
  revokeEnrollment(enrollmentId: string, dto: { reason: string }, source: DownstreamRequestSource) {
    return this.terminalDeviceAdapter.revokeEnrollment({
      tenantId: requireTenantId(source),
      enrollmentId,
      reason: dto.reason,
      source
    })
  }

  // Lists tenant-scoped terminal devices with runtime summary fields.
  listDevices(query: {
    terminalDeviceType?: AdminTerminalDeviceType
    status?: AdminTerminalDeviceStatus
    presenceStatus?: 'OFFLINE' | 'ONLINE' | 'STALE' | 'UNKNOWN'
    keyword?: string
    page?: number
    pageSize?: number
  }, source: DownstreamRequestSource) {
    return this.terminalDeviceAdapter.listDevices({
      tenantId: requireTenantId(source),
      ...query,
      source
    })
  }

  // Loads one device detail and augments it with auth-service current session truth when possible.
  async getDevice(terminalDeviceId: string, source: DownstreamRequestSource): Promise<AdminDeviceDetail & {
    currentSessions: Array<{ sessionId: string; accountId: string; displayName: string; createdAt: string; lastSeenAt?: string | null }>
    auditSummary: { lastStatusChangedAt?: string | null; lastStatusChangedBy?: string | null }
  }> {
    const tenantId = requireTenantId(source)
    const detail = await this.terminalDeviceAdapter.getDevice({
      tenantId,
      terminalDeviceId,
      includeSensitiveIdentity: hasPermission(source, 'terminal-device.sensitive.read'),
      source
    })
    const terminal = detail.device.terminalDeviceType === 'TOUCH_PANEL' ? 'KIOSK' : detail.device.terminalDeviceType
    const sessions = (await this.authAdapter.adminListTerminalDeviceSessions(terminalDeviceId, source, terminal)).sessions ?? []
    const currentSessions = sessions
      .filter((session) => session.terminalDeviceId === terminalDeviceId && !session.isRevoked)
      .map((session) => ({
        sessionId: session.sessionId ?? '',
        accountId: session.accountId ?? '',
        displayName: session.accountId ?? '',
        createdAt: session.createdAt ?? '',
        lastSeenAt: session.lastActiveAt ?? null
      }))

    return {
      ...detail,
      currentSessions,
      auditSummary: {
        lastStatusChangedAt: null,
        lastStatusChangedBy: null
      }
    }
  }

  // Updates non-lifecycle display fields on one terminal device.
  updateDevice(terminalDeviceId: string, dto: { displayName?: string | null; notes?: string | null }, source: DownstreamRequestSource) {
    return this.terminalDeviceAdapter.updateDevice({
      tenantId: requireTenantId(source),
      terminalDeviceId,
      displayName: dto.displayName,
      notes: dto.notes,
      source
    })
  }

  // Changes lifecycle status and asks auth-service to revoke terminal sessions when required.
  async changeStatus(terminalDeviceId: string, dto: { targetStatus: AdminTerminalDeviceStatus; reason?: string | null }, source: DownstreamRequestSource) {
    const tenantId = requireTenantId(source)
    const result = await this.terminalDeviceAdapter.changeStatus({
      tenantId,
      terminalDeviceId,
      targetStatus: dto.targetStatus,
      reason: dto.reason,
      source
    })
    const sessionRevoke = result.sessionRevokeIntent.required
      ? await this.authAdapter.handleTerminalDeviceUnavailable(
          {
            terminal: 'PDA',
            terminalDeviceId: result.sessionRevokeIntent.terminalDeviceId,
            deviceBoundTenantId: tenantId,
            reasonCode: result.status
          },
          source
        )
      : null

    return {
      terminalDeviceId: result.terminalDeviceId,
      previousStatus: result.previousStatus,
      status: result.status,
      statusReason: result.statusReason,
      changedAt: result.changedAt,
      sessionRevoke: {
        requested: result.sessionRevokeIntent.required,
        status: result.sessionRevokeIntent.required
          ? sessionRevoke?.handled
            ? 'ACCEPTED'
            : 'FAILED'
          : 'NOT_REQUESTED',
        affectedSessionCount: parseRevokedCount(sessionRevoke?.message)
      }
    }
  }

  // Reads tenant-level terminal app version policy.
  getVersionPolicy(query: { terminalDeviceType: AdminTerminalDeviceType }, source: DownstreamRequestSource) {
    return this.terminalDeviceAdapter.getVersionPolicy({
      tenantId: requireTenantId(source),
      terminalDeviceType: query.terminalDeviceType,
      source
    })
  }

  // Updates tenant-level terminal app version policy.
  upsertVersionPolicy(dto: {
    terminalDeviceType: AdminTerminalDeviceType
    minSupportedAppVersion: string
    latestAppVersion: string
    upgradeRequired: boolean
    upgradeRecommended: boolean
    apkDownloadUrl?: string | null
    releaseNotesUrl?: string | null
    reason: string
  }, source: DownstreamRequestSource) {
    return this.terminalDeviceAdapter.upsertVersionPolicy({
      tenantId: requireTenantId(source),
      ...dto,
      source
    })
  }

  // Lists terminal-device governance audit events.
  listAuditEvents(terminalDeviceId: string, query: { page?: number; pageSize?: number }, source: DownstreamRequestSource) {
    return this.terminalDeviceAdapter.listAuditEvents({
      tenantId: requireTenantId(source),
      terminalDeviceId,
      page: query.page,
      pageSize: query.pageSize,
      source
    })
  }

  // Lists immutable heartbeat diagnostics for one terminal device.
  listHeartbeatRecords(terminalDeviceId: string, query: { page?: number; pageSize?: number }, source: DownstreamRequestSource) {
    return this.terminalDeviceAdapter.listHeartbeatRecords({
      tenantId: requireTenantId(source),
      terminalDeviceId,
      page: query.page,
      pageSize: query.pageSize,
      source
    })
  }

  // Lists persisted PDA diagnostic logs through terminal-device-service.
  listDiagnosticLogs(terminalDeviceId: string, query: { page?: number; pageSize?: number }, source: DownstreamRequestSource) {
    return this.terminalDeviceAdapter.listDiagnosticLogs({
      tenantId: requireTenantId(source),
      terminalDeviceId,
      page: query.page,
      pageSize: query.pageSize,
      source
    })
  }
}

function requireTenantId(source: DownstreamRequestSource): string {
  const tenantId = source.user?.tenantId ?? source.user?.tid
  if (!tenantId?.trim()) {
    throw new UnauthorizedException('tenant context is required')
  }
  return tenantId
}

function hasPermission(source: DownstreamRequestSource, code: string): boolean {
  return source.user?.permissions?.includes(code) ?? false
}

function parseRevokedCount(message?: string): number {
  const match = message?.match(/Revoked\s+(\d+)/i)
  return match ? Number(match[1]) : 0
}
