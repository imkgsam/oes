import { Module } from '@nestjs/common'
import { PermissionModule } from './modules/permission/permission.module'
import { RoleModule } from './modules/role/role.module'
import { APP_FILTER } from '@nestjs/core'

@Module({
  imports: [PermissionModule, RoleModule],
  providers: [],
  controllers: [],
})
export class AppModule {}
