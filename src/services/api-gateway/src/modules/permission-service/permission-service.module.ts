import { Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { PERMISSION_MANAGEMENT_PORT } from '@oes/common/constants'
import { AuthorizationModule } from '@oes/common/authorization'
import { PolicyManagementGrpcAdapter } from './adapters/policy-management-grpc.adapter'
import { PolicyInstanceManagementGrpcAdapter } from './adapters/policy-instance-management-grpc.adapter'
import { PolicyInstancePreviewGrpcAdapter } from './adapters/policy-instance-preview-grpc.adapter'
import { PermissionManagementGrpcAdapter } from './adapters/permission-management-grpc.adapter'
import { RoleManagementReadService } from './role-management-read.service'
import { PermissionProxyService } from './permission-service.service'
import { TenantOrgQueryGrpcAdapter } from './tenant-org-query-grpc.adapter'
import { httpControllers } from './interface/http/controllers'

@Module({
  imports: [
    AuthorizationModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.PERMISSION, SERVICE_NAMES.TENANT_ORG])
  ],
  controllers: [...httpControllers],
  providers: [
    TenantOrgQueryGrpcAdapter,
    PermissionManagementGrpcAdapter,
    PolicyManagementGrpcAdapter,
    PolicyInstanceManagementGrpcAdapter,
    PolicyInstancePreviewGrpcAdapter,
    RoleManagementReadService,
    {
      provide: PERMISSION_MANAGEMENT_PORT,
      useExisting: PermissionManagementGrpcAdapter
    },
    PermissionProxyService
  ],
  exports: [PERMISSION_MANAGEMENT_PORT, PermissionProxyService]
})
export class PermissionServiceProxyModule {}
