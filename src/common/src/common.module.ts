import { Module, Global } from '@nestjs/common'
import { GatewayPermissionControllGuard } from './permission/guards/gateway-permission-controll.guard'
import { RegistryModule } from './registry/registry.module'
import { SecurityModule } from './security/security.module'

@Global()
@Module({
  imports: [RegistryModule, SecurityModule],
  providers: [GatewayPermissionControllGuard],
  exports: [GatewayPermissionControllGuard, RegistryModule, SecurityModule]
})
export class CommonModule {}
