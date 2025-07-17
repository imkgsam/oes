import { Module } from '@nestjs/common'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { PermissionController } from 'src/controllers/permission-service/permission.controller'
import { RoleController } from 'src/controllers/permission-service/role.controller'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'

@Module({
  imports: [ClientModule.register([ServiceKeys.PERMI_TCP])],
  controllers: [PermissionController, RoleController],
})
export class PermissionServiceModule { }
