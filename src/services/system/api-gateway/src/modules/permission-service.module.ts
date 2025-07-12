import { Module } from '@nestjs/common'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { PermissionController } from 'src/controllers/permission-service/permission.controller'

@Module({
  imports: [ClientModule.register(['PERMI_TCP'])],
  controllers: [PermissionController],
})
export class PermissionServiceModule {}
