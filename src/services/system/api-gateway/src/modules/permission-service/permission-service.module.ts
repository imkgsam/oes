import { Module } from '@nestjs/common'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { PermissionServiceService } from './permission-service.service'
import { httpControllers } from './interface/http/controllers'

@Module({
  imports: [ClientModule.register([ServiceKeys.PERMISSION_TCP])],
  controllers: [...httpControllers],
  providers: [PermissionServiceService]
})
export class PermissionServiceModule {}
