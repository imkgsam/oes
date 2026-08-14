import { Module } from '@nestjs/common'
import { GatewayTrustedGrpcExecutionModule } from '../../common/grpc/gateway-trusted-grpc-execution.module'
import { SupplierManagementGrpcAdapter } from './adapters/supplier-management-grpc.adapter'
import { SupplierQueryGrpcAdapter } from './adapters/supplier-query-grpc.adapter'
import { SupplierManagementController } from './interface/http/controllers/supplier-management.controller'
import { SupplierManagementService } from './supplier-management.service'

@Module({
  imports: [GatewayTrustedGrpcExecutionModule],
  controllers: [SupplierManagementController],
  providers: [SupplierQueryGrpcAdapter, SupplierManagementGrpcAdapter, SupplierManagementService]
})
// SrmServiceProxyModule wires the thin tenant supplier-management BFF proxy into api-gateway.
export class SrmServiceProxyModule {}
