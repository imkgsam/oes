import { ChangeTerminalDeviceStatusHandler } from './change-terminal-device-status.command'
import { UpdateTerminalDeviceHandler } from './update-terminal-device.command'

export * from './change-terminal-device-status.command'
export * from './update-terminal-device.command'

export const DeviceCommandHandlers = [ChangeTerminalDeviceStatusHandler, UpdateTerminalDeviceHandler]
