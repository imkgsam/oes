import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { SYMBOLS } from '../../common/constants'
import {
  AccountQueryHandlers,
  OrgQueryHandlers,
  TenantQueryHandlers,
  UserQueryHandlers
} from '../../application/queries'
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma/prisma.account.repository'
import { PrismaOrgRepository } from '../../infrastructure/repositories/prisma/prisma.org.repository'
import { PrismaTenantRepository } from '../../infrastructure/repositories/prisma/prisma.tenant.repository'
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma/prisma.user.repository'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { IdentityQueryGrpcController } from '../../interfaces/grpc/identity-query.grpc.controller'

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    {
      provide: SYMBOLS.REPO.USER,
      useClass: PrismaUserRepository
    },
    {
      provide: SYMBOLS.REPO.ACCOUNT,
      useClass: PrismaAccountRepository
    },
    {
      provide: SYMBOLS.REPO.TENANT,
      useClass: PrismaTenantRepository
    },
    {
      provide: SYMBOLS.REPO.ORG,
      useClass: PrismaOrgRepository
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    ...UserQueryHandlers,
    ...AccountQueryHandlers,
    ...TenantQueryHandlers,
    ...OrgQueryHandlers
  ],
  controllers: [IdentityQueryGrpcController]
})
export class IdentityQueryModule {}
