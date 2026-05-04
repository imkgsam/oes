import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { MesMoldManagementService } from '../application/services/mes-mold-management.service'
import { MesManagementGrpcController } from '../interfaces/grpc/mes-management.grpc.controller'

/** MesManagementModule wires the phase 1 mold command application service and gRPC controller. */
@Module({
  imports: [CqrsModule],
  providers: [MesMoldManagementService],
  controllers: [MesManagementGrpcController]
})
export class MesManagementModule {}
