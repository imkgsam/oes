import { Module, Global } from '@nestjs/common'
import { GatewayPermissionControllGuard } from './permission/guards/gateway-permission-controll.guard'
import { ClientModule } from './rpc/clients/client.module'
import { ScopeControllGuard } from './permission/guards/scope-controll.guard'
import { MicroserviceExceptionsFilter } from './rpc/filters/microservice-exception.filter'
import { RpcResponseInterceptor } from './rpc/interceptors/rpc-response.interceptor'

@Global()
@Module({
  imports: [ClientModule],
  providers: [
    GatewayPermissionControllGuard,
    ScopeControllGuard,
    MicroserviceExceptionsFilter,
    RpcResponseInterceptor
  ],
  exports: [
    GatewayPermissionControllGuard,
    ScopeControllGuard,
    ClientModule,
    MicroserviceExceptionsFilter,
    RpcResponseInterceptor
  ]
})
export class CommonModule {}
