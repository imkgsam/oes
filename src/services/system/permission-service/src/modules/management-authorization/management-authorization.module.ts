import { Module } from '@nestjs/common'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaPermissionRepository } from '../../infrastructure/repositories/prisma/prisma.permission.repository'
import { PrismaPolicyRepository } from '../../infrastructure/repositories/prisma/prisma.policy.repository'
import { PrismaRoleRepository } from '../../infrastructure/repositories/prisma/prisma.role.repository'
import { PolicyEngine } from '../../domain/services/policy-engine'
import { AccountAuthorizationService } from '../../domain/services/account-authorization.service'
import { SYMBOLS } from '../../common/constants/symbols'
import { ManagementAuthorizationGuard } from '../../interfaces/guards'

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: SYMBOLS.REPO.ROLE,
      useClass: PrismaRoleRepository
    },
    {
      provide: SYMBOLS.REPO.PERMISSION,
      useClass: PrismaPermissionRepository
    },
    {
      provide: SYMBOLS.REPO.POLICY,
      useClass: PrismaPolicyRepository
    },
    PolicyEngine,
    {
      provide: AccountAuthorizationService,
      useFactory: (roleRepo: any, permRepo: any, policyRepo: any, engine: PolicyEngine) =>
        new AccountAuthorizationService(roleRepo, permRepo, policyRepo, engine),
      inject: [SYMBOLS.REPO.ROLE, SYMBOLS.REPO.PERMISSION, SYMBOLS.REPO.POLICY, PolicyEngine]
    },
    ManagementAuthorizationGuard
  ],
  exports: [AccountAuthorizationService, ManagementAuthorizationGuard]
})
export class ManagementAuthorizationModule {}
