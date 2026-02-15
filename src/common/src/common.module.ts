import { Module, Global } from '@nestjs/common'
import { GatewayPermissionControllGuard } from './permission/guards/gateway-permission-controll.guard'
import { ClientModule } from './rpc/clients/client.module'
import { RpcResponseInterceptor } from './rpc/interceptors/-rpc-response.interceptor'

@Global()
@Module({
  imports: [ClientModule],
  providers: [GatewayPermissionControllGuard, RpcResponseInterceptor],
  exports: [GatewayPermissionControllGuard, ClientModule, RpcResponseInterceptor]
})
export class CommonModule {}
