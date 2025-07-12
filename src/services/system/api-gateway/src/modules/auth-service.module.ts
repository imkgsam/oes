import { Module } from '@nestjs/common'
import { AuthController } from '../controllers/auth-service/auth-local.controller'
import { ClientModule } from '@oes/common/modules/clients/client.module'

@Module({
  imports: [ClientModule.register(['AUTH_TCP'])],
  controllers: [AuthController],
})
export class AuthServiceModule {}
