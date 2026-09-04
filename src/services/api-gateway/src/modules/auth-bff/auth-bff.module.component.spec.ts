import { MODULE_METADATA } from '@nestjs/common/constants'
import { AuthBffModule } from './auth-bff.module'
import { TerminalDeviceAccessAdapter } from './infrastructure/downstream/terminal-device-service/terminal-device-access.adapter'

describe('AuthBffModule', () => {
  it('registers the terminal-device access adapter for PDA login runtime DI', () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuthBffModule) ?? []

    expect(providers).toContain(TerminalDeviceAccessAdapter)
  })
})
