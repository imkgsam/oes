import { Module } from '@nestjs/common'
import { PrismaUserRepository } from 'src/infrastructure/repositories/prisma/prisma.loginmethod.repository'
import { TcpAuthController } from 'src/interfaces/tcp/controllers/auth.controller'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { TcpTestController } from 'src/interfaces/tcp/controllers/test.controller'
import { USER_REPOSITORY } from 'src/common/const/injection-tokens'
import { AuthService } from 'src/application/services/auth-service'

@Module({
  imports: [PrismaModule, ClientModule.register([ServiceKeys.PERMISSION_TCP])],
  providers: [{ provide: USER_REPOSITORY, useClass: PrismaUserRepository }, AuthService],
  controllers: [TcpAuthController, TcpTestController]
})
export class AuthModule {}
