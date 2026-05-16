import { GetTerminalDeviceHandler } from './get-terminal-device.query'
import { ListTerminalDeviceAuditEventsHandler } from './list-terminal-device-audit-events.query'
import { ListTerminalDevicesHandler } from './list-terminal-devices.query'

export * from './get-terminal-device.query'
export * from './list-terminal-device-audit-events.query'
export * from './list-terminal-devices.query'

export const DeviceQueryHandlers = [
  ListTerminalDevicesHandler,
  GetTerminalDeviceHandler,
  ListTerminalDeviceAuditEventsHandler
]
