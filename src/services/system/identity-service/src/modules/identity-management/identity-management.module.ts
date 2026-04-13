import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { CheckResourceService } from '../../application/authorization'
import {
  ContactCommandHandlers,
  OrgCommandHandlers,
  ServiceAccountCommandHandlers
} from '../../application/commands'
import { SYMBOLS } from '../../common/constants'
import { PrismaAccountContactAssetRepository } from '../../infrastructure/repositories/prisma/prisma.account-contact-asset.repository'
import { PrismaAccountOrgMembershipRepository } from '../../infrastructure/repositories/prisma/prisma.account-org-membership.repository'
import { PrismaApiKeyRepository } from '../../infrastructure/repositories/prisma/prisma.api-key.repository'
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma/prisma.account.repository'
import { PrismaOrgRepository } from '../../infrastructure/repositories/prisma/prisma.org.repository'
import { PrismaServiceAccountRepository } from '../../infrastructure/repositories/prisma/prisma.service-account.repository'
import { PrismaTenantRepository } from '../../infrastructure/repositories/prisma/prisma.tenant.repository'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { IdentityManagementGrpcController } from '../../interfaces/grpc/identity-management.grpc.controller'
import { IdentityAuditModule } from '../identity-audit/identity-audit.module'

@Module({
  imports: [CqrsModule, PrismaModule, IdentityAuditModule],
  providers: [
    {
      provide: SYMBOLS.REPO.ACCOUNT,
      useClass: PrismaAccountRepository
    },
    {
      provide: SYMBOLS.REPO.ORG,
      useClass: PrismaOrgRepository
    },
    {
      provide: SYMBOLS.REPO.ACCOUNT_ORG_MEMBERSHIP,
      useClass: PrismaAccountOrgMembershipRepository
    },
    {
      provide: SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET,
      useClass: PrismaAccountContactAssetRepository
    },
    {
      provide: SYMBOLS.REPO.API_KEY,
      useClass: PrismaApiKeyRepository
    },
    {
      provide: SYMBOLS.REPO.TENANT,
      useClass: PrismaTenantRepository
    },
    {
      provide: SYMBOLS.REPO.SERVICE_ACCOUNT,
      useClass: PrismaServiceAccountRepository
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    CheckResourceService,
    ...OrgCommandHandlers,
    ...ContactCommandHandlers,
    ...ServiceAccountCommandHandlers
  ],
  controllers: [IdentityManagementGrpcController]
})
export class IdentityManagementModule {}
