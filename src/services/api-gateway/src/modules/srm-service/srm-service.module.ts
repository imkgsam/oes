import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { SupplierManagementGrpcAdapter } from './adapters/supplier-management-grpc.adapter'
import { SupplierQueryGrpcAdapter } from './adapters/supplier-query-grpc.adapter'
import { SupplierManagementController } from './interface/http/controllers/supplier-management.controller'
import { SupplierManagementService } from './supplier-management.service'

@Module({
  imports: [
    AuthorizationModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.SRM])
  ],
  controllers: [SupplierManagementController],
  providers: [
    SupplierQueryGrpcAdapter,
    SupplierManagementGrpcAdapter,
    SupplierManagementService
  ]
})
// SrmServiceProxyModule wires the thin tenant supplier-management BFF proxy into api-gateway.
export class SrmServiceProxyModule {}
