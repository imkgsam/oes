import { Module } from '@nestjs/common'
import { AuthController } from '../controllers/auth-service/auth-local.controller'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { TestController } from 'src/controllers/test/auth-local.controller'

@Module({
  imports: [ClientModule.register([ServiceKeys.AUTH_TCP])],
  controllers: [AuthController, TestController],
})
export class AuthServiceModule { }
