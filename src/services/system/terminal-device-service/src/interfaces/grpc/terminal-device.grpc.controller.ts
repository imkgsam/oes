import { status as GrpcStatus } from '@grpc/grpc-js'
import { Controller, Optional } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
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
  GetVersionPolicyRequest,
  GetVersionPolicyResponse,
  ListEnrollmentsRequest,
  ListEnrollmentsResponse,
  ListTerminalDeviceAuditEventsRequest,
  ListTerminalDeviceAuditEventsResponse,
  ListTerminalDevicesRequest,
  ListTerminalDevicesResponse,
  RecordHeartbeatRequest,
  RecordHeartbeatResponse,
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
import { ChangeTerminalDeviceStatusCommand, ChangeTerminalDeviceStatusHandler } from '../../application/commands/device'
import { RecordHeartbeatCommand, RecordHeartbeatHandler } from '../../application/commands/runtime'
import { UpsertVersionPolicyCommand, UpsertVersionPolicyHandler } from '../../application/commands/version-policy'
import {
  GetTerminalDeviceHandler,
  GetTerminalDeviceQuery,
  ListTerminalDevicesHandler,
  ListTerminalDevicesQuery
} from '../../application/queries/device'
import { GetVersionPolicyHandler, GetVersionPolicyQuery } from '../../application/queries/version-policy'
import { DeviceAccessDecisionService } from '../../application/services'
import { TerminalDeviceError } from '../../domain/errors/terminal-device.error'
import { TerminalDeviceGrpcPresenter } from './terminal-device-grpc.presenter'

