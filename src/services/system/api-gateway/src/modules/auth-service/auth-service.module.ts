import { Module } from '@nestjs/common'
import { AuthController } from './controllers/auth-local.controller'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { AuthServiceService } from './auth-service.service';
import { AdminController } from './controllers/admin.controller';

@Module({
  imports: [ClientModule.register([ServiceKeys.AUTH_TCP])],
  controllers: [AuthController, AdminController],
  providers: [AuthServiceService],
})
export class AuthServiceModule { }
