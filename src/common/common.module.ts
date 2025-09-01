import { Module, Global } from '@nestjs/common'
import { PermissionControllGuard } from './guards/permission-controll.guard'
import { ClientModule } from './modules/clients/client.module'
import { ScopeControllGuard } from './guards/scope-controll.guard'
import { MicroserviceExceptionsFilter } from './filters/microservice-exception.filter'
import { RpcResponseInterceptor } from './interceptors/rpc-response.interceptor'

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
