import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { WmsManagementGrpcAdapter } from './adapters/wms-management-grpc.adapter'
import { WmsQueryGrpcAdapter } from './adapters/wms-query-grpc.adapter'
import { WmsController } from './interface/http/controllers/wms.controller'
import { WmsService } from './wms.service'

@Module({
  imports: [AuthorizationModule, GrpcTransportModule.forFeature([SERVICE_NAMES.WMS])],
  controllers: [WmsController],
  providers: [WmsQueryGrpcAdapter, WmsManagementGrpcAdapter, WmsService]
})
// WmsServiceProxyModule wires the thin tenant WMS BFF proxy into api-gateway.
export class WmsServiceProxyModule {}
