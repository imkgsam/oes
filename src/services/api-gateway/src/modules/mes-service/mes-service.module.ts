import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { MesManagementGrpcAdapter } from './adapters/mes-management-grpc.adapter'
import { MesQueryGrpcAdapter } from './adapters/mes-query-grpc.adapter'
import { MesController } from './interface/http/controllers/mes.controller'
import { MesService } from './mes.service'

@Module({
  imports: [AuthorizationModule, GrpcTransportModule.forFeature([SERVICE_NAMES.MES])],
  controllers: [MesController],
  providers: [MesQueryGrpcAdapter, MesManagementGrpcAdapter, MesService]
})
// MesServiceProxyModule wires the first-stage MES mold-management BFF proxy into api-gateway.
export class MesServiceProxyModule {}
