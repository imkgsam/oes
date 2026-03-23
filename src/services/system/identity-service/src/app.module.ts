import { Module } from '@nestjs/common'
import { SecurityModule } from '@oes/common/security'
import { NacosConfigModule } from '@oes/common/config'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { IdentityManagementModule } from './modules/identity-management/identity-management.module'
import { IdentityQueryModule } from './modules/identity-query/identity-query.module'

@Module({
  imports: [
    LoggingModule,
    RegistryModule,
    NacosConfigModule,
    SecurityModule,
    IdentityManagementModule,
    IdentityQueryModule
  ]
})
export class AppModule {}
