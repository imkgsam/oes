import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaPolicyRepository } from '../../infrastructure/repositories/prisma/prisma.policy.repository'
import { SYMBOLS } from '../../common/constants/symbols'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { PolicyCommandHandlers } from '../../application/commands/policy'
import { PolicyQueryHandlers } from '../../application/queries/policy'
import { PolicyManagementGrpcController } from '../../interfaces/grpc/policy-management.grpc.controller'
import { ManagementAuthorizationModule } from '../management-authorization/management-authorization.module'

@Module({
  imports: [CqrsModule, PrismaModule, ManagementAuthorizationModule],
  providers: [
    {
      provide: SYMBOLS.REPO.POLICY,
      useClass: PrismaPolicyRepository
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    ...PolicyCommandHandlers,
    ...PolicyQueryHandlers
  ],
  controllers: [PolicyManagementGrpcController],
  exports: [SYMBOLS.REPO.POLICY]
})
export class PolicyModule {}
