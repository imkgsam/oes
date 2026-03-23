import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { OrgCommandHandlers } from '../../application/commands'
import { SYMBOLS } from '../../common/constants'
import { PrismaAccountOrgMembershipRepository } from '../../infrastructure/repositories/prisma/prisma.account-org-membership.repository'
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma/prisma.account.repository'
import { PrismaOrgRepository } from '../../infrastructure/repositories/prisma/prisma.org.repository'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { IdentityManagementGrpcController } from '../../interfaces/grpc/identity-management.grpc.controller'

@Module({
  imports: [CqrsModule, PrismaModule],
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
    ValidatingCommandBus,
    ValidatingQueryBus,
    ...OrgCommandHandlers
  ],
  controllers: [IdentityManagementGrpcController]
})
export class IdentityManagementModule {}
