import { TerminalDeviceStatus } from '../../domain/enums/terminal-device.enums'

export const TERMINAL_DEVICE_UNAVAILABLE_EVENT_NAME = 'terminal-device.unavailable'

export interface TerminalDeviceUnavailableEvent {
  tenantId: string
  terminalDeviceId: string
  previousStatus: TerminalDeviceStatus
  newStatus: TerminalDeviceStatus
  operatorAccountId: string
  operatorOrgId?: string | null
  traceId?: string | null
  reason?: string | null
  occurredAt: Date
}

export interface TerminalDeviceUnavailableEventPublisher {
  publish(event: TerminalDeviceUnavailableEvent): Promise<void>
}
