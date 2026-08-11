import { TerminalDeviceAuditEventEntity } from '../../../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceDiagnosticLogEntity } from '../../../domain/entities/terminal-device-diagnostic-log.entity'
import { TerminalDeviceEnrollmentEntity } from '../../../domain/entities/terminal-device-enrollment.entity'
import { TerminalDeviceHeartbeatRecordEntity } from '../../../domain/entities/terminal-device-heartbeat-record.entity'
import { TerminalDeviceRuntimeSnapshotEntity } from '../../../domain/entities/terminal-device-runtime-snapshot.entity'
import { TerminalDeviceVersionPolicyEntity } from '../../../domain/entities/terminal-device-version-policy.entity'
import { TerminalDeviceEntity } from '../../../domain/entities/terminal-device.entity'

// PrismaTerminalDeviceMapper converts between Prisma records and terminal-device domain entities.
export class PrismaTerminalDeviceMapper {
  // Converts a TerminalDevice row into the domain registry entity.
  static toDeviceEntity(record: any): TerminalDeviceEntity {
    return new TerminalDeviceEntity({
      terminalDeviceId: record.terminalDeviceId,
      tenantId: record.tenantId,
      terminalDeviceType: record.terminalDeviceType,
      displayName: record.displayName,
      status: record.status,
      statusReason: record.statusReason,
      enrollmentId: record.enrollmentId,
      manufacturerSerial: record.manufacturerSerial,
      androidId: record.androidId,
      appInstallationId: record.appInstallationId,
      deviceCredentialHash: record.deviceCredentialHash ?? null,
      deviceCredentialPreviousHash: record.deviceCredentialPreviousHash ?? null,
      deviceCredentialVersion: record.deviceCredentialVersion ?? 1,
      deviceCredentialPreviousVersion: record.deviceCredentialPreviousVersion ?? null,
      deviceCredentialExpiresAt: record.deviceCredentialExpiresAt ?? null,
      deviceCredentialPreviousExpiresAt: record.deviceCredentialPreviousExpiresAt ?? null,
      deviceCredentialState: record.deviceCredentialState ?? 'ACTIVE',
      manufacturer: record.manufacturer,
      model: record.model,
      androidVersion: record.androidVersion,
      registeredAt: record.registeredAt,
      updatedAt: record.updatedAt,
      notes: record.notes
    })
  }

  // Converts a domain registry entity into a Prisma write payload.
  static toDeviceData(entity: TerminalDeviceEntity): Record<string, unknown> {
    return {
      terminalDeviceId: entity.terminalDeviceId,
      tenantId: entity.tenantId,
      terminalDeviceType: entity.terminalDeviceType,
      displayName: entity.displayName,
      status: entity.status,
      statusReason: entity.statusReason,
      enrollmentId: entity.enrollmentId,
      manufacturerSerial: entity.manufacturerSerial,
      androidId: entity.androidId,
      appInstallationId: entity.appInstallationId,
      deviceCredentialHash: entity.deviceCredentialHash,
      deviceCredentialPreviousHash: entity.deviceCredentialPreviousHash,
      deviceCredentialVersion: entity.deviceCredentialVersion,
      deviceCredentialPreviousVersion: entity.deviceCredentialPreviousVersion,
      deviceCredentialExpiresAt: entity.deviceCredentialExpiresAt,
      deviceCredentialPreviousExpiresAt: entity.deviceCredentialPreviousExpiresAt,
      deviceCredentialState: entity.deviceCredentialState,
      manufacturer: entity.manufacturer,
      model: entity.model,
      androidVersion: entity.androidVersion,
      registeredAt: entity.registeredAt,
      updatedAt: entity.updatedAt,
      notes: entity.notes
    }
  }

  // Converts a TerminalDeviceEnrollment row into the domain enrollment entity.
  static toEnrollmentEntity(record: any): TerminalDeviceEnrollmentEntity {
    return new TerminalDeviceEnrollmentEntity({
      enrollmentId: record.enrollmentId,
      tenantId: record.tenantId,
      terminalDeviceType: record.terminalDeviceType,
      displayName: record.displayName,
      codeHash: record.codeHash,
      status: record.status,
      expectedManufacturerSerial: record.expectedManufacturerSerial,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
      usedByTerminalDeviceId: record.usedByTerminalDeviceId,
      revokedAt: record.revokedAt,
      revokedBy: record.revokedBy,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      notes: record.notes
    })
  }

