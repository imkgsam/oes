import { Controller, Inject, Optional, UseGuards } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  AuthorizeInternalCall,
  getAuthenticatedGrpcRequestContext,
  TERMINAL_DEVICE_INTERNAL_PERMISSION_CODES,
  TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import {
  ActivateEnrollmentRequest,
  ActivateEnrollmentResponse,
  ChangeTerminalDeviceStatusRequest,
  ChangeTerminalDeviceStatusResponse,
  CreateEnrollmentRequest,
  CreateEnrollmentResponse,
  GetRuntimeSnapshotRequest,
  GetRuntimeSnapshotResponse,
  GetTerminalDeviceRequest,
  GetTerminalDeviceResponse,
  ListDiagnosticLogsRequest,
  ListDiagnosticLogsResponse,
  GetVersionPolicyRequest,
  GetVersionPolicyResponse,
  ListEnrollmentsRequest,
  ListEnrollmentsResponse,
  ListHeartbeatRecordsRequest,
  ListHeartbeatRecordsResponse,
  ListTerminalDeviceAuditEventsRequest,
  ListTerminalDeviceAuditEventsResponse,
  ListTerminalDevicesRequest,
  ListTerminalDevicesResponse,
  RecordHeartbeatRequest,
  RecordHeartbeatResponse,
  RecordDiagnosticLogsRequest,
  RecordDiagnosticLogsResponse,
  ResolveDeviceAccessDecisionRequest,
  ResolveDeviceAccessDecisionResponse,
  RevokeEnrollmentRequest,
  RevokeEnrollmentResponse,
  TerminalDeviceAccessDecisionServiceController,
  TerminalDeviceAccessDecisionServiceControllerMethods,
  TerminalDeviceEnrollmentServiceController,
  TerminalDeviceEnrollmentServiceControllerMethods,
  TerminalDeviceManagementServiceController,
  TerminalDeviceManagementServiceControllerMethods,
  TerminalDeviceRuntimeSnapshotServiceController,
  TerminalDeviceRuntimeSnapshotServiceControllerMethods,
  TerminalDeviceVersionPolicyServiceController,
  TerminalDeviceVersionPolicyServiceControllerMethods,
  UpdateTerminalDeviceRequest,
  UpdateTerminalDeviceResponse,
  UpsertVersionPolicyRequest,
  UpsertVersionPolicyResponse
} from '@oes/common/generated/terminal_device_service'
import {
  ActivateEnrollmentCommand,
  ActivateEnrollmentHandler,
  CreateEnrollmentCommand,
  CreateEnrollmentHandler,
  RevokeEnrollmentCommand,
  RevokeEnrollmentHandler
} from '../../application/commands/enrollment'
import {
  ChangeTerminalDeviceStatusCommand,
  ChangeTerminalDeviceStatusHandler,
  UpdateTerminalDeviceCommand,
  UpdateTerminalDeviceHandler
} from '../../application/commands/device'
import {
  RecordDiagnosticLogsCommand,
  RecordDiagnosticLogsHandler,
  RecordHeartbeatCommand,
  RecordHeartbeatHandler
} from '../../application/commands/runtime'
import {
  UpsertVersionPolicyCommand,
  UpsertVersionPolicyHandler
} from '../../application/commands/version-policy'
import {
  GetTerminalDeviceHandler,
  GetTerminalDeviceQuery,
  ListTerminalDeviceAuditEventsHandler,
  ListTerminalDeviceAuditEventsQuery,
  ListTerminalDevicesHandler,
  ListTerminalDevicesQuery
} from '../../application/queries/device'
import { ListEnrollmentsHandler, ListEnrollmentsQuery } from '../../application/queries/enrollment'
import {
  GetRuntimeSnapshotHandler,
  GetRuntimeSnapshotQuery,
  ListDiagnosticLogsHandler,
  ListDiagnosticLogsQuery,
  ListHeartbeatRecordsHandler,
  ListHeartbeatRecordsQuery
} from '../../application/queries/runtime'
import {
  GetVersionPolicyHandler,
  GetVersionPolicyQuery
} from '../../application/queries/version-policy'
import {
  DeviceAccessDecisionService,
  TerminalDeviceCredentialVerifierService
} from '../../application/services'
import { SYMBOLS } from '../../common/constants/symbols'
import { TerminalDeviceRepository } from '../../domain/repositories/terminal-device.repository'
import { TerminalDeviceError } from '../../domain/errors/terminal-device.error'
import { TerminalDeviceGrpcPresenter } from './terminal-device-grpc.presenter'

