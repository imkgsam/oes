import { Module } from '@nestjs/common'
import { HR_SERVICE, IDENTITY_SERVICE, PERMISSION_SERVICE, SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { TENANT_LIFECYCLE_ACCESS_PORT } from '../../common/constants/injection-tokens'
import {
  IdentityServiceAdaptor,
  HrServiceAdaptor,
  NotificationServiceGrpcAdaptor,
  PermissionServiceAdaptor,
  TenantOrgLifecycleGrpcAdaptor
} from '../adaptors'

@Module({
  imports: [
    GrpcTransportModule.forFeature([
      SERVICE_NAMES.IDENTITY,
      SERVICE_NAMES.HR,
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
      provide: HR_SERVICE,
      useClass: HrServiceAdaptor
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
    HR_SERVICE,
    PERMISSION_SERVICE,
    TENANT_LIFECYCLE_ACCESS_PORT,
    NotificationServiceGrpcAdaptor
  ]
})
export class ExternalServicesModule {}
