import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ManufacturingSpecQueryService } from '../application/services/manufacturing-spec-query.service'
import { MesMoldQueryService } from '../application/services/mes-mold-query.service'
import { ManufacturingSpecQueryGrpcController } from '../interfaces/grpc/manufacturing-spec-query.grpc.controller'
import { MesQueryGrpcController } from '../interfaces/grpc/mes-query.grpc.controller'

/** MesQueryModule wires the phase 1 mold and ManufacturingSpec query services and gRPC controllers. */
@Module({
  imports: [CqrsModule],
  providers: [MesMoldQueryService, ManufacturingSpecQueryService],
  controllers: [MesQueryGrpcController, ManufacturingSpecQueryGrpcController]
})
export class MesQueryModule {}
