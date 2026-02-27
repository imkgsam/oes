import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { PrismaPermissionRepository } from 'src/infrastructure/repositories/prisma/prisma.permission.repository'
import { PrismaRoleRepository } from 'src/infrastructure/repositories/prisma/prisma.role.repository'
import { PrismaPolicyRepository } from 'src/infrastructure/repositories/prisma/prisma.policy.repository'
import { SYMBOLS } from 'src/common/constants/symbols'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs/index'
import { PermissionCommandHandlers } from 'src/application/commands/permission'
import { PermissionQueryHandlers } from 'src/application/queries/permission'
import { AuthorizationQueryHandlers } from 'src/application/queries/authorization'
import { ACCOUNT_AUTHORIZATION_SERVICE } from 'src/application/queries/authorization/check-permission-with-context.handler'
import { AccountAuthorizationService } from 'src/domain/services/account-authorization.service'
import { PolicyEngine } from 'src/domain/services/policy-engine'
import { PermissionCheckGrpcController } from 'src/interfaces/grpc/permission-check.grpc.controller'
import { PermissionManagementGrpcController } from 'src/interfaces/grpc/permission-management.grpc.controller'

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    {
      provide: SYMBOLS.REPO.PERMISSION,
      useClass: PrismaPermissionRepository
    },
    {
      provide: SYMBOLS.REPO.ROLE,
      useClass: PrismaRoleRepository
    },
    {
      provide: SYMBOLS.REPO.POLICY,
      useClass: PrismaPolicyRepository
    },
    // Domain services
    PolicyEngine,
    {
      provide: ACCOUNT_AUTHORIZATION_SERVICE,
      useFactory: (roleRepo: any, permRepo: any, policyRepo: any, engine: PolicyEngine) =>
        new AccountAuthorizationService(roleRepo, permRepo, policyRepo, engine),
      inject: [SYMBOLS.REPO.ROLE, SYMBOLS.REPO.PERMISSION, SYMBOLS.REPO.POLICY, PolicyEngine]
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    ...PermissionCommandHandlers,
    ...PermissionQueryHandlers,
    ...AuthorizationQueryHandlers
  ],
  controllers: [PermissionCheckGrpcController, PermissionManagementGrpcController],
  exports: [SYMBOLS.REPO.PERMISSION, SYMBOLS.REPO.ROLE, SYMBOLS.REPO.POLICY]
})
export class PermissionModule {}
