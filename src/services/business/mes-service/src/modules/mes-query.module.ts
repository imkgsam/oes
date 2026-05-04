import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { MesMoldQueryService } from '../application/services/mes-mold-query.service'
import { MesQueryGrpcController } from '../interfaces/grpc/mes-query.grpc.controller'

/** MesQueryModule wires the phase 1 mold query application service and gRPC controller. */
@Module({
  imports: [CqrsModule],
  providers: [MesMoldQueryService],
  controllers: [MesQueryGrpcController]
})
export class MesQueryModule {}
