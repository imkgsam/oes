import { Module } from '@nestjs/common'
import { NacosConfigModule } from '@oes/common/config'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { IdentityQueryModule } from './modules/identity-query/identity-query.module'

@Module({
  imports: [
    LoggingModule,
    RegistryModule,
    NacosConfigModule,
    IdentityQueryModule
  ]
})
export class AppModule {}
