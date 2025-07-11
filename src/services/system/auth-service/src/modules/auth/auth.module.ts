import { Module } from '@nestjs/common'
import { AuthService } from '../../application/services/auth-service'
import {
  EmailOtpProvider,
  PhoneOtpProvider,
} from '../../application/providers/otp.provider'
import { EmailPasswordAuthProvider } from '../../application/providers/email-password.provider'
import { GoogleAuthProvider } from '../../application/providers/google.provider'
import { WechatAuthProvider } from '../../application/providers/wechat.provider'
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma/prisma.user.repository'
// Update the import path below to the correct relative path if needed
import { AuthDomainService } from '../../domain/services/auth.domain-service'
import { JwtModule } from '../../infrastructure/jwt/jwt.module'
import { HttpAuthController } from '../../interfaces/http/controllers/auth/auth-local.controller'
import { TcpAuthController } from '../../interfaces/tcp/controllers/auth/auth-local.controller'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
  imports: [JwtModule, PrismaModule],
  providers: [
    AuthService,
    EmailOtpProvider,
    PhoneOtpProvider,
    EmailPasswordAuthProvider,
    GoogleAuthProvider,
    WechatAuthProvider,
    { provide: 'UserRepository', useClass: PrismaUserRepository },
    AuthDomainService,
  ],
  controllers: [HttpAuthController, TcpAuthController],
})
export class AuthModule {}
