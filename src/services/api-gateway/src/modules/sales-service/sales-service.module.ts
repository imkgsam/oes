import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { GrpcTransportModule } from '@oes/common/transport'
import { PricingManagementGrpcAdapter } from './adapters/pricing-management-grpc.adapter'
import { PricingQueryGrpcAdapter } from './adapters/pricing-query-grpc.adapter'
import { SalesManagementGrpcAdapter } from './adapters/sales-management-grpc.adapter'
import { SalesQueryGrpcAdapter } from './adapters/sales-query-grpc.adapter'
import { SalesController } from './interface/http/controllers/sales.controller'
import { SalesService } from './sales.service'

@Module({
  imports: [AuthorizationModule, GrpcTransportModule.forFeature(['sales-service'])],
  controllers: [SalesController],
  providers: [
    SalesQueryGrpcAdapter,
    SalesManagementGrpcAdapter,
    PricingQueryGrpcAdapter,
    PricingManagementGrpcAdapter,
    SalesService
  ]
})
// SalesServiceProxyModule wires the minimum sales quote-order BFF proxy into api-gateway.
export class SalesServiceProxyModule {}
