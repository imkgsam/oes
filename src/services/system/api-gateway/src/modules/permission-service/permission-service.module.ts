import { Module } from '@nestjs/common'
import { GrpcTransportModule } from '@oes/common/transport/grpc/grpc-transport.module'
import { PermissionServiceService } from './permission-service.service'
import { httpControllers } from './interface/http/controllers'

@Module({
  imports: [GrpcTransportModule.forFeature(['permission-service'])],
  controllers: [...httpControllers],
  providers: [PermissionServiceService]
})
export class PermissionServiceModule {}
