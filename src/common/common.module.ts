import { Module, Global } from '@nestjs/common'
import { PermissionControllGuard } from './guards/permission-controll.guard'
import { ClientModule } from './modules/clients/client.module'
import { ScopeControllGuard } from './guards/scope-controll.guard'
import { AllHttpExceptionsFilter } from './filters/all-http-exception.filter'
import { AllRpcExceptionsFilter } from './filters/all-rpc-exception.filter'

@Global()
@Module({
  imports: [ClientModule],
  providers: [
    PermissionControllGuard,
    ScopeControllGuard,
    AllHttpExceptionsFilter,
    AllRpcExceptionsFilter,
  ],
  exports: [
    PermissionControllGuard,
    ScopeControllGuard,
    ClientModule,
    AllHttpExceptionsFilter,
    AllRpcExceptionsFilter,
  ],
})
export class CommonModule {}
