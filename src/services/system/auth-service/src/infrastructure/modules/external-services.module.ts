import { Module } from '@nestjs/common'
import { IDENTITY_SERVICE, PERMISSION_SERVICE, SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { TENANT_LIFECYCLE_ACCESS_PORT } from '../../common/constants/injection-tokens'
import {
  IdentityServiceAdaptor,
  NotificationServiceGrpcAdaptor,
  PermissionServiceAdaptor,
  TenantOrgLifecycleGrpcAdaptor
} from '../adaptors'

@Module({
  imports: [
    GrpcTransportModule.forFeature([
      SERVICE_NAMES.IDENTITY,
      SERVICE_NAMES.PERMISSION,
      SERVICE_NAMES.NOTIFICATION,
      SERVICE_NAMES.TENANT_ORG
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
    {
      provide: TENANT_LIFECYCLE_ACCESS_PORT,
      useClass: TenantOrgLifecycleGrpcAdaptor
    },
    NotificationServiceGrpcAdaptor
  ],
  exports: [
    GrpcTransportModule,
    IDENTITY_SERVICE,
    PERMISSION_SERVICE,
    TENANT_LIFECYCLE_ACCESS_PORT,
    NotificationServiceGrpcAdaptor
  ]
})
export class ExternalServicesModule {}
