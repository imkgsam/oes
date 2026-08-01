import type { Provider } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { GatewayPermissionGuard } from '@oes/common/authorization'
import { GatewaySessionAuthGuard } from '../../common/guards/gateway-session-auth.guard'
import { TenantTargetBindingGuard } from '../../common/tenant-target'
import { ExternalApiAccessGuard } from '../../common/external-api/external-api-access.guard'

/** createGatewayGuardProviders returns a fresh production-owned authentication and authorization guard composition. */
export function createGatewayGuardProviders(): Provider[] {
  return [
    { provide: APP_GUARD, useClass: GatewaySessionAuthGuard },
    { provide: APP_GUARD, useClass: TenantTargetBindingGuard },
    { provide: APP_GUARD, useClass: ExternalApiAccessGuard },
    { provide: APP_GUARD, useExisting: GatewayPermissionGuard }
  ]
}
