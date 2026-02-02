import { Module } from '@nestjs/common'
import { AuthController } from './controllers/auth.controller'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { AuthServiceService } from './auth-service.service'

@Module({
  imports: [ClientModule.register([ServiceKeys.AUTH_TCP])],
  controllers: [AuthController],
  providers: [AuthServiceService]
})
export class AuthServiceModule {}
