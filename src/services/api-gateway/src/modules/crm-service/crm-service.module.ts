import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { IdentityQueryGrpcAdapter } from '../auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { CustomerManagementGrpcAdapter } from './adapters/customer-management-grpc.adapter'
import { CustomerQueryGrpcAdapter } from './adapters/customer-query-grpc.adapter'
import { CustomerManagementController } from './interface/http/controllers/customer-management.controller'
import { CustomerManagementService } from './customer-management.service'

@Module({
  imports: [
    AuthorizationModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.CRM, SERVICE_NAMES.IDENTITY])
  ],
  controllers: [CustomerManagementController],
  providers: [
    CustomerQueryGrpcAdapter,
    CustomerManagementGrpcAdapter,
    IdentityQueryGrpcAdapter,
    CustomerManagementService
  ]
})
// CrmServiceProxyModule wires the thin tenant customer-management BFF proxy into api-gateway.
export class CrmServiceProxyModule {}
