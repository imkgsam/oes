import { Module } from '@nestjs/common'
import { IdentityServiceService } from './identity-service.service'
import { AdminController } from './controllers/admin.controller'
import { GrpcTransportModule } from '@oes/common/transport/grpc/grpc-transport.module'

@Module({
  imports: [GrpcTransportModule.forFeature(['identity-service'])],
  providers: [IdentityServiceService],
  controllers: [AdminController]
})
export class IdentityServiceModule {}