  // Converts a domain enrollment entity into a Prisma write payload.
  static toEnrollmentData(entity: TerminalDeviceEnrollmentEntity): Record<string, unknown> {
    return {
      enrollmentId: entity.enrollmentId,
      tenantId: entity.tenantId,
      terminalDeviceType: entity.terminalDeviceType,
      displayName: entity.displayName,
      codeHash: entity.codeHash,
      status: entity.status,
      expectedManufacturerSerial: entity.expectedManufacturerSerial,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      usedByTerminalDeviceId: entity.usedByTerminalDeviceId,
      revokedAt: entity.revokedAt,
      revokedBy: entity.revokedBy,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      notes: entity.notes
    }
  }

  // Converts a TerminalDeviceRuntimeSnapshot row into the domain runtime entity.
  static toRuntimeSnapshotEntity(record: any): TerminalDeviceRuntimeSnapshotEntity {
    return new TerminalDeviceRuntimeSnapshotEntity({
      terminalDeviceId: record.terminalDeviceId,
      tenantId: record.tenantId,
      presenceStatus: record.presenceStatus,
      lastHeartbeatAt: record.lastHeartbeatAt,
      lastClientTime: record.lastClientTime,
      appVersion: record.appVersion,
      androidVersion: record.androidVersion,
      webViewVersion: record.webViewVersion,
      networkStatus: record.networkStatus,
      networkType: record.networkType,
      batteryLevel: record.batteryLevel,
      appState: record.appState,
      lastReportedAccountId: record.lastReportedAccountId,
      lastReportedSessionId: record.lastReportedSessionId
    })
  }

  // Converts a domain runtime entity into a Prisma write payload.
  static toRuntimeSnapshotData(entity: TerminalDeviceRuntimeSnapshotEntity): Record<string, unknown> {
    return {
      terminalDeviceId: entity.terminalDeviceId,
      tenantId: entity.tenantId,
      presenceStatus: entity.presenceStatus,
      lastHeartbeatAt: entity.lastHeartbeatAt,
      lastClientTime: entity.lastClientTime,
      appVersion: entity.appVersion,
      androidVersion: entity.androidVersion,
      webViewVersion: entity.webViewVersion,
      networkStatus: entity.networkStatus,
      networkType: entity.networkType,
      batteryLevel: entity.batteryLevel,
      appState: entity.appState,
      lastReportedAccountId: entity.lastReportedAccountId,
      lastReportedSessionId: entity.lastReportedSessionId
    }
  }

  // Converts a TerminalDeviceHeartbeatRecord row into the domain heartbeat record entity.
  static toHeartbeatRecordEntity(record: any): TerminalDeviceHeartbeatRecordEntity {
    return new TerminalDeviceHeartbeatRecordEntity({
      heartbeatId: record.heartbeatId,
      terminalDeviceId: record.terminalDeviceId,
      tenantId: record.tenantId,
      presenceStatus: record.presenceStatus,
      receivedAt: record.receivedAt,
      clientTime: record.clientTime,
      appVersion: record.appVersion,
      androidVersion: record.androidVersion,
      webViewVersion: record.webViewVersion,
      networkStatus: record.networkStatus,
      networkType: record.networkType,
      batteryLevel: record.batteryLevel,
      appState: record.appState,
      reportedAccountId: record.reportedAccountId,
      reportedSessionId: record.reportedSessionId,
      traceId: record.traceId
    })
  }

  // Converts a domain heartbeat record entity into a Prisma write payload.
  static toHeartbeatRecordData(entity: TerminalDeviceHeartbeatRecordEntity): Record<string, unknown> {
    return {
      heartbeatId: entity.heartbeatId,
      terminalDeviceId: entity.terminalDeviceId,
      tenantId: entity.tenantId,
      presenceStatus: entity.presenceStatus,
      receivedAt: entity.receivedAt,
      clientTime: entity.clientTime,
      appVersion: entity.appVersion,
      androidVersion: entity.androidVersion,
      webViewVersion: entity.webViewVersion,
      networkStatus: entity.networkStatus,
      networkType: entity.networkType,
      batteryLevel: entity.batteryLevel,
      appState: entity.appState,
      reportedAccountId: entity.reportedAccountId,
      reportedSessionId: entity.reportedSessionId,
      traceId: entity.traceId
    }
  }

