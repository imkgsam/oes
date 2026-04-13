import { Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { PERMISSION_MANAGEMENT_PORT } from '@oes/common/constants'
import { AuthorizationModule } from '@oes/common/authorization'
import { PermissionManagementGrpcAdapter } from './adapters/permission-management-grpc.adapter'
import { PermissionProxyService } from './permission-service.service'
import { httpControllers } from './interface/http/controllers'

@Module({
  imports: [AuthorizationModule, GrpcTransportModule.forFeature([SERVICE_NAMES.PERMISSION])],
  controllers: [...httpControllers],
  providers: [
    PermissionManagementGrpcAdapter,
    {
      provide: PERMISSION_MANAGEMENT_PORT,
      useExisting: PermissionManagementGrpcAdapter
    },
    PermissionProxyService
  ],
  exports: [PERMISSION_MANAGEMENT_PORT]
})
export class PermissionServiceProxyModule {}