@Controller()
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
    private readonly getVersionPolicyHandler: GetVersionPolicyHandler,
    private readonly upsertVersionPolicyHandler: UpsertVersionPolicyHandler,
    private readonly listTerminalDevicesHandler: ListTerminalDevicesHandler,
    private readonly getTerminalDeviceHandler: GetTerminalDeviceHandler,
    private readonly changeTerminalDeviceStatusHandler: ChangeTerminalDeviceStatusHandler,
    @Optional()
    private readonly revokeEnrollmentHandler?: RevokeEnrollmentHandler
  ) {}

  // Handles enrollment creation by mapping the proto request into the application command.
  async createEnrollment(request: CreateEnrollmentRequest): Promise<CreateEnrollmentResponse> {
    const result = await this.createEnrollmentHandler.execute(
      new CreateEnrollmentCommand({
        tenantId: request.tenantId ?? '',
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceType(request.terminalDeviceType),
        displayName: request.displayName ?? '',
        expectedManufacturerSerial: emptyToNull(request.expectedManufacturerSerial),
        expiresAt: parseRequiredDate(request.expiresAt),
        notes: emptyToNull(request.notes),
        operatorContext: toOperatorContext(request.operatorContext)
      })
    )

    return {
      enrollment: TerminalDeviceGrpcPresenter.toEnrollment(result),
      enrollmentCode: result.enrollmentCode
    }
  }

  // Rejects enrollment list requests until a backed query contract is implemented.
  listEnrollments(_request: ListEnrollmentsRequest): ListEnrollmentsResponse {
    throwUnimplemented('ListEnrollments')
  }

  // Handles enrollment revocation by delegating to the existing application command when available.
  async revokeEnrollment(request: RevokeEnrollmentRequest): Promise<RevokeEnrollmentResponse> {
    if (!this.revokeEnrollmentHandler) {
      throw new TerminalDeviceError('ENROLLMENT_NOT_FOUND', 'Revoke enrollment handler is not available')
    }

    const result = await this.revokeEnrollmentHandler.execute(
      new RevokeEnrollmentCommand({
        tenantId: request.tenantId ?? '',
        enrollmentId: request.enrollmentId ?? '',
        reason: request.reason ?? '',
        operatorContext: toOperatorContext(request.operatorContext)
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
  async activateEnrollment(request: ActivateEnrollmentRequest): Promise<ActivateEnrollmentResponse> {
    const result = await this.activateEnrollmentHandler.execute(
      new ActivateEnrollmentCommand({
        enrollmentCode: request.enrollmentCode ?? '',
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceType(request.terminalDeviceType),
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
        traceId: emptyToNull(request.traceId)
      })
    )

    return TerminalDeviceGrpcPresenter.toActivationResult(result)
  }

  // Handles access decision requests by delegating governance decisions to the application service.
  async resolveDeviceAccessDecision(
    request: ResolveDeviceAccessDecisionRequest
  ): Promise<ResolveDeviceAccessDecisionResponse> {
    const decision = await this.deviceAccessDecisionService.resolve({
      tenantId: emptyToNull(request.tenantId),
      terminalDeviceId: emptyToNull(request.terminalDeviceId),
      terminalDeviceType: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceType(request.terminalDeviceType),
      requestPurpose: TerminalDeviceGrpcPresenter.fromProtoRequestPurpose(request.requestPurpose),
      appVersion: emptyToNull(request.appVersion)
    })

    return {
      decision: TerminalDeviceGrpcPresenter.toDeviceAccessDecision(decision)
    }
  }

  // Handles terminal device listing by mapping filters into the application query.
  async listTerminalDevices(request: ListTerminalDevicesRequest): Promise<ListTerminalDevicesResponse> {
    const result = await this.listTerminalDevicesHandler.execute(
      new ListTerminalDevicesQuery({
        tenantId: request.tenantId ?? '',
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromOptionalProtoTerminalDeviceType(request.terminalDeviceType),
        status: TerminalDeviceGrpcPresenter.fromOptionalProtoTerminalDeviceStatus(request.status),
        presenceStatus: TerminalDeviceGrpcPresenter.fromOptionalProtoPresenceStatus(request.presenceStatus),
        keyword: emptyToNull(request.keyword),
        page: request.pagination?.page,
        pageSize: request.pagination?.pageSize
      })
    )

    return TerminalDeviceGrpcPresenter.toListTerminalDevices(result)
  }

  // Handles terminal device detail lookups by mapping tenant scope into the application query.
  async getTerminalDevice(request: GetTerminalDeviceRequest): Promise<GetTerminalDeviceResponse> {
    const result = await this.getTerminalDeviceHandler.execute(
      new GetTerminalDeviceQuery({
        tenantId: request.tenantId ?? '',
        terminalDeviceId: request.terminalDeviceId ?? '',
        includeSensitiveIdentity: request.includeSensitiveIdentity ?? false
      })
    )

    return {
      device: TerminalDeviceGrpcPresenter.toTerminalDeviceDetail(result.device),
      identity: TerminalDeviceGrpcPresenter.toTerminalDeviceIdentity(result.device, result.includeSensitiveIdentity),
      runtime: TerminalDeviceGrpcPresenter.toRuntimeSnapshot(result.runtime)
    }
  }

  // Rejects non-lifecycle update requests until a backed command contract is implemented.
  updateTerminalDevice(_request: UpdateTerminalDeviceRequest): UpdateTerminalDeviceResponse {
    throwUnimplemented('UpdateTerminalDevice')
  }

  // Handles lifecycle status changes by delegating transition rules to the application command.
  async changeTerminalDeviceStatus(
    request: ChangeTerminalDeviceStatusRequest
  ): Promise<ChangeTerminalDeviceStatusResponse> {
    const result = await this.changeTerminalDeviceStatusHandler.execute(
      new ChangeTerminalDeviceStatusCommand({
        tenantId: request.tenantId ?? '',
        terminalDeviceId: request.terminalDeviceId ?? '',
        targetStatus: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceStatus(request.targetStatus),
        reason: emptyToNull(request.reason),
        operatorContext: toOperatorContext(request.operatorContext)
      })
    )

    return TerminalDeviceGrpcPresenter.toChangeStatusResult(result)
  }

  // Rejects audit event list requests until a backed query contract is implemented.
  listTerminalDeviceAuditEvents(_request: ListTerminalDeviceAuditEventsRequest): ListTerminalDeviceAuditEventsResponse {
    throwUnimplemented('ListTerminalDeviceAuditEvents')
  }

  // Handles runtime heartbeat recording by mapping diagnostics into the application command.
  async recordHeartbeat(request: RecordHeartbeatRequest): Promise<RecordHeartbeatResponse> {
    const result = await this.recordHeartbeatHandler.execute(
      new RecordHeartbeatCommand({
        terminalDeviceId: request.terminalDeviceId ?? '',
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceType(request.terminalDeviceType),
        appVersion: emptyToNull(request.software?.appVersion),
        androidVersion: emptyToNull(request.software?.androidVersion),
        webViewVersion: emptyToNull(request.software?.webViewVersion),
        networkStatus: TerminalDeviceGrpcPresenter.fromProtoNetworkStatus(request.runtime?.networkStatus),
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
        traceId: emptyToNull(request.traceId),
        receivedAt: parseOptionalDate(request.receivedAt) ?? undefined
      })
    )

    return TerminalDeviceGrpcPresenter.toHeartbeatResult(result)
  }

  // Rejects runtime snapshot lookup until a backed query contract is implemented.
  getRuntimeSnapshot(_request: GetRuntimeSnapshotRequest): GetRuntimeSnapshotResponse {
    throwUnimplemented('GetRuntimeSnapshot')
  }

  // Handles version policy reads by mapping tenant and device type into the application query.
  async getVersionPolicy(request: GetVersionPolicyRequest): Promise<GetVersionPolicyResponse> {
    const policy = await this.getVersionPolicyHandler.execute(
      new GetVersionPolicyQuery({
        tenantId: request.tenantId ?? '',
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceType(request.terminalDeviceType)
      })
    )

    return {
      policy: policy ? TerminalDeviceGrpcPresenter.toVersionPolicy(policy) : undefined
    }
  }

  // Handles version policy upserts by mapping administrator input into the application command.
  async upsertVersionPolicy(request: UpsertVersionPolicyRequest): Promise<UpsertVersionPolicyResponse> {
    const policy = await this.upsertVersionPolicyHandler.execute(
      new UpsertVersionPolicyCommand({
        tenantId: request.tenantId ?? '',
        terminalDeviceType: TerminalDeviceGrpcPresenter.fromProtoTerminalDeviceType(request.terminalDeviceType),
        minSupportedAppVersion: request.minSupportedAppVersion ?? '',
        latestAppVersion: request.latestAppVersion ?? '',
        upgradeRequired: request.upgradeRequired ?? false,
        upgradeRecommended: request.upgradeRecommended ?? false,
        apkDownloadUrl: emptyToNull(request.apkDownloadUrl),
        releaseNotesUrl: emptyToNull(request.releaseNotesUrl),
        reason: emptyToNull(request.reason),
        operatorContext: toOperatorContext(request.operatorContext)
      })
    )

    return {
      policy: TerminalDeviceGrpcPresenter.toVersionPolicy(policy)
    }
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

// toOperatorContext maps generated operator context into the application audit metadata shape.
function toOperatorContext(context?: {
  operatorAccountId?: string
  operatorOrgId?: string
  traceId?: string
}): { operatorAccountId: string; operatorOrgId: string | null; traceId: string | null } {
  return {
    operatorAccountId: context?.operatorAccountId ?? '',
    operatorOrgId: emptyToNull(context?.operatorOrgId),
    traceId: emptyToNull(context?.traceId)
  }
}

// throwUnimplemented rejects generated-but-not-yet-supported RPCs without returning fake success.
function throwUnimplemented(methodName: string): never {
  throw new RpcException({
    grpcStatus: GrpcStatus.UNIMPLEMENTED,
    code: 'TERMINAL_DEVICE_RPC_UNIMPLEMENTED',
    message: `${methodName} is not implemented in this phase`,
    messageKey: 'terminal_device.rpc.unimplemented',
    details: {
      methodName
    }
  })
}
