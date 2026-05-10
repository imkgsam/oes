import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ProductionSpecQueryService } from '../application/services/production-spec-query.service'
import { MesMoldQueryService } from '../application/services/mes-mold-query.service'
import { ProductionSpecQueryGrpcController } from '../interfaces/grpc/production-spec-query.grpc.controller'
import { MesQueryGrpcController } from '../interfaces/grpc/mes-query.grpc.controller'

/** MesQueryModule wires the current ProductionSpec and Mold / Tooling query services and gRPC controllers. */
@Module({
  imports: [CqrsModule],
  providers: [MesMoldQueryService, ProductionSpecQueryService],
  controllers: [MesQueryGrpcController, ProductionSpecQueryGrpcController]
})
export class MesQueryModule {}
