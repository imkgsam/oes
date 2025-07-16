import { Module } from '@nestjs/common'
import { PermissionModule } from './modules/permission/permission.module'
import { RoleModule } from './modules/role/role.module'
import { TraceModule } from '@oes/common/modules/trace/trace.module'

@Module({
  imports: [
    PermissionModule,
    RoleModule,
    TraceModule.forRpc()
  ],
  providers: [],
  controllers: [],
})
export class AppModule { }
