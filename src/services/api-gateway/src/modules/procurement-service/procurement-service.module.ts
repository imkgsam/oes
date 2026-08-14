import { Module } from '@nestjs/common'
import { GatewayTrustedGrpcExecutionModule } from '../../common/grpc/gateway-trusted-grpc-execution.module'
import { ProcurementManagementGrpcAdapter } from './adapters/procurement-management-grpc.adapter'
import { ProcurementQueryGrpcAdapter } from './adapters/procurement-query-grpc.adapter'
import { ProcurementController } from './interface/http/controllers/procurement.controller'
import { ProcurementService } from './procurement.service'

@Module({
  imports: [GatewayTrustedGrpcExecutionModule],
  controllers: [ProcurementController],
  providers: [ProcurementQueryGrpcAdapter, ProcurementManagementGrpcAdapter, ProcurementService]
})
// ProcurementServiceProxyModule wires the thin tenant procurement-management BFF proxy into api-gateway.
export class ProcurementServiceProxyModule {}
