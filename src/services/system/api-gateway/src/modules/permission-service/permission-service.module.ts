import { Module } from '@nestjs/common'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { PermissionController } from 'src/modules/permission-service/controllers/permission.controller'
import { RoleController } from 'src/modules/permission-service/controllers/role.controller'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { PermissionServiceService } from './permission-service.service';

@Module({
  imports: [ClientModule.register([ServiceKeys.PERMI_TCP])],
  controllers: [PermissionController, RoleController],
  providers: [PermissionServiceService],
})
export class PermissionServiceModule { }
