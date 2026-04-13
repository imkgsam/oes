import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { AuthenticateApiKeyHandler } from '../../application/commands'
import { SYMBOLS } from '../../common/constants'
import { PrismaApiKeyRepository } from '../../infrastructure/repositories/prisma/prisma.api-key.repository'
import { PrismaServiceAccountRepository } from '../../infrastructure/repositories/prisma/prisma.service-account.repository'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { IdentityMachineAuthGrpcController } from '../../interfaces/grpc/identity-machine-auth.grpc.controller'
import { IdentityAuditModule } from '../identity-audit/identity-audit.module'

@Module({
  imports: [CqrsModule, PrismaModule, IdentityAuditModule],
  providers: [
    {
      provide: SYMBOLS.REPO.API_KEY,
      useClass: PrismaApiKeyRepository
    },
    {
      provide: SYMBOLS.REPO.SERVICE_ACCOUNT,
      useClass: PrismaServiceAccountRepository
    },
    ValidatingCommandBus,
    AuthenticateApiKeyHandler
  ],
  controllers: [IdentityMachineAuthGrpcController]
})
export class IdentityMachineAuthModule {}
