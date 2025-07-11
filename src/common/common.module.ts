import { Module, Global } from '@nestjs/common'
import { PermissionControllGuard } from './guards/permission-controll.guard'
import { ClientModule } from './modules/clients/client.module'
import { ScopeControllGuard } from './guards/scope-controll.guard'

@Global()
@Module({
  imports: [ClientModule],
  providers: [PermissionControllGuard, ScopeControllGuard],
  exports: [PermissionControllGuard, ScopeControllGuard, ClientModule],
})
export class CommonModule {}
