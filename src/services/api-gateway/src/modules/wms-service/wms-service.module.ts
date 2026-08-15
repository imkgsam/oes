import { Module } from '@nestjs/common'
import { GatewayTrustedGrpcExecutionModule } from '../../common/grpc/gateway-trusted-grpc-execution.module'
import { WmsManagementGrpcAdapter } from './adapters/wms-management-grpc.adapter'
import { WmsQueryGrpcAdapter } from './adapters/wms-query-grpc.adapter'
import { WmsController } from './interface/http/controllers/wms.controller'
import { WmsService } from './wms.service'

@Module({
  imports: [GatewayTrustedGrpcExecutionModule],
  controllers: [WmsController],
  providers: [WmsQueryGrpcAdapter, WmsManagementGrpcAdapter, WmsService]
})
// WmsServiceProxyModule wires the thin tenant WMS BFF proxy into api-gateway.
export class WmsServiceProxyModule {}
