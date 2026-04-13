import { Module } from '@nestjs/common'
import { IDENTITY_SERVICE, PERMISSION_SERVICE, SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import {
  IdentityServiceAdaptor,
  NotificationServiceGrpcAdaptor,
  PermissionServiceAdaptor
} from '../adaptors'

@Module({
  imports: [
    GrpcTransportModule.forFeature([
      SERVICE_NAMES.IDENTITY,
      SERVICE_NAMES.PERMISSION,
      SERVICE_NAMES.NOTIFICATION
    ])
  ],
  providers: [
    {
      provide: IDENTITY_SERVICE,
      useClass: IdentityServiceAdaptor
    },
    {
      provide: PERMISSION_SERVICE,
      useClass: PermissionServiceAdaptor
    },
    NotificationServiceGrpcAdaptor
  ],
  exports: [
    GrpcTransportModule,
    IDENTITY_SERVICE,
    PERMISSION_SERVICE,
    NotificationServiceGrpcAdaptor
  ]
})
export class ExternalServicesModule {}
