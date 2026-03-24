import { Module } from '@nestjs/common'
import { IdentityServiceService } from './identity-service.service'
import { httpControllers } from './interfaces/http/controllers'
import { GrpcTransportModule } from '@oes/common/transport'

// OUTDATED: this module still registers the placeholder identity HTTP proxy.
// The active gateway app module does not enable it, and it should stay disabled until a real proxy is implemented against current gRPC contracts.
@Module({
  imports: [GrpcTransportModule.forFeature(['identity-service'])],
  providers: [IdentityServiceService],
  controllers: [...httpControllers]
})
export class IdentityServiceModule {}