  // Converts a TerminalDeviceDiagnosticLog row into the domain diagnostic log entity.
  static toDiagnosticLogEntity(record: any): TerminalDeviceDiagnosticLogEntity {
    return new TerminalDeviceDiagnosticLogEntity({
      diagnosticLogId: record.diagnosticLogId,
      terminalDeviceId: record.terminalDeviceId,
      tenantId: record.tenantId,
      accountId: record.accountId,
      sessionId: record.sessionId,
      clientTime: record.clientTime,
      receivedAt: record.receivedAt,
      level: record.level,
      eventType: record.eventType,
      message: record.message,
      traceId: record.traceId,
      requestId: record.requestId,
      errorCode: record.errorCode,
      diagnosticMode: record.diagnosticMode,
      details: normalizeDetails(record.detailsJson)
    })
  }

  // Converts a domain diagnostic log entity into a Prisma write payload.
  static toDiagnosticLogData(entity: TerminalDeviceDiagnosticLogEntity): Record<string, unknown> {
    return {
      diagnosticLogId: entity.diagnosticLogId,
      terminalDeviceId: entity.terminalDeviceId,
      tenantId: entity.tenantId,
      accountId: entity.accountId,
      sessionId: entity.sessionId,
      clientTime: entity.clientTime,
      receivedAt: entity.receivedAt,
      level: entity.level,
      eventType: entity.eventType,
      message: entity.message,
      traceId: entity.traceId,
      requestId: entity.requestId,
      errorCode: entity.errorCode,
      diagnosticMode: entity.diagnosticMode,
      detailsJson: entity.details
    }
  }

  // Converts a TerminalDeviceVersionPolicy row into the domain version policy entity.
  static toVersionPolicyEntity(record: any): TerminalDeviceVersionPolicyEntity {
    return new TerminalDeviceVersionPolicyEntity({
      versionPolicyId: record.versionPolicyId,
      tenantId: record.tenantId,
      terminalDeviceType: record.terminalDeviceType,
      minSupportedAppVersion: record.minSupportedAppVersion,
      latestAppVersion: record.latestAppVersion,
      upgradeRequired: record.upgradeRequired,
      upgradeRecommended: record.upgradeRecommended,
      apkDownloadUrl: record.apkDownloadUrl,
      releaseNotesUrl: record.releaseNotesUrl,
      updatedBy: record.updatedBy,
      updatedAt: record.updatedAt,
      createdAt: record.createdAt
    })
  }

  // Converts a domain version policy entity into a Prisma write payload.
  static toVersionPolicyData(entity: TerminalDeviceVersionPolicyEntity): Record<string, unknown> {
    return {
      versionPolicyId: entity.versionPolicyId,
      tenantId: entity.tenantId,
      terminalDeviceType: entity.terminalDeviceType,
      minSupportedAppVersion: entity.minSupportedAppVersion,
      latestAppVersion: entity.latestAppVersion,
      upgradeRequired: entity.upgradeRequired,
      upgradeRecommended: entity.upgradeRecommended,
      apkDownloadUrl: entity.apkDownloadUrl,
      releaseNotesUrl: entity.releaseNotesUrl,
      updatedBy: entity.updatedBy,
      updatedAt: entity.updatedAt,
      createdAt: entity.createdAt
    }
  }

  // Converts a TerminalDeviceAuditEvent row into the domain audit event entity.
  static toAuditEventEntity(record: any): TerminalDeviceAuditEventEntity {
    return new TerminalDeviceAuditEventEntity({
      auditEventId: record.auditEventId,
      tenantId: record.tenantId,
      operatorAccountId: record.operatorAccountId,
      operatorOrgId: record.operatorOrgId,
      action: record.action,
      targetTerminalDeviceId: record.targetTerminalDeviceId,
      beforeJson: record.beforeJson as Record<string, unknown> | null,
      afterJson: record.afterJson as Record<string, unknown> | null,
      reason: record.reason,
      traceId: record.traceId,
      occurredAt: record.occurredAt
    })
  }

  // Converts a domain audit event entity into a Prisma write payload.
  static toAuditEventData(entity: TerminalDeviceAuditEventEntity): Record<string, unknown> {
    return {
      auditEventId: entity.auditEventId,
      tenantId: entity.tenantId,
      operatorAccountId: entity.operatorAccountId,
      operatorOrgId: entity.operatorOrgId,
      action: entity.action,
      targetTerminalDeviceId: entity.targetTerminalDeviceId,
      beforeJson: entity.beforeJson,
      afterJson: entity.afterJson,
      reason: entity.reason,
      traceId: entity.traceId,
      occurredAt: entity.occurredAt
    }
  }
}

function normalizeDetails(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}
