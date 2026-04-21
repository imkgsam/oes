import { Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { PERMISSION_MANAGEMENT_PORT } from '@oes/common/constants'
import { AuthorizationModule } from '@oes/common/authorization'
import { IdentityQueryGrpcAdapter } from './identity-query-grpc.adapter'
import { PolicyManagementGrpcAdapter } from './adapters/policy-management-grpc.adapter'
import { PermissionManagementGrpcAdapter } from './adapters/permission-management-grpc.adapter'
import { RoleManagementReadService } from './role-management-read.service'
import { PermissionProxyService } from './permission-service.service'
import { httpControllers } from './interface/http/controllers'

@Module({
  imports: [
    AuthorizationModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.IDENTITY, SERVICE_NAMES.PERMISSION])
  ],
  controllers: [...httpControllers],
  providers: [
    IdentityQueryGrpcAdapter,
    PermissionManagementGrpcAdapter,
    PolicyManagementGrpcAdapter,
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
