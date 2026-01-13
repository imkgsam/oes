import { Module } from '@nestjs/common'
import { AuthController } from './controllers/auth.controller'
import { AdminController } from './controllers/admin.controller'
import { TestController } from './controllers/test.controller'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { AuthServiceService } from './auth-service.service'

@Module({
  imports: [ClientModule.register([ServiceKeys.AUTH_TCP])],
  controllers: [AuthController, AdminController, TestController],
  providers: [AuthServiceService]
})
export class AuthServiceModule {}
