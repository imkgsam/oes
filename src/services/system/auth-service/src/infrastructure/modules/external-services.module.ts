import { Module } from '@nestjs/common'
import { IDENTITY_SERVICE, PERMISSION_SERVICE } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { IdentityServiceAdaptor, PermissionServiceAdaptor } from '../adaptors'

@Module({
  imports: [GrpcTransportModule.forFeature(['identity-service', 'permission-service'])],
  providers: [
    {
      provide: IDENTITY_SERVICE,
      useClass: IdentityServiceAdaptor
    },
    {
      provide: PERMISSION_SERVICE,
      useClass: PermissionServiceAdaptor
    }
  ],
  exports: [IDENTITY_SERVICE, PERMISSION_SERVICE]
})
export class ExternalServicesModule {}
