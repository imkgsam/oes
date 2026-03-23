import { Module } from '@nestjs/common'
import { GrpcTransportModule } from '@oes/common/transport'
import { PERMISSION_MANAGEMENT_PORT } from '@oes/common/constants'
import { SecurityModule } from '@oes/common/security'
import { DownstreamGrpcMetadataFactory } from '../../common/grpc/downstream-grpc-metadata.factory'
import { PermissionManagementGrpcAdapter } from './adapters/permission-management-grpc.adapter'
import { PermissionProxyService } from './permission-service.service'
import { httpControllers } from './interface/http/controllers'

@Module({
  imports: [SecurityModule, GrpcTransportModule.forFeature(['permission-service'])],
  controllers: [...httpControllers],
  providers: [
    DownstreamGrpcMetadataFactory,
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
