import { Module, Global } from '@nestjs/common';
import { PermissionClientProvider } from './clients/permission-client-provider';
import { PermissionControllGuard } from './guards/permission-controll.guard';


@Global()
@Module({
  providers: [PermissionClientProvider, PermissionControllGuard],
  exports: [PermissionClientProvider, PermissionControllGuard]
})
export class CommonModule { }
