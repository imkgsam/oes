import { Module, Global } from '@nestjs/common'
import { GatewayPermissionControllGuard } from './permission/guards/gateway-permission-controll.guard'
import { RegistryModule } from './registry/registry.module'

@Global()
@Module({
  imports: [RegistryModule],
  providers: [GatewayPermissionControllGuard],
  exports: [GatewayPermissionControllGuard, RegistryModule]
})
export class CommonModule {}
