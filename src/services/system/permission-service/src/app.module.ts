import { Module } from '@nestjs/common'
import { PermissionModule } from './modules/permission/permission.module'


@Module({
  imports: [PermissionModule],
  providers: [],
  controllers: [],
})
export class AppModule {}
