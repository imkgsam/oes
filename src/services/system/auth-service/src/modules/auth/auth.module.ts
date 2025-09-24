import { Module } from '@nestjs/common'
import { EmailOtpProvider, PhoneOtpProvider } from 'src/application/providers/otp.provider'
import { EmailPasswordAuthProvider } from 'src/application/providers/email-password.provider'
import { GoogleAuthProvider } from 'src/application/providers/google.provider'
import { WechatAuthProvider } from 'src/application/providers/wechat.provider'
import { PrismaUserRepository } from 'src/infrastructure/repositories/prisma/prisma.loginmethod.repository'
import { AuthDomainService } from 'src/domain/services/auth.domain-service'
import { TcpAuthController } from 'src/interfaces/tcp/controllers/auth/auth-local.controller'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { TcpTestController } from 'src/interfaces/tcp/controllers/test/test.controller'
import { USER_REPOSITORY } from 'src/common/const/injection-tokens'

@Module({
  imports: [PrismaModule, ClientModule.register([ServiceKeys.PERMI_TCP])],
  providers: [
    EmailOtpProvider,
    PhoneOtpProvider,
    EmailPasswordAuthProvider,
    GoogleAuthProvider,
    WechatAuthProvider,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    AuthDomainService
  ],
  controllers: [TcpAuthController, TcpTestController]
})
export class AuthModule {}
