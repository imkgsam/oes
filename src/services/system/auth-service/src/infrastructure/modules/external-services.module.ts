import { Module } from '@nestjs/common'
import { HR_SERVICE, IDENTITY_SERVICE, PERMISSION_SERVICE } from '@oes/common/constants'
import { TENANT_LIFECYCLE_ACCESS_PORT } from '../../common/constants/injection-tokens'
import {
  IdentityServiceAdaptor,
  HrServiceAdaptor,
  PermissionServiceAdaptor,
  TenantOrgLifecycleGrpcAdaptor
} from '../adaptors'
import { AuthTrustedExecutionModule } from '../../modules/auth/auth-trusted-execution.module'

@Module({
  imports: [AuthTrustedExecutionModule],
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
    }
  ],
  exports: [
    IDENTITY_SERVICE,
    HR_SERVICE,
    PERMISSION_SERVICE,
    TENANT_LIFECYCLE_ACCESS_PORT
  ]
})
export class ExternalServicesModule {}
