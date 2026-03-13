// File: src/services/system/auth-service/src/infrastructure/modules/external-services.module.ts
import { Module } from '@nestjs/common'
import { ClientModule, ServiceKeys } from '@oes/common/clients'
import { IdentityServiceAdaptor } from '../adaptors'
import { PermissionServiceAdaptor } from '../adaptors'
import { IDENTITY_SERVICE, PERMISSION_SERVICE } from '@oes/common/constants'

/**
 * 澶栭儴鏈嶅姟妯″潡
 *
 * 閰嶇疆 Auth Service 渚濊禆鐨勫閮ㄦ湇鍔″鎴风鍜岄€傞厤鍣? */
@Module({
  imports: [
    // 娉ㄥ唽澶栭儴鏈嶅姟瀹㈡埛绔?    ClientModule.register([
      ServiceKeys.IDENTITY_TCP,
      ServiceKeys.PERMISSION_TCP,
      ServiceKeys.NOTIFICATION_TCP,
      ServiceKeys.AUDIT_TCP
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
    }
  ],
  exports: [IDENTITY_SERVICE, PERMISSION_SERVICE]
})
export class ExternalServicesModule {}
