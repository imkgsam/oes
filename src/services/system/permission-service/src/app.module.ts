import { Module } from '@nestjs/common'
import { PermissionModule } from './modules/permission/permission.module'
import { RoleModule } from './modules/role/role.module';

@Module({
  imports: [PermissionModule, RoleModule],
  providers: [],
  controllers: [],
})
export class AppModule { }
