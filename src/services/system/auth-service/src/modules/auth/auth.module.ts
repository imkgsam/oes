import { Module } from '@nestjs/common'
import {
  EmailOtpProvider,
  PhoneOtpProvider,
} from '../../application/providers/otp.provider'
import { EmailPasswordAuthProvider } from '../../application/providers/email-password.provider'
import { GoogleAuthProvider } from '../../application/providers/google.provider'
import { WechatAuthProvider } from '../../application/providers/wechat.provider'
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma/prisma.user.repository'
import { AuthDomainService } from '../../domain/services/auth.domain-service'
import { JwtModule } from '../../infrastructure/jwt/jwt.module'
import { HttpAuthController } from '../../interfaces/http/controllers/auth/auth-local.controller'
import { TcpAuthController } from '../../interfaces/tcp/controllers/auth/auth-local.controller'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { TcpTestController } from 'src/interfaces/tcp/controllers/test/test.controller'

@Module({
  imports: [
    JwtModule, PrismaModule,
    ClientModule.register([ServiceKeys.PERMI_TCP])
  ],
  providers: [
    EmailOtpProvider,
    PhoneOtpProvider,
    EmailPasswordAuthProvider,
    GoogleAuthProvider,
    WechatAuthProvider,
    { provide: 'UserRepository', useClass: PrismaUserRepository },
    AuthDomainService,
  ],
  controllers: [TcpAuthController, TcpTestController],
})
export class AuthModule { }
