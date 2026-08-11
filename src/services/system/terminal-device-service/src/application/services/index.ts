import { DeviceAccessDecisionService } from './device-access-decision.service'
import { TerminalDeviceCredentialVerifierService } from './terminal-device-credential-verifier.service'

export * from './device-access-decision.service'
export * from './terminal-device-credential-verifier.service'

export const ApplicationServices = [DeviceAccessDecisionService, TerminalDeviceCredentialVerifierService]
