import { Module } from '@nestjs/common'
import { PermissionModule } from './modules/permission/permission.module'
import { RoleModule } from './modules/role/role.module'
import { LoggingModule } from '@oes/common/logging/logging.module'

@Module({
  imports: [PermissionModule, RoleModule, LoggingModule],
  providers: [],
  controllers: []
})
export class AppModule {}
