import type { Provider } from '@nestjs/common'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { APP_GUARD } from '@nestjs/core'
import { GatewayPermissionGuard } from '@oes/common/authorization'
import { GatewaySessionAuthGuard } from '../../common/guards/gateway-session-auth.guard'
import { TenantTargetBindingGuard } from '../../common/tenant-target'

type GatewaySecurityExports = {
  createGatewayGuardProviders: () => Provider[]
}

const expectedGuardProviders = [
  { provide: APP_GUARD, useClass: GatewaySessionAuthGuard },
  { provide: APP_GUARD, useClass: TenantTargetBindingGuard },
  { provide: APP_GUARD, useExisting: GatewayPermissionGuard }
]

/** loadGatewaySecurityExport resolves the production-owned dist-facing security seam at runtime. */
function loadGatewaySecurityExport(): GatewaySecurityExports {
  return require('../index') as GatewaySecurityExports
}

/** Gateway guard composition tests keep production and acceptance provider order on one seam. */
describe('createGatewayGuardProviders', () => {
  it('exports the three production APP_GUARD providers in security-boundary order', () => {
    expect(loadGatewaySecurityExport().createGatewayGuardProviders()).toEqual(
      expectedGuardProviders
    )
  })

  it('returns independent arrays and provider objects on every call', () => {
    const factory = loadGatewaySecurityExport().createGatewayGuardProviders
    const first = factory()
    const second = factory()
    const firstProvider = first[0] as { useClass?: unknown }

    expect(first).not.toBe(second)
    firstProvider.useClass = GatewayPermissionGuard
    first.pop()

    expect(second).toEqual(expectedGuardProviders)
    expect(factory()).toEqual(expectedGuardProviders)
  })

  it('injects the factory result into AppModule provider metadata exactly once', () => {
    const sentinelProvider = { provide: APP_GUARD, useValue: Symbol('sentinel-guard') }
    const factory = jest.fn<Provider[], []>(() => [sentinelProvider])

    jest.resetModules()
    jest.doMock('../index', () => ({ createGatewayGuardProviders: factory }))

    try {
      jest.isolateModules(() => {
        const { AppModule } = require('../../app.module') as { AppModule: Function }
        const { ThrottlerGuard: IsolatedThrottlerGuard } = require('@nestjs/throttler') as {
          ThrottlerGuard: Function
        }
        const { GatewayPermissionGuard: IsolatedGatewayPermissionGuard } =
          require('@oes/common/authorization') as { GatewayPermissionGuard: Function }
        const appProviders = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule) as Provider[]
        const appGuardProviders = appProviders.filter((provider) => {
          if (typeof provider !== 'object' || provider === null) {
            return false
          }
          return (provider as { provide?: unknown }).provide === APP_GUARD
        })

        expect(factory).toHaveBeenCalledTimes(1)
        expect(appProviders).toContain(sentinelProvider)
        expect(appProviders).toContain(IsolatedGatewayPermissionGuard)
        expect(appGuardProviders).toEqual([
          { provide: APP_GUARD, useClass: IsolatedThrottlerGuard },
          sentinelProvider
        ])
      })
    } finally {
      jest.dontMock('../index')
      jest.resetModules()
    }
  })
})
