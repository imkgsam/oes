import type { Provider } from '@nestjs/common'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { APP_GUARD } from '@nestjs/core'
import { GatewayPermissionGuard } from '@oes/common/authorization'
import { readFileSync } from 'node:fs'
import { ExternalApiAccessGuard } from '../../common/external-api/external-api-access.guard'
import { GatewaySessionAuthGuard } from '../../common/guards/gateway-session-auth.guard'
import { TenantTargetBindingGuard } from '../../common/tenant-target'

type GatewaySecurityExports = {
  createGatewayGuardProviders: () => Provider[]
}

const expectedGuardProviders = [
  { provide: APP_GUARD, useClass: GatewaySessionAuthGuard },
  { provide: APP_GUARD, useClass: TenantTargetBindingGuard },
  { provide: APP_GUARD, useClass: ExternalApiAccessGuard },
  { provide: APP_GUARD, useExisting: GatewayPermissionGuard }
]

/** loadGatewaySecurityExport resolves the production-owned dist-facing security seam at runtime. */
function loadGatewaySecurityExport(): GatewaySecurityExports {
  return require('../index') as GatewaySecurityExports
}

/** Gateway guard composition tests keep production and acceptance provider order on one seam. */
describe('createGatewayGuardProviders', () => {
  it('exports the four production APP_GUARD providers in security-boundary order', () => {
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

  it('keeps AppModule wired through the shared guard factory seam exactly once', () => {
    const source = readFileSync(require.resolve('../../app.module'), 'utf8')
    expect(source.match(/\.\.\.createGatewayGuardProviders\(\),/g)).toHaveLength(1)
  })
})
