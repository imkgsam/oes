import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ProductionSpecManagementService } from '../application/services/production-spec-management.service'
import { MesMoldManagementService } from '../application/services/mes-mold-management.service'
import { ProductionSpecManagementGrpcController } from '../interfaces/grpc/production-spec-management.grpc.controller'
import { MesManagementGrpcController } from '../interfaces/grpc/mes-management.grpc.controller'
import { MesTrustedExecutionModule } from './mes-trusted-execution.module'

/** MesManagementModule wires the current ProductionSpec and Mold / Tooling command services and gRPC controllers. */
@Module({
  imports: [CqrsModule, MesTrustedExecutionModule],
  providers: [MesMoldManagementService, ProductionSpecManagementService],
  controllers: [MesManagementGrpcController, ProductionSpecManagementGrpcController]
})
export class MesManagementModule {}
