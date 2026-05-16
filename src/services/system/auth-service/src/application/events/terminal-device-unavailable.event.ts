export const TERMINAL_DEVICE_UNAVAILABLE_EVENT_NAME = 'terminal-device.unavailable'

export interface TerminalDeviceUnavailableEvent {
  tenantId?: string | null
  terminalDeviceId: string
  previousStatus?: string
  newStatus: string
  operatorAccountId?: string
  operatorOrgId?: string | null
  traceId?: string | null
  reason?: string | null
  occurredAt?: Date | string
}
