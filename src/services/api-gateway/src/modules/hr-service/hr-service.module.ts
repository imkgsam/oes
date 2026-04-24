import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { AuthGrpcAdapter } from '../auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter'
import { IdentityQueryGrpcAdapter } from '../auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { PermissionServiceProxyModule } from '../permission-service/permission-service.module'
import { TenantOrgServiceProxyModule } from '../tenant-org-service/tenant-org-service.module'
import { HrManagementGrpcAdapter } from './adapters/hr-management-grpc.adapter'
import { HrQueryGrpcAdapter } from './adapters/hr-query-grpc.adapter'
import { HrManagementService } from './hr-management.service'
import { HrManagementController } from './interface/http/controllers/hr-management.controller'

@Module({
  imports: [
    AuthorizationModule,
    PermissionServiceProxyModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.HR, SERVICE_NAMES.AUTH, SERVICE_NAMES.IDENTITY]),
    TenantOrgServiceProxyModule
  ],
  controllers: [HrManagementController],
  providers: [
    HrQueryGrpcAdapter,
    HrManagementGrpcAdapter,
    IdentityQueryGrpcAdapter,
    AuthGrpcAdapter,
    HrManagementService
  ]
})
export class HrServiceProxyModule {}
