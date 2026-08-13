import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { GatewayMesGrpcClient, GatewayTrustedGrpcExecutionModule } from '../../common/grpc'
import { MesManagementGrpcAdapter } from './adapters/mes-management-grpc.adapter'
import { MesQueryGrpcAdapter } from './adapters/mes-query-grpc.adapter'
import { MesController } from './interface/http/controllers/mes.controller'
import { MesService } from './mes.service'

@Module({
  imports: [AuthorizationModule, GatewayTrustedGrpcExecutionModule],
  controllers: [MesController],
  providers: [GatewayMesGrpcClient, MesQueryGrpcAdapter, MesManagementGrpcAdapter, MesService]
})
// MesServiceProxyModule wires the first-stage MES mold-management BFF proxy into api-gateway.
export class MesServiceProxyModule {}