@Controller()
@UseGuards(TrustedExecutionGuard)
@TerminalDeviceEnrollmentServiceControllerMethods()
@TerminalDeviceAccessDecisionServiceControllerMethods()
@TerminalDeviceManagementServiceControllerMethods()
@TerminalDeviceRuntimeSnapshotServiceControllerMethods()
@TerminalDeviceVersionPolicyServiceControllerMethods()
// TerminalDeviceGrpcController exposes terminal-device-service application commands and queries over gRPC.
export class TerminalDeviceGrpcController
  implements
    TerminalDeviceEnrollmentServiceController,
    TerminalDeviceAccessDecisionServiceController,
    TerminalDeviceManagementServiceController,
    TerminalDeviceRuntimeSnapshotServiceController,
    TerminalDeviceVersionPolicyServiceController
{
  constructor(
    private readonly createEnrollmentHandler: CreateEnrollmentHandler,
    private readonly activateEnrollmentHandler: ActivateEnrollmentHandler,
    private readonly deviceAccessDecisionService: DeviceAccessDecisionService,
    private readonly recordHeartbeatHandler: RecordHeartbeatHandler,
    private readonly recordDiagnosticLogsHandler: RecordDiagnosticLogsHandler,
    private readonly getVersionPolicyHandler: GetVersionPolicyHandler,
    private readonly upsertVersionPolicyHandler: UpsertVersionPolicyHandler,
    private readonly listTerminalDevicesHandler: ListTerminalDevicesHandler,
    private readonly getTerminalDeviceHandler: GetTerminalDeviceHandler,
    private readonly changeTerminalDeviceStatusHandler: ChangeTerminalDeviceStatusHandler,
    private readonly updateTerminalDeviceHandler: UpdateTerminalDeviceHandler,
    private readonly listEnrollmentsHandler: ListEnrollmentsHandler,
    private readonly listTerminalDeviceAuditEventsHandler: ListTerminalDeviceAuditEventsHandler,
    private readonly getRuntimeSnapshotHandler: GetRuntimeSnapshotHandler,
    private readonly listHeartbeatRecordsHandler: ListHeartbeatRecordsHandler,
    private readonly listDiagnosticLogsHandler: ListDiagnosticLogsHandler,
    private readonly credentialVerifier: TerminalDeviceCredentialVerifierService,
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Optional()
    private readonly revokeEnrollmentHandler?: RevokeEnrollmentHandler
  ) {}

  // Handles enrollment creation by mapping the proto request into the application command.
  @AuthorizeBusinessRpc(
    { all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.CREATE_ENROLLMENT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async createEnrollment(request: CreateEnrollmentRequest): Promise<CreateEnrollmentResponse> {
    const result = await this.createEnrollmentHandler.execute(
      new CreateEnrollmentCommand({
        tenantId: tenantFrom(request),
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceType(
          request.terminalDeviceType
        ),
        displayName: request.displayName ?? '',
        expectedManufacturerSerial: emptyToNull(request.expectedManufacturerSerial),
        expiresAt: parseRequiredDate(request.expiresAt),
        notes: emptyToNull(request.notes),
        operatorContext: operatorFrom(request)
      })
    )

    return {
      enrollment: TerminalDeviceGrpcPresenter.toEnrollment(result),
      enrollmentCode: result.enrollmentCode
    }
  }

  // Handles enrollment listing by mapping tenant and lifecycle filters into the application query.
  @AuthorizeBusinessRpc(
    { all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_DEVICE] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async listEnrollments(request: ListEnrollmentsRequest): Promise<ListEnrollmentsResponse> {
    const result = await this.listEnrollmentsHandler.execute(
      new ListEnrollmentsQuery({
        tenantId: tenantFrom(request),
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromOptionalProtoTerminalDeviceType(
          request.terminalDeviceType
        ),
        status: TerminalDeviceGrpcPresenter.fromOptionalProtoEnrollmentStatus(request.status),
        page: request.pagination?.page,
        pageSize: request.pagination?.pageSize
      })
    )

    return TerminalDeviceGrpcPresenter.toListEnrollments(result)
  }

  // Handles enrollment revocation by delegating to the existing application command when available.
  @AuthorizeBusinessRpc(
    { all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.REVOKE_ENROLLMENT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async revokeEnrollment(request: RevokeEnrollmentRequest): Promise<RevokeEnrollmentResponse> {
    if (!this.revokeEnrollmentHandler) {
      throw new TerminalDeviceError(
        'ENROLLMENT_NOT_FOUND',
        'Revoke enrollment handler is not available'
      )
    }

    const result = await this.revokeEnrollmentHandler.execute(
      new RevokeEnrollmentCommand({
        tenantId: tenantFrom(request),
        enrollmentId: request.enrollmentId ?? '',
        reason: request.reason ?? '',
        operatorContext: operatorFrom(request)
      })
    )

    return {
      enrollment: TerminalDeviceGrpcPresenter.toEnrollment({
        enrollmentId: result.enrollmentId,
        status: result.status,
        revokedAt: result.revokedAt,
        revokedBy: result.revokedBy
      })
    }
  }

  // Handles device activation by mapping enrollment, identity and software facts into the application command.
  @AuthorizeInternalCall({ all: [TERMINAL_DEVICE_INTERNAL_PERMISSION_CODES.ACTIVATE_ENROLLMENT] })
  async activateEnrollment(
    request: ActivateEnrollmentRequest
  ): Promise<ActivateEnrollmentResponse> {
    internalGatewayFrom(request)
    const result = await this.activateEnrollmentHandler.execute(
      new ActivateEnrollmentCommand({
        enrollmentCode: request.enrollmentCode ?? '',
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceType(
          request.terminalDeviceType
        ),
        identity: {
          manufacturerSerial: emptyToNull(request.identity?.manufacturerSerial),
          androidId: emptyToNull(request.identity?.androidId),
          appInstallationId: emptyToNull(request.identity?.appInstallationId),
          manufacturer: emptyToNull(request.identity?.manufacturer),
          model: emptyToNull(request.identity?.model)
        },
        software: {
          androidVersion: emptyToNull(request.software?.androidVersion),
          webViewVersion: emptyToNull(request.software?.webViewVersion),
          appVersion: emptyToNull(request.software?.appVersion)
        },
        traceId: traceFrom(request)
      })
    )

    return TerminalDeviceGrpcPresenter.toActivationResult(result)
  }

  // Handles access decision requests by delegating governance decisions to the application service.
  @AuthorizeInternalCall({ all: [TERMINAL_DEVICE_INTERNAL_PERMISSION_CODES.RESOLVE_ACCESS] })
  async resolveDeviceAccessDecision(
    request: ResolveDeviceAccessDecisionRequest
  ): Promise<ResolveDeviceAccessDecisionResponse> {
    internalGatewayFrom(request)
    const device = await this.requireDeviceCredential(
      request.terminalDeviceId,
      request.deviceCredential,
      request.identity?.appInstallationId
    )
    const decision = await this.deviceAccessDecisionService.resolve({
      tenantId: device.tenantId,
      terminalDeviceId: emptyToNull(request.terminalDeviceId),
      terminalDeviceType: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceType(
        request.terminalDeviceType
      ),
      requestPurpose: TerminalDeviceGrpcPresenter.fromProtoRequestPurpose(request.requestPurpose),
      appVersion: emptyToNull(request.appVersion)
    })

    return {
      decision: TerminalDeviceGrpcPresenter.toDeviceAccessDecision(decision)
    }
  }

  // Handles terminal device listing by mapping filters into the application query.
  @AuthorizeBusinessRpc(
    { all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_DEVICE] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async listTerminalDevices(
    request: ListTerminalDevicesRequest
  ): Promise<ListTerminalDevicesResponse> {
    const result = await this.listTerminalDevicesHandler.execute(
      new ListTerminalDevicesQuery({
        tenantId: tenantFrom(request),
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromOptionalProtoTerminalDeviceType(
          request.terminalDeviceType
        ),
        status: TerminalDeviceGrpcPresenter.fromOptionalProtoTerminalDeviceStatus(request.status),
        presenceStatus: TerminalDeviceGrpcPresenter.fromOptionalProtoPresenceStatus(
          request.presenceStatus
        ),
        keyword: emptyToNull(request.keyword),
        page: request.pagination?.page,
        pageSize: request.pagination?.pageSize
      })
    )

    return TerminalDeviceGrpcPresenter.toListTerminalDevices(result)
  }

  // Handles terminal device detail lookups by mapping tenant scope into the application query.
  @AuthorizeBusinessRpc(
    { all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_DEVICE] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async getTerminalDevice(request: GetTerminalDeviceRequest): Promise<GetTerminalDeviceResponse> {
    const result = await this.getTerminalDeviceHandler.execute(
      new GetTerminalDeviceQuery({
        tenantId: tenantFrom(request),
        terminalDeviceId: request.terminalDeviceId ?? '',
        includeSensitiveIdentity: hasCode(
          request,
          TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_SENSITIVE_DEVICE
        )
      })
    )

    return {
      device: TerminalDeviceGrpcPresenter.toTerminalDeviceDetail(result.device),
      identity: TerminalDeviceGrpcPresenter.toTerminalDeviceIdentity(
        result.device,
        result.includeSensitiveIdentity
      ),
      runtime: TerminalDeviceGrpcPresenter.toRuntimeSnapshot(result.runtime)
    }
  }

  // Handles non-lifecycle device updates by delegating field ownership to the application command.
  @AuthorizeBusinessRpc(
    { all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.UPDATE_DEVICE] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async updateTerminalDevice(
    request: UpdateTerminalDeviceRequest
  ): Promise<UpdateTerminalDeviceResponse> {
    const result = await this.updateTerminalDeviceHandler.execute(
      new UpdateTerminalDeviceCommand({
        tenantId: tenantFrom(request),
        terminalDeviceId: request.terminalDeviceId ?? '',
        displayName: emptyToNull(request.displayName),
        notes: request.notes ?? null,
        operatorContext: operatorFrom(request)
      })
    )

    return TerminalDeviceGrpcPresenter.toUpdateTerminalDeviceResult(result)
  }

  // Handles lifecycle status changes by delegating transition rules to the application command.
  @AuthorizeBusinessRpc(
    {
      any: [
        TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.DISABLE_DEVICE,
        TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.MARK_LOST_DEVICE,
        TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.MARK_MAINTENANCE_DEVICE,
        TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.RESTORE_ACTIVE_DEVICE
      ]
    },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async changeTerminalDeviceStatus(
    request: ChangeTerminalDeviceStatusRequest
  ): Promise<ChangeTerminalDeviceStatusResponse> {
    assertStatusCode(
      request,
      TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceStatus(request.targetStatus)
    )
    const result = await this.changeTerminalDeviceStatusHandler.execute(
      new ChangeTerminalDeviceStatusCommand({
        tenantId: tenantFrom(request),
        terminalDeviceId: request.terminalDeviceId ?? '',
        targetStatus: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceStatus(
          request.targetStatus
        ),
        reason: emptyToNull(request.reason),
        operatorContext: operatorFrom(request)
      })
    )

    return TerminalDeviceGrpcPresenter.toChangeStatusResult(result)
  }

  // Handles device governance audit listing by mapping tenant scope and pagination into the query handler.
  @AuthorizeBusinessRpc(
    { all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_AUDIT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async listTerminalDeviceAuditEvents(
    request: ListTerminalDeviceAuditEventsRequest
  ): Promise<ListTerminalDeviceAuditEventsResponse> {
    const result = await this.listTerminalDeviceAuditEventsHandler.execute(
      new ListTerminalDeviceAuditEventsQuery({
        tenantId: tenantFrom(request),
        terminalDeviceId: request.terminalDeviceId ?? '',
        page: request.pagination?.page,
        pageSize: request.pagination?.pageSize
      })
    )

    return TerminalDeviceGrpcPresenter.toListTerminalDeviceAuditEvents(result)
  }

  // Handles runtime heartbeat recording by mapping diagnostics into the application command.
  @AuthorizeInternalCall({ all: [TERMINAL_DEVICE_INTERNAL_PERMISSION_CODES.RECORD_HEARTBEAT] })
  async recordHeartbeat(request: RecordHeartbeatRequest): Promise<RecordHeartbeatResponse> {
    internalGatewayFrom(request)
    await this.requireDeviceCredential(
      request.terminalDeviceId,
      request.deviceCredential,
      request.identity?.appInstallationId
    )
    const result = await this.recordHeartbeatHandler.execute(
      new RecordHeartbeatCommand({
        terminalDeviceId: request.terminalDeviceId ?? '',
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceType(
          request.terminalDeviceType
        ),
        appVersion: emptyToNull(request.software?.appVersion),
        androidVersion: emptyToNull(request.software?.androidVersion),
        webViewVersion: emptyToNull(request.software?.webViewVersion),
        networkStatus: TerminalDeviceGrpcPresenter.fromProtoNetworkStatus(
          request.runtime?.networkStatus
        ),
        networkType: TerminalDeviceGrpcPresenter.fromProtoNetworkType(request.runtime?.networkType),
        batteryLevel: request.runtime?.batteryLevel ?? null,
        appState: TerminalDeviceGrpcPresenter.fromProtoAppState(request.runtime?.appState),
        lastClientTime: parseOptionalDate(request.clientTime),
        session: request.reportedSession
          ? {
              accountId: emptyToNull(request.reportedSession.accountId),
              sessionId: emptyToNull(request.reportedSession.sessionId)
            }
          : null,
        traceId: traceFrom(request),
        receivedAt: undefined
      })
    )

    return TerminalDeviceGrpcPresenter.toHeartbeatResult(result)
  }

  // Handles current runtime snapshot lookups without treating heartbeat as login truth.
  @AuthorizeBusinessRpc(
    { all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_SENSITIVE_DEVICE] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async getRuntimeSnapshot(
    request: GetRuntimeSnapshotRequest
  ): Promise<GetRuntimeSnapshotResponse> {
    const snapshot = await this.getRuntimeSnapshotHandler.execute(
      new GetRuntimeSnapshotQuery({
        tenantId: tenantFrom(request),
        terminalDeviceId: request.terminalDeviceId ?? ''
      })
    )

    return {
      snapshot: TerminalDeviceGrpcPresenter.toRuntimeSnapshot(snapshot)
    }
  }

  // Handles immutable heartbeat history lookups for admin diagnostics.
  @AuthorizeBusinessRpc(
    { all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_SENSITIVE_DEVICE] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async listHeartbeatRecords(
    request: ListHeartbeatRecordsRequest
  ): Promise<ListHeartbeatRecordsResponse> {
    const result = await this.listHeartbeatRecordsHandler.execute(
      new ListHeartbeatRecordsQuery({
        tenantId: tenantFrom(request),
        terminalDeviceId: request.terminalDeviceId ?? '',
        page: request.pagination?.page,
        pageSize: request.pagination?.pageSize
      })
    )

    return {
      items: result.items.map((item) => TerminalDeviceGrpcPresenter.toHeartbeatRecord(item)),
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total
      }
    }
  }

  // Handles sanitized diagnostic log persistence for manually uploaded PDA logs.
  @AuthorizeInternalCall({ all: [TERMINAL_DEVICE_INTERNAL_PERMISSION_CODES.RECORD_DIAGNOSTIC_LOG] })
  async recordDiagnosticLogs(
    request: RecordDiagnosticLogsRequest
  ): Promise<RecordDiagnosticLogsResponse> {
    internalGatewayFrom(request)
    const device = await this.requireDeviceCredential(
      request.terminalDeviceId,
      request.deviceCredential,
      null
    )
    const result = await this.recordDiagnosticLogsHandler.execute(
      new RecordDiagnosticLogsCommand({
        tenantId: device.tenantId,
        terminalDeviceId: request.terminalDeviceId ?? '',
        logs: (request.logs ?? []).map((log) => ({
          accountId: emptyToNull(log.reportedAccountId),
          sessionId: emptyToNull(log.reportedSessionId),
          clientTime: parseRequiredDate(log.clientTime),
          receivedAt: new Date(),
          level: log.level ?? '',
          eventType: log.eventType ?? '',
          message: log.message ?? '',
          traceId: traceFrom(request),
          requestId: requestIdFrom(request),
          errorCode: emptyToNull(log.errorCode),
          diagnosticMode: log.diagnosticMode ?? false,
          details: parseDetailsJson(log.detailsJson)
        }))
      })
    )

    return {
      accepted: result.accepted,
      receivedCount: result.receivedCount
    }
  }

  // Handles persisted diagnostic log history lookups for admin diagnostics.
  @AuthorizeBusinessRpc(
    { all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_SENSITIVE_DEVICE] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async listDiagnosticLogs(
    request: ListDiagnosticLogsRequest
  ): Promise<ListDiagnosticLogsResponse> {
    const result = await this.listDiagnosticLogsHandler.execute(
      new ListDiagnosticLogsQuery({
        tenantId: tenantFrom(request),
        terminalDeviceId: request.terminalDeviceId ?? '',
        page: request.pagination?.page,
        pageSize: request.pagination?.pageSize
      })
    )

    return {
      items: result.items.map((item) => TerminalDeviceGrpcPresenter.toDiagnosticLog(item)),
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total
      }
    }
  }

  // Handles version policy reads by mapping tenant and device type into the application query.
  @AuthorizeBusinessRpc(
    { all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_DEVICE] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async getVersionPolicy(request: GetVersionPolicyRequest): Promise<GetVersionPolicyResponse> {
    const policy = await this.getVersionPolicyHandler.execute(
      new GetVersionPolicyQuery({
        tenantId: tenantFrom(request),
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceType(
          request.terminalDeviceType
        )
      })
    )

    return {
      policy: policy ? TerminalDeviceGrpcPresenter.toVersionPolicy(policy) : undefined
    }
  }

  // Handles version policy upserts by mapping administrator input into the application command.
  @AuthorizeBusinessRpc(
    { all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.MANAGE_VERSION_POLICY] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async upsertVersionPolicy(
    request: UpsertVersionPolicyRequest
  ): Promise<UpsertVersionPolicyResponse> {
    const policy = await this.upsertVersionPolicyHandler.execute(
      new UpsertVersionPolicyCommand({
        tenantId: tenantFrom(request),
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceType(
          request.terminalDeviceType
        ),
        minSupportedAppVersion: request.minSupportedAppVersion ?? '',
        latestAppVersion: request.latestAppVersion ?? '',
        upgradeRequired: request.upgradeRequired ?? false,
        upgradeRecommended: request.upgradeRecommended ?? false,
        apkDownloadUrl: emptyToNull(request.apkDownloadUrl),
        releaseNotesUrl: emptyToNull(request.releaseNotesUrl),
        reason: emptyToNull(request.reason),
        operatorContext: operatorFrom(request)
      })
    )

    return {
      policy: TerminalDeviceGrpcPresenter.toVersionPolicy(policy)
    }
  }

  /** Validates the service-owned device proof before a Gateway INTERNAL handler reaches application logic. */
  private async requireDeviceCredential(
    terminalDeviceId: string | undefined,
    credential: string | undefined,
    appInstallationId: string | null | undefined
  ) {
    const device = await this.terminalDeviceRepository.findById(terminalDeviceId ?? '')
    if (!device)
      throw new TerminalDeviceError(
        'TERMINAL_DEVICE_CREDENTIAL_INVALID',
        'Terminal device credential is invalid'
      )
    this.credentialVerifier.verify(
      device,
      credential,
      appInstallationId ?? device.appInstallationId
    )
    return device
  }
}

// emptyToNull normalizes absent proto strings before constructing application commands or queries.
function emptyToNull(value?: string | null): string | null {
  return value?.trim() ? value : null
}

// parseRequiredDate converts a required proto date string into a Date for application commands.
function parseRequiredDate(value?: string | null): Date {
  return new Date(value ?? '')
}

// parseOptionalDate converts optional proto date strings into nullable Date values.
function parseOptionalDate(value?: string | null): Date | null {
  return value?.trim() ? new Date(value) : null
}

// parseDetailsJson safely maps a generated JSON string into diagnostic details.
function parseDetailsJson(value?: string | null): Record<string, unknown> {
  if (!value?.trim()) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/** Derives tenant authority solely from the verified ExecutionToken attached by the trusted guard. */
function tenantFrom(request: object): string {
  const tenantId = getAuthenticatedGrpcRequestContext(request)?.verifiedExecutionToken?.tenantId
  if (!tenantId)
    throw new TerminalDeviceError(
      'TERMINAL_DEVICE_CREDENTIAL_INVALID',
      'Trusted tenant is required'
    )
  return tenantId
}

/** Derives audit actor, organization and trace from verified transport instead of removed request fields. */
function operatorFrom(request: object): {
  operatorAccountId: string
  operatorOrgId: string | null
  traceId: string | null
} {
  const context = getAuthenticatedGrpcRequestContext(request)
  const token = context?.verifiedExecutionToken
  if (!token?.subject)
    throw new TerminalDeviceError(
      'TERMINAL_DEVICE_CREDENTIAL_INVALID',
      'Trusted operator is required'
    )
  return {
    operatorAccountId: token.subject,
    operatorOrgId: token.orgId ?? null,
    traceId: (context as { traceId?: string } | undefined)?.traceId ?? null
  }
}

function traceFrom(request: object): string | null {
  return (
    (getAuthenticatedGrpcRequestContext(request) as { traceId?: string } | undefined)?.traceId ??
    null
  )
}
function requestIdFrom(request: object): string | null {
  return (
    (getAuthenticatedGrpcRequestContext(request) as { requestId?: string } | undefined)
      ?.requestId ?? null
  )
}
function hasCode(request: object, code: string): boolean {
  return (
    getAuthenticatedGrpcRequestContext(request)?.verifiedExecutionToken?.permissionCodes.includes(
      code
    ) ?? false
  )
}

/** Narrows generic INTERNAL proof to the exact configured Gateway SYSTEM MACHINE workload. */
function internalGatewayFrom(request: object): void {
  const context = getAuthenticatedGrpcRequestContext(request)
  const token = context?.verifiedExecutionToken
  const workload = context?.verifiedWorkloadIdentity
  const expected = process.env.GATEWAY_TERMINAL_DEVICE_SPIFFE_ID
  if (
    !expected ||
    expected.trim() !== expected ||
    token?.principalType !== 'MACHINE' ||
    token.tenantId !== undefined ||
    token.orgId !== undefined ||
    token.actor !== undefined ||
    token.delegationId !== undefined ||
    token.clientId !== expected ||
    workload?.spiffeId !== expected
  ) {
    throw new TerminalDeviceError(
      'TERMINAL_DEVICE_CREDENTIAL_INVALID',
      'Gateway machine execution is invalid'
    )
  }
}

/** Enforces frozen lifecycle target-to-Code binding after the trusted BUSINESS declaration admits one lifecycle code. */
function assertStatusCode(request: object, status: string): void {
  const required: Record<string, string> = {
    DISABLED: TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.DISABLE_DEVICE,
    LOST: TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.MARK_LOST_DEVICE,
    MAINTENANCE: TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.MARK_MAINTENANCE_DEVICE,
    ACTIVE: TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.RESTORE_ACTIVE_DEVICE,
    DECOMMISSIONED: TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.DISABLE_DEVICE
  }
  if (!required[status] || !hasCode(request, required[status]))
    throw new TerminalDeviceError(
      'TERMINAL_DEVICE_CREDENTIAL_INVALID',
      'Lifecycle permission does not match target status'
    )
}
