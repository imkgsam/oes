import { Injectable, OnModuleInit } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { GatewayMachineTrustedGrpcExecutionProducer } from '../../../../../common/grpc/gateway-machine-trusted-grpc-execution-producer'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import {
  DeviceAccessDecisionCode,
  DeviceAccessRequestPurpose,
  ResolveDeviceAccessDecisionResponse,
  TERMINAL_DEVICE_ACCESS_DECISION_SERVICE_NAME,
  TerminalDeviceAccessDecisionServiceClient,
  TerminalDeviceIdentity,
  TerminalDeviceType
} from '@oes/common/generated/terminal_device_service'

const CALLER = 'api-gateway'
const AUDIENCE = 'urn:oes:service:terminal-device-service'

export interface ResolveLoginDeviceContextInput {
  terminalDeviceId: string
  deviceMetadata: Record<string, unknown>
  deviceCredential: string
  source?: Pick<DownstreamRequestSource, 'requestId' | 'traceparent' | 'tracestate'>
}

export interface ResolvedLoginDeviceContext {
  terminalDeviceId: string
  deviceBoundTenantId: string
  allowed: boolean
  reasonCode?: string
}

@Injectable()
// Resolves PDA login device access through terminal-device-service without owning device truth in the BFF.
export class TerminalDeviceAccessAdapter implements OnModuleInit {
  private svc!: TerminalDeviceAccessDecisionServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.TERMINAL_DEVICE)
    private readonly client: ClientGrpc,
    private readonly machine: GatewayMachineTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<TerminalDeviceAccessDecisionServiceClient>(
      TERMINAL_DEVICE_ACCESS_DECISION_SERVICE_NAME
    )
  }

  // Requests the terminal-device LOGIN decision and returns the trusted device-bound tenant context.
  async resolveLoginDeviceContext(
    input: ResolveLoginDeviceContextInput
  ): Promise<ResolvedLoginDeviceContext> {
    const response = await this.machine.forInternalCall(AUDIENCE, 'terminal-device.internal.gateway.access.resolve', { requestId: input.source?.requestId ?? '', traceparent: input.source?.traceparent ?? '', tracestate: input.source?.tracestate }, async (metadata) => safeGrpcCall<ResolveDeviceAccessDecisionResponse>(
      this.svc.resolveDeviceAccessDecision({
        terminalDeviceId: input.terminalDeviceId,
        terminalDeviceType: TerminalDeviceType.TERMINAL_DEVICE_TYPE_PDA,
        requestPurpose: DeviceAccessRequestPurpose.DEVICE_ACCESS_REQUEST_PURPOSE_LOGIN,
        appVersion: this.normalize(input.deviceMetadata.appVersion),
        identity: this.toIdentity(input.deviceMetadata),
        deviceCredential: input.deviceCredential
      }, metadata),
      this.opts('resolveDeviceAccessDecision')
    ))
    const decision = response.decision

    return {
      terminalDeviceId: this.normalize(decision?.terminalDeviceId) ?? input.terminalDeviceId,
      deviceBoundTenantId: this.normalize(decision?.resolvedTenantId) ?? '',
      allowed: Boolean(decision?.allowed),
      reasonCode: this.toReasonCode(decision?.decisionCode)
    }
  }

  // Maps optional PDA device identity metadata into the generated terminal-device contract.
  private toIdentity(metadata: Record<string, unknown>): TerminalDeviceIdentity | undefined {
    const identity: TerminalDeviceIdentity = {
      manufacturerSerial: this.normalize(metadata.manufacturerSerial),
      androidId: this.normalize(metadata.androidId),
      appInstallationId: this.normalize(metadata.appInstallationId),
      manufacturer: this.normalize(metadata.manufacturer),
      model: this.normalize(metadata.model)
    }
    return Object.values(identity).some(Boolean) ? identity : undefined
  }

  // Converts generated decision enum values into stable reason code strings.
  private toReasonCode(code: DeviceAccessDecisionCode | undefined): string | undefined {
    if (code == null || code === DeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_UNSPECIFIED) {
      return undefined
    }
    return DeviceAccessDecisionCode[code]?.replace('DEVICE_ACCESS_DECISION_CODE_', '')
  }

  // Normalizes optional string metadata before crossing the terminal-device boundary.
  private normalize(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined
  }

  // Builds safe gRPC call metadata for terminal-device adapter diagnostics.
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
