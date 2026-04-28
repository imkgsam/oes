import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { ProcurementManagementGrpcAdapter } from './adapters/procurement-management-grpc.adapter'
import { ProcurementQueryGrpcAdapter } from './adapters/procurement-query-grpc.adapter'
import { ProcurementController } from './interface/http/controllers/procurement.controller'
import { ProcurementService } from './procurement.service'

@Module({
  imports: [
    AuthorizationModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.PROCUREMENT])
  ],
  controllers: [ProcurementController],
  providers: [
    ProcurementQueryGrpcAdapter,
    ProcurementManagementGrpcAdapter,
    ProcurementService
  ]
})
// ProcurementServiceProxyModule wires the thin tenant procurement-management BFF proxy into api-gateway.
export class ProcurementServiceProxyModule {}
