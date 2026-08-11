import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import {
  PdaActivateEnrollmentResult,
  PdaTerminalDeviceAdapter
} from '../../infrastructure/downstream/terminal-device-service/pda-terminal-device.adapter'
import { PdaEnrollmentDto } from '../../interfaces/http/dtos/pda-device.dto'
import {
  PdaDeviceAccessDecision,
  PdaEnrollmentViewModel
} from '../../interfaces/http/view-models/pda-device.view-model'

@Injectable()
// Activates PDA enrollment while keeping tenant binding and lifecycle rules in terminal-device-service.
export class PdaDeviceEnrollmentUseCase {
  constructor(private readonly terminalDeviceAdapter: PdaTerminalDeviceAdapter) {}

  async execute(
    dto: PdaEnrollmentDto,
    source: Pick<DownstreamRequestSource, 'traceId' | 'requestId' | 'traceparent' | 'tracestate'>
  ): Promise<PdaEnrollmentViewModel & { deviceCredential?: string; deviceCredentialExpiresAt?: string; deviceCredentialVersion?: number }> {
    const activation = await this.terminalDeviceAdapter.activateEnrollment({
      enrollmentCode: dto.enrollmentCode,
      device: dto.device,
      traceId: source.traceId,
      source
    })

    if (!activation.activated || !activation.terminalDeviceId) {
      return {
        enrolled: false,
        terminalDeviceId: null,
        tenantId: null,
        terminalDeviceType: 'PDA',
        displayName: null,
        deviceStatus: activation.deviceStatus,
        decision: toEnrollmentFailureDecision(activation),
        serverTime: new Date().toISOString()
      }
    }

    const decision = await this.terminalDeviceAdapter.resolveDeviceAccessDecision({
      tenantId: activation.tenantId,
      terminalDeviceId: activation.terminalDeviceId,
      requestPurpose: 'ENROLLMENT',
      device: {
        ...dto.device,
        terminalDeviceId: activation.terminalDeviceId
      },
      traceId: source.traceId,
      source,
      deviceCredential: activation.deviceCredential ?? ''
    })

    const result = {
      enrolled: true,
      terminalDeviceId: activation.terminalDeviceId,
      tenantId: activation.tenantId,
      terminalDeviceType: 'PDA' as const,
      displayName: null,
      deviceStatus: activation.deviceStatus,
      decision,
      serverTime: new Date().toISOString()
    }
    if (activation.deviceCredential) Object.defineProperties(result, { deviceCredential: { value: activation.deviceCredential, enumerable: false }, deviceCredentialExpiresAt: { value: activation.deviceCredentialExpiresAt, enumerable: false }, deviceCredentialVersion: { value: activation.deviceCredentialVersion, enumerable: false } })
    return result
  }
}

// Converts activation failure codes into the PDA-facing decision summary.
function toEnrollmentFailureDecision(activation: PdaActivateEnrollmentResult): PdaDeviceAccessDecision {
  const decisionCode = activation.decisionCode || 'ENROLLMENT_INVALID'
  return {
    allowed: false,
    decisionCode,
    resolvedTenantId: null,
    terminalDeviceId: null,
    terminalDeviceType: 'PDA',
    deviceStatus: activation.deviceStatus,
    presenceStatus: 'UNKNOWN',
    versionPolicy: null,
    requiredAction: decisionCode === 'ENROLLMENT_NOT_FOUND' ? 'ENROLL_DEVICE' : 'CONTACT_ADMIN',
    messageKey: `pda.enrollment.${decisionCode.toLowerCase()}`,
    shouldClearLocalSession: true,
    shouldClearLocalTerminalDeviceId: false
  }
}
