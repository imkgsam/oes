import { ListTrustedDevicesHandler } from './list-trusted-devices.handler'

export * from './list-trusted-devices.query'
export * from './list-trusted-devices.handler'

export const SelfSecurityQueryHandlers = [ListTrustedDevicesHandler]
