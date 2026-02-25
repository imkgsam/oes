import { Module } from '@nestjs/common'
import { GrpcTransportModule } from '@oes/common/transport/grpc/grpc-transport.module'
import { AuthController } from './controllers/auth.controller'
import { AuthServiceService } from './auth-service.service'

@Module({
  imports: [GrpcTransportModule.forFeature(['auth-service'])],
  controllers: [AuthController],
  providers: [AuthServiceService]
})
export class AuthServiceProxyModule {}
