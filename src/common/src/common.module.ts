import { Module, Global } from '@nestjs/common'
import { PermissionControllGuard } from './permission/guards/permission-controll.guard'
import { ClientModule } from './rpc/clients/client.module'
import { ScopeControllGuard } from './permission/guards/scope-controll.guard'
import { MicroserviceExceptionsFilter } from './rpc/filters/microservice-exception.filter'
import { RpcResponseInterceptor } from './rpc/interceptors/rpc-response.interceptor'

@Global()
@Module({
  imports: [ClientModule],
  providers: [
    PermissionControllGuard,
    ScopeControllGuard,
    MicroserviceExceptionsFilter,
    RpcResponseInterceptor
  ],
  exports: [
    PermissionControllGuard,
    ScopeControllGuard,
    ClientModule,
    MicroserviceExceptionsFilter,
    RpcResponseInterceptor
  ]
})
export class CommonModule {}
