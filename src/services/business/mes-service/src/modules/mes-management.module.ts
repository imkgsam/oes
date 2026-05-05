import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ManufacturingSpecManagementService } from '../application/services/manufacturing-spec-management.service'
import { MesMoldManagementService } from '../application/services/mes-mold-management.service'
import { ManufacturingSpecManagementGrpcController } from '../interfaces/grpc/manufacturing-spec-management.grpc.controller'
import { MesManagementGrpcController } from '../interfaces/grpc/mes-management.grpc.controller'

/** MesManagementModule wires the phase 1 mold and ManufacturingSpec command services and gRPC controllers. */
@Module({
  imports: [CqrsModule],
  providers: [MesMoldManagementService, ManufacturingSpecManagementService],
  controllers: [MesManagementGrpcController, ManufacturingSpecManagementGrpcController]
})
export class MesManagementModule {}
