import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { PrismaPolicyRepository } from 'src/infrastructure/repositories/prisma/prisma.policy.repository'
import { SYMBOLS } from 'src/common/constants/symbols'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs/index'
import { PolicyCommandHandlers } from 'src/application/commands/policy'
import { PolicyQueryHandlers } from 'src/application/queries/policy'
import { PolicyManagementGrpcController } from 'src/interfaces/grpc/policy-management.grpc.controller'

@Module({
  imports: [CqrsModule, PrismaModule],
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
