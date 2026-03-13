import { Module } from '@nestjs/common'
import { IdentityServiceService } from './identity-service.service'
import { httpControllers } from './interfaces/http/controllers'
import { GrpcTransportModule } from '@oes/common/transport'

@Module({
  imports: [GrpcTransportModule.forFeature(['identity-service'])],
  providers: [IdentityServiceService],
  controllers: [...httpControllers]
})
export class IdentityServiceModule {}
