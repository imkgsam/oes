import { Module } from '@nestjs/common'
import { GrpcTransportModule } from '@oes/common/transport/grpc/grpc-transport.module'
import { PERMISSION_MANAGEMENT_PORT } from '@oes/common/constants/enums/service.symbols'
import { PermissionManagementGrpcAdapter } from './adapters/permission-management-grpc.adapter'
import { PermissionProxyService } from './permission-service.service'
import { httpControllers } from './interface/http/controllers'

@Module({
  imports: [GrpcTransportModule.forFeature(['permission-service'])],
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
