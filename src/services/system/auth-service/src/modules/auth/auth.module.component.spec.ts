import { MODULE_METADATA } from '@nestjs/common/constants'
import { TERMINAL_DEVICE_UNAVAILABLE_REDIS_CLIENT } from '../../common/constants/injection-tokens'
import { AuthModule } from './auth.module'

describe('AuthModule provider registration', () => {
  it('provides the terminal-device unavailable Redis subscriber client explicitly', () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuthModule) ?? []

    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provide: TERMINAL_DEVICE_UNAVAILABLE_REDIS_CLIENT
        })
      ])
    )
  })
})
