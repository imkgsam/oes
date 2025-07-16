import { Module, Global } from '@nestjs/common'
import { PermissionControllGuard } from './guards/permission-controll.guard'
import { ClientModule } from './modules/clients/client.module'
import { ScopeControllGuard } from './guards/scope-controll.guard'
import { ApiGatewayExceptionsFilter } from './filters/api-gateway-exception.filter'
import { MicroserviceExceptionsFilter } from './filters/microservice-exception.filter'

@Global()
@Module({
  imports: [ClientModule],
  providers: [
    PermissionControllGuard,
    ScopeControllGuard,
    ApiGatewayExceptionsFilter,
    MicroserviceExceptionsFilter,
  ],
  exports: [
    PermissionControllGuard,
    ScopeControllGuard,
    ClientModule,
    ApiGatewayExceptionsFilter,
    MicroserviceExceptionsFilter,
  ],
})
export class CommonModule { }
