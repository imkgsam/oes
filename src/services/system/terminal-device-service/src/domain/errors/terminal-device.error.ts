export type TerminalDeviceErrorCode =
  | 'UNSUPPORTED_TERMINAL_DEVICE_TYPE'
  | 'ENROLLMENT_EXPIRATION_NOT_FUTURE'
  | 'ENROLLMENT_NOT_FOUND'
  | 'ENROLLMENT_EXPIRED'
  | 'ENROLLMENT_USED'
  | 'ENROLLMENT_REVOKED'
  | 'ENROLLMENT_NOT_ISSUED'
  | 'ENROLLMENT_REVOCATION_REASON_REQUIRED'
  | 'ENROLLMENT_ACTIVATION_CONFLICT'
  | 'TERMINAL_DEVICE_ALREADY_EXISTS'
  | 'TERMINAL_DEVICE_ENROLLMENT_ALREADY_LINKED'
  | 'TERMINAL_DEVICE_NOT_FOUND'
  | 'TERMINAL_DEVICE_STATUS_REASON_REQUIRED'
  | 'TERMINAL_DEVICE_DECOMMISSIONED_CANNOT_RESTORE'
  | 'TERMINAL_DEVICE_VERSION_POLICY_REASON_REQUIRED'
  | 'TERMINAL_DEVICE_PERSISTENCE_ERROR'
  | 'TERMINAL_DEVICE_CREDENTIAL_INVALID'
  | 'AUDIT_EVENT_ALREADY_EXISTS'

// TerminalDeviceError carries stable service error codes for application and gRPC mapping.
export class TerminalDeviceError extends Error {
  readonly code: TerminalDeviceErrorCode

  // Constructs a coded terminal-device-service error without requiring callers to parse messages.
  constructor(code: TerminalDeviceErrorCode, message: string) {
    super(message)
    this.name = 'TerminalDeviceError'
    this.code = code
  }
}
