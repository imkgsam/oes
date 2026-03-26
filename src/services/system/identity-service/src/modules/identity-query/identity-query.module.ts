import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { SYMBOLS } from '../../common/constants'
import {
  AccountQueryHandlers,
  ContactQueryHandlers,
  OrgQueryHandlers,
  ServiceAccountQueryHandlers,
  TenantQueryHandlers,
  UserQueryHandlers
} from '../../application/queries'
import { PrismaAccountContactAssetRepository } from '../../infrastructure/repositories/prisma/prisma.account-contact-asset.repository'
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma/prisma.account.repository'
import { PrismaOrgRepository } from '../../infrastructure/repositories/prisma/prisma.org.repository'
import { PrismaServiceAccountRepository } from '../../infrastructure/repositories/prisma/prisma.service-account.repository'
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
    {
      provide: SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET,
      useClass: PrismaAccountContactAssetRepository
    },
    {
      provide: SYMBOLS.REPO.SERVICE_ACCOUNT,
      useClass: PrismaServiceAccountRepository
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    ...UserQueryHandlers,
    ...AccountQueryHandlers,
    ...TenantQueryHandlers,
    ...OrgQueryHandlers,
    ...ContactQueryHandlers,
    ...ServiceAccountQueryHandlers
  ],
  controllers: [IdentityQueryGrpcController]
})
export class IdentityQueryModule {}
