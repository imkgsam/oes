import { GetTerminalDeviceHandler } from './get-terminal-device.query'
import { ListTerminalDevicesHandler } from './list-terminal-devices.query'

export * from './get-terminal-device.query'
export * from './list-terminal-devices.query'

export const DeviceQueryHandlers = [ListTerminalDevicesHandler, GetTerminalDeviceHandler]
