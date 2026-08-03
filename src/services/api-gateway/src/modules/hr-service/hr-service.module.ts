import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { AuthGrpcAdapter } from '../auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter'
import { IdentityQueryGrpcAdapter } from '../auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { PermissionServiceProxyModule } from '../permission-service/permission-service.module'
import { TenantOrgServiceProxyModule } from '../tenant-org-service/tenant-org-service.module'
import { EmployeeOfficialPhotoAssetGrpcAdapter } from './adapters/employee-official-photo-asset-grpc.adapter'
import { HrManagementGrpcAdapter } from './adapters/hr-management-grpc.adapter'
import { PartyTenantQueryGrpcAdapter } from './adapters/party-tenant-query-grpc.adapter'
import { HrQueryGrpcAdapter } from './adapters/hr-query-grpc.adapter'
import { HrManagementService } from './hr-management.service'
import { HrManagementController } from './interface/http/controllers/hr-management.controller'
import { GatewayTrustedGrpcExecutionModule } from '../../common/grpc'

@Module({
  imports: [
    AuthorizationModule,
    GatewayTrustedGrpcExecutionModule,
    PermissionServiceProxyModule,
    GrpcTransportModule.forFeature([
      SERVICE_NAMES.HR,
      SERVICE_NAMES.AUTH,
      SERVICE_NAMES.IDENTITY,
      SERVICE_NAMES.PARTY
    ]),
    TenantOrgServiceProxyModule
  ],
  controllers: [HrManagementController],
  providers: [
    HrQueryGrpcAdapter,
    HrManagementGrpcAdapter,
    EmployeeOfficialPhotoAssetGrpcAdapter,
    IdentityQueryGrpcAdapter,
    AuthGrpcAdapter,
    PartyTenantQueryGrpcAdapter,
    HrManagementService
  ]
})
export class HrServiceProxyModule {}
