import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaPolicyRepository } from '../../infrastructure/repositories/prisma/prisma.policy.repository'
import { PrismaPolicyTemplateInstanceRepository } from '../../infrastructure/repositories/prisma/prisma.policy-template-instance.repository'
import { SYMBOLS } from '../../common/constants/symbols'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { PolicyCommandHandlers } from '../../application/commands/policy'
import { PolicyQueryHandlers } from '../../application/queries/policy'
import { PolicyInstanceManagementService } from '../../application/authorization/policy-instance-management.service'
import { PolicyInstanceManagementGrpcController } from '../../interfaces/grpc/policy-instance-management.grpc.controller'
import { PolicyManagementGrpcController } from '../../interfaces/grpc/policy-management.grpc.controller'
import { ManagementAuthorizationModule } from '../management-authorization/management-authorization.module'
import { PermissionModule } from '../permission/permission.module'
import { PermissionTrustedExecutionModule } from '../authorization/permission-trusted-execution.module'

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    ManagementAuthorizationModule,
    PermissionModule,
    PermissionTrustedExecutionModule
  ],
  providers: [
    {
      provide: SYMBOLS.REPO.POLICY,
      useClass: PrismaPolicyRepository
    },
    {
      provide: SYMBOLS.REPO.POLICY_TEMPLATE_INSTANCE,
      useClass: PrismaPolicyTemplateInstanceRepository
    },
    ValidatingQueryBus,
    PolicyInstanceManagementService,
    ...PolicyCommandHandlers,
    ...PolicyQueryHandlers
  ],
  controllers: [PolicyManagementGrpcController, PolicyInstanceManagementGrpcController],
  exports: [SYMBOLS.REPO.POLICY, SYMBOLS.REPO.POLICY_TEMPLATE_INSTANCE]
})
export class PolicyModule {}
