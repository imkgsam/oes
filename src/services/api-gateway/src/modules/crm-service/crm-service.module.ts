import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { CustomerManagementGrpcAdapter } from './adapters/customer-management-grpc.adapter'
import { CustomerQueryGrpcAdapter } from './adapters/customer-query-grpc.adapter'
import { CustomerManagementController } from './interface/http/controllers/customer-management.controller'
import { CustomerManagementService } from './customer-management.service'

@Module({
  imports: [AuthorizationModule, GrpcTransportModule.forFeature([SERVICE_NAMES.CRM])],
  controllers: [CustomerManagementController],
  providers: [
    CustomerQueryGrpcAdapter,
    CustomerManagementGrpcAdapter,
    CustomerManagementService
  ]
})
// CrmServiceProxyModule wires the thin tenant customer-management BFF proxy into api-gateway.
export class CrmServiceProxyModule {}
